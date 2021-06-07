import fetch from 'node-fetch'
import { CommandConstants } from '../client/CommandConstants'
import { TwitchCommandClient } from '../client/TwitchCommandClient'

interface Emotes {
  code: string
  emoticon_set: number
  id: number
  channel_id: string | null,
  channel_name: string | null
}

class EmotesManager {
  private client: TwitchCommandClient
  private emotes: Emotes[]

  constructor(client: TwitchCommandClient) {
    this.client = client
    this.emotes = []
  }

  async getGlobalEmotes(): Promise<void> {
    this.client.logger.info('Loading global emotes...')

    const response = await fetch(CommandConstants.GLOBAL_EMOTES_URL)
    const json = await response.json()

    this.emotes = json
  }

  getRandomEmote(): Emotes {
    return this.emotes[Math.floor(Math.random() * this.emotes.length)]
  }
}

export { EmotesManager }