import Lowdb from 'lowdb'
import { TextCommand } from '../TextCommand'
import { TwitchChatMessage } from '../../messages/TwitchChatMessage'
import { TextCommandProvider } from '../../settings/SettingsProvider'
import { TwitchCommandClient } from '../../client/TwitchCommandClient'
import { TwitchChatCommand, CommandOptions, MessageType, UserLevel } from '../TwitchChatCommand'

export default class TextCommandsManager extends TwitchChatCommand {
  private provider: Lowdb.LowdbSync<TextCommandProvider>

  constructor(client: TwitchCommandClient, options: CommandOptions) {
    super(client, {
      name: 'txt',
      userlevel: 'regular',
      ...options
    })

    this.provider = client.provider
      .get<TextCommandProvider>('text-commands')
  }

  async prepareRun(msg: TwitchChatMessage, args: string[]) {
    if (!this.provider) {
      return msg.reply('Text command provider text-commands.json is not registered!')
    }

    if (args.length > 1) {
      const action = args[0]
      args.shift()
      const command = args[0]
      args.shift()
      const opts = args.join(' ')

      switch (action) {
        case 'set':
          this.set(msg, command, opts)
          break

        case 'get':
          this.get(msg, command)
          break

        case 'unset':
          this.unset(msg, command)
          break

        case 'access':
          this.updateUserLevel(msg, command, opts as UserLevel)
          break

        case 'type':
          this.updateMessageType(msg, command, opts as MessageType)
          break

        default:
          msg.reply(`Action '${action}' is not found!`)
      }
    } else {
      msg.reply('Manage command is not enough arguments')
    }
  }

  set(msg: TwitchChatMessage, name: string, text: string) {
    if (!text.length) {
      return msg.reply('Text argument required')
    }

    const command = this.client.findCommand({ command: name })
    const options: CommandOptions = {
      name,
      text,
      userlevel: 'everyone',
      messageType: 'reply'
    }

    const findInProvider = this.provider
      .get('commands')
      .find({ name })

    if (findInProvider.value()) {
      this.provider
        .get('commands')
        .find({ name })
        .assign({ text })
        .write()
    } else {
      this.provider
        .get('commands')
        .push(options)
        .write()
    }

    if (command) {
      command.options = {
        ...command.options,
        name,
        text
      }
    } else {
      this.client.commands.push(
        new TextCommand(this.client, {
          name,
          text,
          userlevel: 'everyone',
          messageType: 'reply'
        })
      )
    }

    msg.reply(`Command created → ${this.client.options.prefix}${name} — ${text}`)
  }

  get(msg: TwitchChatMessage, name: string) {
    const command =
      this.provider
        .get('commands')
        .find({ name })
        .value()

    if (command !== undefined) {
      msg.reply(`Options → text: ${command.text}, userlevel: ${command.userlevel}, messageType: ${command.messageType}`)
    } else {
      msg.reply(`Command '${name}' is not found`)
    }
  }

  unset(msg: TwitchChatMessage, name: string) {
    const command =
      this.provider
        .get('commands')
        .find({ name })
        .value()

    if (command !== undefined) {
      this.client.commands =
        this.client.commands
          .filter(command => command.options.name !== name)

      this.provider
        .get('commands')
        .remove({ name })
        .write()

      msg.reply(`Command '${command.name}' deleted`)
    } else {
      msg.reply(`Command '${name}' is not found`)
    }
  }

  updateUserLevel(msg: TwitchChatMessage, name: string, userlevel: UserLevel) {
    const UserLevels = Object.values(UserLevel)

    if (UserLevels.includes(userlevel)) {
      this.updateCommandOptions(msg, name, { userlevel })
    } else {
      msg.reply(`Available userlevels: ${UserLevels.join(', ')}`)
    }
  }

  updateMessageType(msg: TwitchChatMessage, name: string, messageType: MessageType) {
    const MessageTypes = Object.values(MessageType)

    if (MessageTypes.includes(messageType)) {
      this.updateCommandOptions(msg, name, { messageType })
    } else {
      msg.reply(`Available message types: ${MessageTypes.join(', ')}`)
    }
  }

  updateCommandOptions(msg: TwitchChatMessage, name: string, { ...options }: Partial<CommandOptions>) {
    this.provider
      .get('commands')
      .find({ name })
      .assign(options)
      .write()

    this.client.commands.forEach(command => {
      if (command.options.name === name) {
        command.options = {
          ...command.options,
          ...options
        }
      }
    })

    msg.reply(`Command '${name}' updated!`)
  }
}