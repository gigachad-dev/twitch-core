import { TwitchCommandClient } from '../client/TwitchCommandClient'
import { TwitchChatMessage } from '../messages/TwitchChatMessage'
import { CommandOptions, TwitchChatCommand } from './TwitchChatCommand'

export class TextCommand extends TwitchChatCommand {
  constructor(client: TwitchCommandClient, options: CommandOptions) {
    super(client, options)
  }

  async run(msg: TwitchChatMessage) {
    msg.reply(this.options.message)
  }
}