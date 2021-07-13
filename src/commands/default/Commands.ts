import { CommandOptions, TwitchChatCommand } from '../TwitchChatCommand'
import { TwitchChatMessage } from '../../messages/TwitchChatMessage'
import { TwitchCommandClient } from '../../client/TwitchCommandClient'

export default class Commands extends TwitchChatCommand {
  constructor(client: TwitchCommandClient, options: CommandOptions) {
    super(client, {
      name: 'commands',
      userlevel: 'everyone',
      description: `This command shows help for all commands. Send ${client.options.prefix}help <command> for detailed help on a command.`,
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

    msg.reply(`Commands → ${commands.join(', ')}`)
  }

  commandHelp(msg: TwitchChatMessage, command: string): void {
    const selectedCommand = this.client.commands.find(({ options }) => {
      return options.name === command && !options.hideFromHelp
    })

    if (selectedCommand) {
      let messageText = selectedCommand.options.description

      if (selectedCommand.options.examples?.length > 0) {
        messageText += ', Usage: ' + selectedCommand.options.examples.join(', ')
      }

      if (messageText) {
        msg.reply(messageText)
      } else {
        msg.reply('Help text not found')
      }
    } else {
      msg.reply('Command not found')
    }
  }
}