import path from 'path'
import winston from 'winston'
import EventEmitter from 'events'
import tmi, { Client, ChatUserstate } from 'tmi.js'
import readdir from 'recursive-readdir-sync'

import { Server } from '../server/Server'
import { ClientLogger } from './ClientLogger'
import { EmotesManager } from '../emotes/EmotesManager'
import { CommandConstants } from './CommandConstants'
import { CommandParser, CommandArguments } from '../commands/CommandParser'
import { TwitchChatUser } from '../users/TwitchChatUser'
import { TwitchChatChannel } from '../channels/TwitchChatChannel'
import { TwitchChatMessage } from '../messages/TwitchChatMessage'
import { TwitchChatCommand, CommandProvider } from '../commands/TwitchChatCommand'
import { SettingsProvider } from '../settings/SettingsProvider'

type MessageLimits = keyof typeof CommandConstants.MESSAGE_LIMITS

interface TwitchOptions {
  /**
   * Twitch OAuth token
   */
  oauthToken: string

  /**
   * https://dev.twitch.tv/docs/authentication#refreshing-access-tokens
   */
  refreshToken: string

  /**
   * https://dev.twitch.tv/console/apps
   */
  clientId: string
  secretToken: string

  /**
   * https://dev.twitch.tv/docs/authentication#scopes
   */
  scopes: string[]
}

interface ClientOptions {
  /**
   * Bot username
   */
  username: string

  /**
   * Bot oauth password (without oauth:)
   */
  oauth: string

  /**
   * Initials channels to join (default: empty array)
   */
  channels: string[]

  /**
   * List of bot owners username (default: empty array)
   */
  botOwners?: string[]

  /**
   * Express server port (default: 8080)
   */
  serverPort?: number

  /**
   * Default command prefix (default: !)
   */
  prefix?: string

  /**
   * Denotes if the bot must send a message when join a channel (default: false)
   */
  greetOnJoin?: boolean

  /**
   * On Join message (sent if greetOnJoin = true)
   */
  onJoinMessage?: string

  /**
   * Denotes if the bot must autojoin its own channel (default: false)
   */
  autoJoinBotChannel?: boolean

  /**
   * Enable verbose logging (default: false)
   */
  verboseLogging?: boolean

  /**
   * Define the bot type, will be used for message limits control.
   * See CommandConstants for available bot type values (default: 'BOT_TYPE_NORMAL')
   */
  botType?: MessageLimits

  /**
   * Enable Rate Limiting control (default: true)
   */
  enableRateLimitingControl?: boolean
}

type ChatterState = ChatUserstate & { message: string }

class TwitchCommandClient extends EventEmitter {
  readonly logger: winston.Logger

  private tmi: Client
  private channelsWithMod: string[]
  private parser: CommandParser
  private server: Server

  public options: ClientOptions
  public commands: TwitchChatCommand[]
  public emotesManager: EmotesManager
  public provider: SettingsProvider
  public messagesCounterInterval: NodeJS.Timeout
  public messagesCount: number

  constructor(options: ClientOptions) {
    super()

    const defaultOptions = {
      prefix: '!',
      channels: [],
      botOwners: [],
      serverPort: 8080,
      onJoinMessage: '',
      greetOnJoin: false,
      verboseLogging: false,
      autoJoinBotChannel: false,
      enableRateLimitingControl: true,
      botType: CommandConstants.BOT_TYPE_NORMAL
    }

    this.options = Object.assign(defaultOptions, options)
    this.server = new Server(this, this.options.serverPort)
    this.provider = new SettingsProvider(this)
    this.logger = new ClientLogger().getLogger('main')
    this.commands = []
    this.channelsWithMod = []
    this.messagesCount = 0
  }

  private checkOptions() {
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
  async connect(): Promise<void> {
    this.server.start()
    this.checkOptions()

    this.emotesManager = new EmotesManager(this)
    await this.emotesManager.getGlobalEmotes()

    this.logger.info('Current default prefix is ' + this.options.prefix)
    this.logger.info('Connecting to Twitch Chat')

    const channels = [...this.options.channels]
    if (this.options.autoJoinBotChannel) {
      channels.push(this.options.username)
    }

    this.logger.info('Autojoining ' + channels.length + ' channels')

    this.tmi = new tmi.client({
      options: {
        debug: this.options.verboseLogging
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

    this.tmi.on('message', this.onMessage.bind(this))

    await this.tmi.connect()
  }

  /**
   * Send a text message in the channel
   *
   * @param channel
   * @param message
   * @param addRandomEmote
   */
  async say(channel: string, message: string, addRandomEmote = false): Promise<[string]> {
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
  async action(channel: string, message: string, addRandomEmote = false): Promise<[string]> {
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
  async whisper(username: string, message: string): Promise<[string, string]> {
    const serverResponse = await this.tmi.whisper(username, message)
    return serverResponse
  }

  /**
   * Register commands in given path (recursive)
   *
   * @param path
   * @param options
   */
  registerCommandsIn(path: string): void {
    const files = readdir(path)

    files.forEach((file: string) => {
      if (!file.match('.*(?<!\.d\.ts)$')) return

      let commandFile = require(file)

      if (typeof commandFile.default === 'function') {
        commandFile = commandFile.default
      }

      if (typeof commandFile === 'function') {
        const commandName = commandFile.name as string
        const provider = this.provider.get<CommandProvider>('commands')

        if (provider) {
          const options = provider.get(commandName).value()

          if (options) {
            this.commands.push(new commandFile(this, options))
          } else {
            this.logger.warn(`${commandName} config is not found`)
          }
        } else {
          this.commands.push(new commandFile(this))
        }

        this.logger.info(`Register command ${commandName}`)
      } else {
        this.logger.warn('You are not export default class correctly!')
      }
    }, this)

    this.parser = new CommandParser(this)
  }

  /**
   * Register default commands
   */
  registerDefaultCommands(): void {
    this.registerCommandsIn(path.join(__dirname, '../commands/default'))
  }

  findCommand(parserResult: CommandArguments): TwitchChatCommand {
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
  executeCommandMethod(command: string, msg: TwitchChatMessage): void {
    this.findCommand({ command })?.execute(msg)
  }

  /**
   * Bot connected
   */
  onConnect(): void {
    this.emit('connected')
  }

  /**
   * Channel joined or someone join the channel
   *
   * @param channel
   * @param username
   */
  onJoin(channel: string, username: string): void {
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
  onDisconnect(): void {
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
  private async onMessage(channel: string, userstate: ChatUserstate, messageText: string, self: boolean): Promise<void> {
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

    this.emit('message', msg)

    const parserResult = this.parser.parse(messageText, this.options.prefix)

    if (parserResult) {
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

  /**
   * Connection timeout
   *
   * @param channel
   * @param username
   * @param reason
   * @param duration
   */
  onTimeout(channel: string, username: string, reason: string, duration: string): void {
    this.emit('timeout', channel, username, reason, duration)
  }

  /**
   * Reconnection
   */
  onReconnect(): void {
    this.emit('reconnect')
  }

  /**
   * Request the bot to join a channel
   *
   * @param channel
   */
  async join(channel: string): Promise<[string]> {
    return this.tmi.join(channel)
  }

  /**
   * Request the bot to leave a channel
   *
   * @param channel
   */
  async part(channel: string): Promise<[string]> {
    return this.tmi.part(channel)
  }

  /**
   * Gets the bot username
   */
  getUsername(): string {
    return this.tmi.getUsername()
  }

  /**
   * Gets the bot channels
   */
  getChannels(): string[] {
    return this.tmi.getChannels()
  }

  /**
   * Checks if the message author is one of bot owners
   *
   * @param author
   */
  isOwner(author: TwitchChatUser): boolean {
    return this.options.botOwners.includes(author.username)
  }

  /**
   * Received mod role
   *
   * @param channel
   * @param username
   */
  onMod(channel: string, username: string): void {
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
  onError(error: unknown): void {
    this.logger.error(error)
    this.emit('error', error)
  }

  /**
   * Unmod bot
   *
   * @param channel
   * @param username
   */
  onUnmod(channel: string, username: string): void {
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
  private startMessagesCounterInterval(): void {
    if (this.options.enableRateLimitingControl) {
      if (this.options.verboseLogging) {
        this.logger.verbose('Starting messages counter interval')
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
  private resetMessageCounter(): void {
    if (this.options.verboseLogging) {
      this.logger.verbose('Resetting messages count')
    }

    this.messagesCount = 0
  }

  /**
   * Check if the bot sent too many messages in timespan limit
   */
  private checkRateLimit(): boolean {
    if (this.options.enableRateLimitingControl) {
      const messageLimits = CommandConstants.MESSAGE_LIMITS[this.options.botType]

      if (this.options.verboseLogging) {
        this.logger.verbose('Messages count: ' + this.messagesCount)
      }

      return this.messagesCount < messageLimits.messages
    } else {
      return true
    }
  }
}

export { TwitchCommandClient, ClientOptions, TwitchOptions, ChatterState }