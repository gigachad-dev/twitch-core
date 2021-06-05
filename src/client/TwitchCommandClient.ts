import path from 'path'
import winston from 'winston'
import EventEmitter from 'events'
import tmi, { Client, ChatUserstate } from 'tmi.js'
import readdir from 'recursive-readdir-sync'

import { ClientLogger } from './ClientLogger'
import { EmotesManager } from '../emotes/EmotesManager'
import { CommandConstants } from './CommandConstants'
import { CommandSQLiteProvider } from '../settings/CommandSQLiteProvider'
import { CommandParser, CommandParserResult } from '../commands/CommandParser'
import { TwitchChatUser } from '../users/TwitchChatUser'
import { TwitchChatChannel } from '../channels/TwitchChatChannel'
import { TwitchChatMessage } from '../messages/TwitchChatMessage'
import { TwitchChatCommand, ExternalCommandOptions } from '../commands/TwitchChatCommand'

interface ClientOptions {
  /**
   * Enable verbose logging (default: false)
   */
  verboseLogging?: boolean

  /**
   * Bot username
   */
  username: string

  /**
   * Bot oauth password (without oauth:)
   */
  oauth: string

  /**
   * List of bot owners username (default: empty array)
   */
  botOwners?: string[]

  /**
   * Default command prefix (default: !)
   */
  prefix?: string

  /**
   * Denotes if the bot must send a message when join a channel (default: false)
   */
  greetOnJoin?: boolean

  /**
   * Initials channels to join (default: empty array)
   */
  channels: string[]

  /**
   * On Join message (sent if greetOnJoin = true)
   */
  onJoinMessage?: string

  /**
   * Denotes if the bot must autojoin its own channel (default: false)
   */
  autoJoinBotChannel?: boolean

  /**
   * Denotes if enable the !join and !part command in bot channel (default: true)
   */
  enableJoinCommand?: boolean

  /**
   * Define the bot type, will be used for message limits control. See CommandConstants for available bot type values (default: BOT_TYPE_NORMAL)
   */
  botType?: keyof typeof CommandConstants.MESSAGE_LIMITS

  /**
   * Enable Rate Limiting control (default: true)
   */
  enableRateLimitingControl?: boolean

  /**
   * Enable verbose logging
   */
  enableVerboseLogging?: boolean
}

type ChatterState = ChatUserstate & { message: string }

class TwitchCommandClient extends EventEmitter {
  public options: ClientOptions
  private tmi: Client
  public verboseLogging: boolean
  readonly commands: TwitchChatCommand[]
  public emotesManager: EmotesManager
  public logger: winston.Logger
  private channelsWithMod: string[]
  private messagesCounterInterval: NodeJS.Timeout
  private messagesCount: number
  private settingsProvider: CommandSQLiteProvider
  private parser: CommandParser

  constructor(options: ClientOptions) {
    super()

    const defaultOptions = {
      prefix: '!',
      channels: [],
      botOwners: [],
      onJoinMessage: '',
      greetOnJoin: false,
      autoJoinBotChannel: false,
      enableJoinCommand: true,
      enableVerboseLogging: false,
      enableRateLimitingControl: true,
      botType: CommandConstants.BOT_TYPE_NORMAL
    }

    this.options = Object.assign(defaultOptions, options)
    this.tmi = null
    this.verboseLogging = this.options.enableVerboseLogging
    this.commands = []
    this.emotesManager = null
    this.logger = new ClientLogger().getLogger('main')
    this.channelsWithMod = []
    this.messagesCounterInterval = null
    this.messagesCount = 0
  }

  /**
   * ???
   */
  configureClient() { }

  /**
   * Enable verbose logging
   */
  enableVerboseLogging() {
    this.verboseLogging = true
  }

  checkOptions() {
    if (this.options.prefix === '/') {
      throw new Error('Invalid prefix. Cannot be /')
    }

    if (this.options.username === undefined) {
      throw new Error('Username not specified')
    }

    if (this.options.oauth === undefined) {
      throw new Error('Oauth password not specified')
    }
  }

  /**
   * Connect the bot to Twitch Chat
   */
  async connect() {
    this.checkOptions()

    this.configureClient()

    this.emotesManager = new EmotesManager(this)
    await this.emotesManager.getGlobalEmotes()

    this.logger.info('Current default prefix is ' + this.options.prefix)

    this.logger.info('Connecting to Twitch Chat')

    const autoJoinChannels = this.options.channels

    // TODO: SettingsProvider
    // const channelsFromSettings = await this.settingsProvider.get(CommandConstants.GLOBAL_SETTINGS_KEY, 'channels', [])

    const channels = [...autoJoinChannels /*...channelsFromSettings*/]

    if (this.options.autoJoinBotChannel) {
      channels.push('#' + this.options.username)
    }

    this.logger.info('Autojoining ' + channels.length + ' channels')

    this.tmi = new tmi.client({
      options: {
        debug: this.verboseLogging
      },
      connection: {
        secure: true,
        reconnect: true
      },
      identity: {
        username: this.options.username,
        password: 'oauth:' + this.options.oauth
      },
      channels: channels,
      logger: this.logger
    })

    this.tmi.on('connected', this.onConnect.bind(this))

    this.tmi.on('disconnected', this.onDisconnect.bind(this))

    this.tmi.on('join', this.onJoin.bind(this))

    this.tmi.on('reconnect', this.onReconnect.bind(this))

    this.tmi.on('timeout', this.onTimeout.bind(this))

    this.tmi.on('mod', this.onMod.bind(this))

    this.tmi.on('unmod', this.onUnmod.bind(this))

    // ???
    // this.tmi.on('error', this.onError.bind(this))

    this.tmi.on('message', this.onMessage.bind(this))

    // ???
    // this.tmi.on('raided', this.onRaided.bind(this))

    await this.tmi.connect()
  }

  /**
   * Send a text message in the channel
   *
   * @param channel
   * @param message
   * @param addRandomEmote
   */
  async say(channel: string, message: string, addRandomEmote = false) {
    if (this.checkRateLimit()) {
      if (addRandomEmote) {
        message += ' ' + this.emotesManager.getRandomEmote().code
      }

      const serverResponse = await this.tmi.say(channel, message)

      if (this.messagesCount === 0) {
        this.startMessagesCounterInterval()
      }

      this.messagesCount = this.messagesCount + 1

      return serverResponse
    } else {
      this.logger.warn('Rate limit excedeed. Wait for timer reset.')
    }
  }

  /**
   * Send an action message in the channel
   *
   * @param channel
   * @param message
   * @param addRandomEmote
   */
  async action(channel: string, message: string, addRandomEmote = false) {
    if (this.checkRateLimit()) {
      if (addRandomEmote) {
        message += ' ' + this.emotesManager.getRandomEmote().code
      }

      const serverResponse = await this.tmi.action(channel, message)

      if (this.messagesCount === 0) {
        this.startMessagesCounterInterval()
      }

      this.messagesCount = this.messagesCount + 1

      return serverResponse
    } else {
      this.logger.warn('Rate limit excedeed. Wait for timer reset.')
    }
  }

  /**
   * Send a private message to the user with given text
   *
   * @param username
   * @param message
   */
  async whisper(username: string, message: string) {
    const serverResponse = await this.tmi.whisper(username, message)
    return serverResponse
  }

  /**
   * Register commands in given path (recursive)
   *
   * @param path
   * @param options
   */
  registerCommandsIn(path: string, options?: ExternalCommandOptions) {
    const files = readdir(path)

    if (options) {
      this.logger.info(`External command options: ${Object.keys(options).length}`)
    }

    files.forEach((file: string) => {
      if (!file.match('.*(?<!\.d\.ts)$')) return

      let commandFile = require(file)

      if (typeof commandFile.default === 'function') {
        commandFile = commandFile.default
      }

      if (typeof commandFile === 'function') {
        const name = commandFile.name as string

        if (options) {
          if (options[name]) {
            this.commands.push(new commandFile(this, options[name]))
          } else {
            this.logger.warn(`${commandFile.name} config is not found`)
          }
        } else {
          this.commands.push(new commandFile(this))
        }

        this.logger.info(`Register command ${name}`)
      } else {
        this.logger.warn('You are not export default class correctly!')
      }
    }, this)

    this.parser = new CommandParser(this.commands, this)
  }

  /**
   * Register default commands
   */
  registerDefaultCommands() {
    this.registerCommandsIn(path.join(__dirname, '../commands/default'))
  }

  findCommand(parserResult: CommandParserResult) {
    let command: TwitchChatCommand

    this.commands.forEach(v => {
      if (parserResult.command === v.options.name) command = v

      if (
        !command &&
        v.options.aliases &&
        v.options.aliases.length > 0
      ) {
        if (v.options.aliases.includes(parserResult.command)) command = v
      }
    }, this)

    return command
  }

  /**
   * Execute command method
   *
   * @param command
   * @param msg
   */
  executeCommandMethod(command: string, msg: TwitchChatMessage) {
    this.findCommand({ command })?.execute(msg)
  }

  /**
   * Bot connected
   */
  onConnect() {
    this.emit('connected')
  }

  /**
   * Channel joined or someone join the channel
   *
   * @param channel
   * @param username
   */
  onJoin(channel: string, username: string) {
    const channelObject = new TwitchChatChannel({ channel }, this)

    if (
      this.options.greetOnJoin &&
      this.getUsername() === username &&
      this.options?.onJoinMessage !== ''
    ) {
      this.action(channel, this.options.onJoinMessage)
    }

    this.emit('join', channelObject, username)
  }

  /**
   * Bot disconnects
   */
  onDisconnect() {
    this.emit('disconnected')
  }

  /**
   * Command executed
   *
   * @param channel
   * @param userstate
   * @param messageText
   * @param self
   */
  async onMessage(channel: string, userstate: ChatUserstate, messageText: string, self: boolean) {
    if (self) return

    const chatter = { ...userstate, message: messageText } as ChatterState
    const msg = new TwitchChatMessage(chatter, channel, this)

    if (msg.author.username === this.getUsername()) {
      if (!(msg.author.isBroadcaster ||
        msg.author.isModerator ||
        msg.author.isVip
      )) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    if (this.verboseLogging) this.logger.info(msg)
    this.emit('message', msg)

    // TODO: SettingsProvider
    // const prefix = await this.settingsProvider.get(
    //     message.channel.name,
    //     'prefix', this.options.prefix
    // )

    const prefix = this.options.prefix
    const parserResult = this.parser.parse(messageText, prefix)

    if (parserResult) {
      if (this.verboseLogging) this.logger.info(parserResult)

      const command = this.findCommand(parserResult)

      if (command) {
        const preValidateResponse = command.preValidate(msg)

        if (typeof preValidateResponse !== 'string') {
          command
            .prepareRun(msg, parserResult.args)
            .then(commandResult => {
              this.emit('commandExecuted', commandResult)
            })
            .catch((err: string) => {
              msg.reply('Unexpected error: ' + err)
              this.emit('commandError', err)
            })
        } else {
          msg.reply(preValidateResponse, true)
        }
      }
    }
  }

  // TODO: ??
  // onRaided(action) {}

  // TODO: ???
  // onAction(action) { }

  // TODO: ???
  // onBan(user, reason) { }

  // TODO: ???
  // onUnban(user) { }

  /**
   * Connection timeout
   *
   * @param channel
   * @param username
   * @param reason
   * @param duration
   */
  onTimeout(channel: string, username: string, reason: string, duration: string) {
    this.emit('timeout', channel, username, reason, duration)
  }

  /**
   * Reconnection
   */
  onReconnect() {
    this.emit('reconnect')
  }

  /**
   * Set Settings Provider class
   * TODO: SettingsProvider
   *
   * @param provider
   */
  // async setProvider(provider: CommandSQLiteProvider | PromiseLike<CommandSQLiteProvider>) {
  //     this.settingsProvider = await provider
  //     await this.settingsProvider.init(this)
  // }

  /**
   * Request the bot to join a channel
   *
   * @param channel
   */
  async join(channel: string) {
    return this.tmi.join(channel)
  }

  /**
   * Request the bot to leave a channel
   *
   * @param channel
   */
  async part(channel: string) {
    return this.tmi.part(channel)
  }

  /**
   * Gets the bot username
   */
  getUsername() {
    return this.tmi.getUsername()
  }

  /**
   * Gets the bot channels
   */
  getChannels() {
    return this.tmi.getChannels()
  }

  /**
   * Checks if the message author is one of bot owners
   *
   * @param author
   */
  isOwner(author: TwitchChatUser) {
    return this.options.botOwners.includes(author.username)
  }

  /**
   * Received mod role
   *
   * @param channel
   * @param username
   */
  onMod(channel: string, username: string) {
    if (
      username === this.getUsername() &&
      !this.channelsWithMod.includes(channel)
    ) {
      this.logger.debug('Bot has received mod role')
      this.channelsWithMod.push(channel)
    }

    this.emit('mod', channel, username)
  }

  /**
   * Emit error
   *
   * @param error
   */
  onError(error: unknown) {
    this.logger.error(error)
    this.emit('error', error)
  }

  /**
   * Unmod bot
   * @param channel
   * @param username
   */
  onUnmod(channel: string, username: string) {
    if (username === this.getUsername()) {
      this.logger.debug('Bot has received unmod')
      this.channelsWithMod = this.channelsWithMod.filter(v => {
        return v !== channel
      })
    }

    this.emit('onumod', channel, username)
  }

  /**
   * Start messages counting
   */
  private startMessagesCounterInterval() {
    if (this.options.enableRateLimitingControl) {
      if (this.verboseLogging) {
        this.logger.debug('Starting messages counter interval')
      }

      const messageLimits = CommandConstants.MESSAGE_LIMITS[this.options.botType]

      this.messagesCounterInterval = setInterval(
        this.resetMessageCounter.bind(this),
        messageLimits.timespan * 1000
      )
    }
  }

  /**
   * Reset message counter
   */
  private resetMessageCounter() {
    if (this.verboseLogging) this.logger.debug('Resetting messages count')

    this.messagesCount = 0
  }

  /**
   * Check if the bot sent too many messages in timespan limit
   */
  private checkRateLimit() {
    if (this.options.enableRateLimitingControl) {
      const messageLimits = CommandConstants.MESSAGE_LIMITS[this.options.botType]

      if (this.verboseLogging) {
        this.logger.warn('Messages count: ' + this.messagesCount)
      }

      if (this.messagesCount < messageLimits.messages) {
        return true
      } else {
        return false
      }
    } else {
      return true
    }
  }
}

export { TwitchCommandClient, ClientOptions, ChatterState }