import { Database } from 'sqlite'
import { TwitchCommandClient } from '../client/TwitchCommandClient'

// TODO
class SettingsProvider {
  public db: Database

  constructor(databaseConnection: Database) {
    this.db = databaseConnection
  }

  async init(client: TwitchCommandClient) { }

  async clear(channel: string) { }

  async get<T>(channel: string, key: string, defVal: T) { }

  async remove(channel: string, key: string) { }

  async set<T>(channel: string, key: string, value: T) { }
}

export { SettingsProvider }