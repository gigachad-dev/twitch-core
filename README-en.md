<br/>
<p align="center">
  <img src="docs/images/logo.png" />
</p>
<p align="center">
    It is flexible, fully object-oriented, easy to use, and makes it trivial to create your own powerful commands.
    Based on <a href="https://github.com/tmijs/tmi.js">tmi.js</a>.
</p>
<br/>

<p align="center">
  <a href="https://www.npmjs.com/package/twitch-core" target="_blank"><img alt="npm" src="https://img.shields.io/npm/v/twitch-core"></a>
  <img alt="David" src="https://img.shields.io/david/crashmax-dev/twitch-core">
  <img alt="Size" src="https://img.shields.io/bundlephobia/minzip/twitch-core">
</p>

## Installation

Using npm:

```
npm install twitch-core
```

Or, if you prefer yarn:

```
yarn add twitch-core
```

## Features
* Automatic command parsing
* Automatic parsing of command arguments and conversion to named variables with type preservation
* All commands run asynchronously
* You can configure the prefix of commands* Loading configuration files
* TypeScript definitions 
 
## Base settings for the client

```ts
import path from 'path'
import { TwitchCommandClient, TwitchChatMessage } from 'twitch-core'

const client = new TwitchCommandClient({
  username: 'VS_Code',
  oauth: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  channels: ['ArchikOFF']
})

client.on('connected', () => {})

client.on('join', channel => { })

client.on('error', err => { })

client.on('message', (msg: TwitchChatMessage) => { })

client.setProviders(
  path.join(__dirname, 'config/commands.json'),
  path.join(__dirname, 'config/config.json')
)

client.registerDefaultCommands()

client.registerCommandsIn(path.join(__dirname, 'commands'))

client.connect()
```

Client extends of `EventEmitter`, so you can easily subscribe to his events.

You can register the bot's default commands (`!commands`, `!help`, etc.), using method `registerDefaultCommand`.

Create folder called `commands`, that will contain all your commands.

Don't forget to call method `registerCommandsIn`, to register your own commands.

## Creating a standard command

```ts
import { TwitchChatCommand, TwitchCommandClient, TwitchChatMessage, CommandOptions } from 'twitch-core'

class Example extends TwitchChatCommand {
  constructor(client: TwitchCommandClient, options: CommandOptions) {
    super(client, {
      name: 'example',
      group: 'system',
      userlevel: 'everyone',
      description: 'Example command',
      examples: [
        '!example',
        '!example <args>'
      ]
    })
  }

  async run(msg: TwitchChatMessage, args: string[]) {
    msg.reply(`Args -> ${args.join(' ')}`)
  }
}

export default Example
```

## Command with named arguments

```ts
import { TwitchChatCommand, TwitchCommandClient, TwitchChatMessage, CommandOptions } from 'twitch-core'

type CommandArgs = {
  name: string
  age: number
  bool: boolean
}

class ExampleArgs extends TwitchChatCommand {
  constructor(client: TwitchCommandClient, options: CommandOptions) {
    super(client, {
      name: 'example-args',
      group: 'system',
      userlevel: 'everyone',
      description: 'Example of command with named arguments',
      examples: [
        '!example',
        '!example <args>'
      ],
      {
        name: 'name',
        type: String,
        defaultValue: 'Text string'
      },
      {
        name: 'age',
        type: Number,
        defaultValue: 22
      },
      {
        name: 'bool',
        type: Boolean,
        defaultValue: false
      }
    })
  }

  async run(msg: TwitchChatMessage, { name, age, bool }: CommandArgs) {
    msg.reply(`Args -> ${name} ${age} ${bool}`)
  }
}

export default ExampleArgs
```

## Commands params

* **name**: Name of command (default alias of command)
* **group**: Commands group (temporarily not used)
* **description**: Description of command (using at `!help <command>`)
* **userlevel**: Access level (`everyone`, `regular`, `vip`, `subscriber`, `moderator`, `broadcaster`)
* **message**?: Command messages (temporarily not used)
* **examples**?: Examples for command (using in `!help <command>`)
* **args**?: Creating named command arguments
* **aliases**?: Additional command aliases
* **botChannelOnly**?: The command is only available on the bot channel (if you have enabled `autoJoinBotChannel` in client constructor)
* **hideFromHelp**?: Do we need to hide command from `!commands` list?
* **privmsgOnly**?: Answer to command only at PM?

## Default commands

* **!commands**: All registered commands
* **!help \<command\>**: Help with command (detailed information)
