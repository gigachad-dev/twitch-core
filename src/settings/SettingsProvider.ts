import { Database } from 'sqlite'
import { TwitchCommandClient } from '../client/TwitchCommandClient'

class SettingsProvider {
    public db: Database

    constructor(databaseConnection: Database) {
        this.db = databaseConnection
    }

    async init(client: TwitchCommandClient) { }

    async clear(channel: string) { }

    async get(channel: string, key: string, defVal: any) { }

    async remove(channel: string, key: string) { }

    async set(channel: string, key: string, value: any) { }
}

export { SettingsProvider }