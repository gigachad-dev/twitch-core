import {
  CommandOptions,
  TwitchChatCommand,
  TwitchChatMessage,
  TwitchCommandClient
} from '../../src'

interface CommandArgs {
  name: string
  age: number
  bool: boolean
}

export default class Example extends TwitchChatCommand {
  constructor(client: TwitchCommandClient, options: CommandOptions) {
    super(client, {
      ...options,
      // named args
      args: [
        {
          name: 'name',
          type: String,
          defaultValue: 'String'
        },
        {
          name: 'age',
          type: Number,
          defaultValue: 21
        },
        {
          name: 'bool',
          type: Boolean,
          defaultValue: false
        }
      ]
    })
  }

  async run(msg: TwitchChatMessage, { name, age, bool }: CommandArgs) {
    msg.reply(`${name} ${age} ${bool}`)
  }

  // async prepareRun(msg: TwitchChatMessage, args: string[]) {
  //   msg.reply(`args -> ${args.join(' ')}`)
  // }
}