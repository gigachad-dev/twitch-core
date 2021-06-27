import { TwitchCommandClient } from 'src/client/TwitchCommandClient'
import { TwitchChatMessage } from 'src/messages/TwitchChatMessage'
import { CommandOptions, TwitchChatCommand } from './TwitchChatCommand'

export class TextCommand extends TwitchChatCommand {
  constructor(client: TwitchCommandClient, options: CommandOptions) {
    super(client, options)
  }

  async run(msg: TwitchChatMessage) {
    msg.reply(this.options.message)
  }
}