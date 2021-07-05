import { TwitchChatMessage } from '../messages/TwitchChatMessage'
import { TwitchCommandClient } from '../client/TwitchCommandClient'

interface CommandOptions {
  /**
   * Command name (default alias)
   */
  name: string

  /**
   * Command group (not used!)
   */
  group: string

  /**
   * Command description (required for output to !help <command>)
   */
  description: string

  /**
   * Userlevel access (everyone, regular, vip, subscriber, moderator, broadcaster)
   */
  userlevel: UserLevels

  /**
   * Command message text (not used!)
   */
  message?: string

  /**
   * Command examples (requited for output to !help <command>)
   */
  examples?: string[]

  /**
   * Command arguments
   */
  args?: CommandArgument[]

  /**
   * More aliases
   */
  aliases?: string[]

  /**
   * The command is available only on the bot channel
   * Make sure the client enable `autoJoinBotChannel` parametr
   */
  botChannelOnly?: boolean

  /**
   * Hide command help output to `!commands`
   */
  hideFromHelp?: boolean

  /**
   * The command is available only in the private message of the bot
   */
  privmsgOnly?: boolean
}

interface CommandArgument {
  /**
   * Alias name
   */
  name: string

  /**
   * Value typesafe
   */
  type?: StringConstructor | NumberConstructor | BooleanConstructor

  /**
   * Default value
   */
  defaultValue?: string | number | boolean
}

type UserLevels =
  'vip' |
  'everyone' |
  'regular' |
  'subscriber' |
  'moderator' |
  'broadcaster'

type NamedParameters = Record<string, string | number | boolean>

type CommandProvider = Record<string, CommandOptions>

class TwitchChatCommand {
  public options: CommandOptions
  public client: TwitchCommandClient

  constructor(client: TwitchCommandClient, options: CommandOptions) {
    this.options = options
    this.client = client
  }

  /**
   * Method called when executeCommand
   *
   * @param msg
   * @param chatter
   */
  async execute(msg: TwitchChatMessage): Promise<void> { }

  /**
   * Method called when command is executed
   * TODO: Fix types
   *
   * @param msg
   * @param parameters
   */
  async run(msg: TwitchChatMessage, parameters: unknown): Promise<void> { }

  /**
   * Prepare the command to be executed
   *
   * @param msg
   * @param parameters
   */
  async prepareRun(msg: TwitchChatMessage, parameters: string[]): Promise<void> {
    const namedParameters: NamedParameters = {}

    if (this.options.args && this.options.args.length > 0) {
      for (let i = 0; i < this.options.args.length; i++) {
        if (parameters[i]) {
          if (typeof this.options.args[i].type === 'function') {
            namedParameters[this.options.args[i].name] = this.options.args[i].type(parameters[i])
          } else {
            namedParameters[this.options.args[i].name] = parameters[i]
          }
        } else {
          if (this.options.args[i].defaultValue) {
            namedParameters[this.options.args[i].name] = this.options.args[i].defaultValue
          } else {
            namedParameters[this.options.args[i].name] = null
          }
        }
      }
    }

    await this.run(msg, namedParameters)
  }

  /**
   * Pre validation before to known if can execute command
   *
   * @param msg
   */
  preValidate(msg: TwitchChatMessage): string | boolean {
    if (msg.messageType !== 'whisper' && this.options.privmsgOnly) {
      return 'Эта команда доступна только через личное сообщение бота'
    }

    if (this.options.botChannelOnly) {
      if (msg.channel.name !== this.client.getUsername()) {
        return 'Эта команда может быть выполнена только на канале бота. Перейти https://twitch.tv/' + this.client.getUsername()
      }
    }

    if (this.options.userlevel === 'everyone') {
      return true
    }

    let validationPassed = false

    if (msg.author.isBroadcaster) {
      validationPassed = true
    }

    if (msg.author.isModerator) {
      validationPassed = true
    }

    if (this.options.userlevel === 'regular') {
      if (!validationPassed
        && this.client.options?.botOwners.length > 0
        && !this.client.options.botOwners.includes(msg.author.username)
      ) {
        return 'Команда доступна только для проверенных пользователей'
      }
    }

    if (this.options.userlevel === 'subscriber') {
      if (!validationPassed && !msg.author.isSubscriber) {
        return 'Команда доступна только для платных подписчиков'
      }
    }

    if (this.options.userlevel === 'vip') {
      if (!validationPassed && !msg.author.isVip) {
        return 'Команда доступна только для VIP'
      }
    }

    if (this.options.userlevel === 'moderator') {
      if (!validationPassed) {
        return 'Команда доступна только для модераторов или стримера'
      }
    }

    if (this.options.userlevel === 'broadcaster') {
      if (!msg.author.isBroadcaster) {
        return 'Команда доступна только для стримера'
      }
    }

    return true
  }
}

export { TwitchChatCommand, CommandOptions, CommandArgument, CommandProvider }