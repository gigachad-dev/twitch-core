<br/>
<p align="center">
  <img src="docs/images/logo.png" />
</p>
<br/>

<p align="center">
  <a href="https://www.npmjs.com/package/twitch-core" target="_blank"><img alt="npm" src="https://img.shields.io/npm/v/twitch-core"></a>
  <img alt="David" src="https://img.shields.io/david/crashmax-dev/twitch-core">
  <img alt="Size" src="https://img.shields.io/bundlephobia/minzip/twitch-core">
</p>

## Описание

Twitch Core — гибкий, полностью объектно-ориентированный, простой в использовании и упрощает создание собственных мощных команд. Кроме того, он в полной мере использует синтаксис `async / await` для получения лаконичного кода, который легко написать и легко понять. Под капотом использует [tmi.js](https://github.com/tmijs/tmi.js) для интеграции c Twitch чатом. Рекомендуется использовать с `TypeScript`.

## Установка

```
$ npm install twitch-core
```

## Возможности

* Автоматический парсинг команд
* Автоматический парсинг аргументов команды и преобразование в именованные переменные с сохранением типов
* Команды выполняются в асинхронном режиме
* Настраиваемый префикс команды

## Базовая настройка клиента

```ts
import path from 'path'
import { TwitchCommandClient, TwitchChatMessage } from 'twitch-core'

const client = new TwitchCommandClient({
  username: 'VS_Code',
  oauth: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  channels: ['ArchikoFF']
})

client.on('connected', () => {})

client.on('join', channel => { })

client.on('error', err => { })

client.on('message', (msg: TwitchChatMessage) => { })

client.registerDefaultCommands()

client.registerCommandsIn(path.join(__dirname, 'commands'))

client.connect()
```

Клиент расширяет `EventEmitter`, поэтому вы можете легко подписаться на его событие.

Используя `registerDefaultCommands`, вы регистрируете стандартные команды бота, такие какие `!commands`, `!help` и т.д.

Создайте папку с именем `commands` в которой у вас будут находиться команды.

Не забудьте вызвать `registerCommandsIn`, чтобы зарегистрировать свои собственные команды.

## Создание стандартной команды

```ts
import { TwitchChatCommand, TwitchCommandClient, TwitchChatMessage, CommandOptions } from 'twitch-core'

class Example extends TwitchChatCommand {
  constructor(client: TwitchCommandClient, options: CommandOptions) {
    super(client, {
      name: 'example',
      group: 'system',
      userlevel: 'everyone',
      description: 'Пример команды',
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

## Команда с именованными аргументами

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
      description: 'Пример команды c именнованными аргументами',
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

## Параметры команд

* **name** : Название команды (стандартный алиас команды)
* **group** : Группа команд (временно не используется!)
* **description** : Описание команды (необходио для вывода в `!help <command>`)
* **userlevel** : Уровень доступа (`everyone`, `regular`, `vip`, `subscriber`, `moderator`, `broadcaster`)
* **message** ?: Сообщения команды (временно не используется!)
* **examples** ?: Примеры пользования командой (пример выводится по команде `!help <command>`)
* **args** ?: Создание именнованых аргументов команды
* **aliases** ?: Дополнительные алиасы команды
* **botChannelOnly** ?: Команда доступна только на канале бота (если в клиенте включен `autoJoinBotChannel`)
* **hideFromHelp** ?: Скрыть команду из списка `!commands`
* **privmsgOnly** ?: Команда доступна только в личном сообщении бота

## Стандартные команды

* **!commands** : Список команд у бота
* **!help <command>** : Подробная информация о команде