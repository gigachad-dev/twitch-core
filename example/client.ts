import path from 'path'
import { TwitchCommandClient, TwitchChatMessage } from '../src'

import dotenv from 'dotenv'
dotenv.config()

const client = new TwitchCommandClient({
  username: process.env.BOT_USERNAME,
  oauth: process.env.OAUTH_KEY,
  channels: [process.env.CHANNEL],
  verboseLogging: false,
  botOwners: [process.env.BOT_USERNAME]
})

client.on('message', (msg: TwitchChatMessage) => { })

client.provider.set(
  path.join(__dirname, 'config/commands.json'),
  path.join(__dirname, 'config/text-commands.json')
)

client.registerTextCommands()

client.registerDefaultCommands()

client.registerCommandsIn(
  path.join(__dirname, '/commands')
)

client.connect()
console.log(client.options)