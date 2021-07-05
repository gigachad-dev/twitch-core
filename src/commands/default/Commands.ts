import { CommandOptions, TwitchChatCommand } from '../TwitchChatCommand'
import { TwitchChatMessage } from '../../messages/TwitchChatMessage'
import { TwitchCommandClient } from '../../client/TwitchCommandClient'

export default class Commands extends TwitchChatCommand {
  constructor(client: TwitchCommandClient, options: CommandOptions) {
    super(client, {
      name: 'commands',
      group: 'system',
      userlevel: 'everyone',
      description: `Эта команда показывает список всех команд. Отправьте ${client.options.prefix}help <command> для получения подробной информации о команде.`,
      aliases: [
        'help'
      ],
      examples: [
        `${client.options.prefix} commands`,
        `${client.options.prefix} help <command>`
      ],
      args: [
        {
          name: 'command'
        }
      ],
      ...options
    })
  }

  async run(msg: TwitchChatMessage, { command }: {
    command: string
  }): Promise<void> {
    if (command?.length > 0) {
      this.commandHelp(msg, command)
    } else {
      this.commandList(msg)
    }
  }

  async commandList(msg: TwitchChatMessage): Promise<void> {
    const commands: string[] = []
    const prefix = this.client.options.prefix

    for (const cmd of this.client.commands) {
      if (!cmd.options.hideFromHelp) {
        commands.push(prefix + cmd.options.name)
      }
    }

    msg.reply(`Список команд → ${commands.join(', ')}`)
  }

  commandHelp(msg: TwitchChatMessage, command: string): void {
    const selectedCommand = this.client.commands.find(cmd => {
      return cmd.options.name === command && !cmd.options.hideFromHelp
    })

    if (selectedCommand) {
      let messageText = selectedCommand.options.description

      if (selectedCommand.options.examples?.length > 0) {
        messageText += ', Использование: ' + selectedCommand.options.examples.join(', ')
      }

      msg.reply(messageText)
    } else {
      msg.reply(`команда '${command}' не найдена`)
    }
  }
}