import { Database } from 'sqlite'
import { SettingsProvider } from './SettingsProvider'
import { TwitchCommandClient } from '../client/TwitchCommandClient'

class CommandSQLiteProvider extends SettingsProvider {
    public db: Database
    public settings: { [key: string]: any }
    private client: TwitchCommandClient

    constructor(databaseConnection: Database) {
        super(databaseConnection)

        this.settings = {}
    }

    async init(client: TwitchCommandClient) {
        this.client = client

        await this.db.run('CREATE TABLE IF NOT EXISTS settings (channel TEXT PRIMARY KEY, settings TEXT)')

        this.loadSettings()
    }

    async loadSettings() {
        const rows = await this.db.all('SELECT channel, settings FROM settings')

        for (const row of rows) {
            let settings

            try {
                settings = JSON.parse(row.settings)
            } catch (err) {
                this.client.emit('warn', `SQLiteProvider couldn't parse the settings stored for guild ${row.channel}.`)
                this.client.emit('error', err)
                continue
            }

            if (settings !== null) {
                this.settings[row.channel] = settings
            }
        }
    }

    async get(channel: string, key: string, defVal: string | any[]) {
        if (this.settings[channel] !== undefined) {
            if (this.settings[channel][key] !== undefined) {
                return this.settings[channel][key]
            } else {
                return defVal
            }
        } else {
            return defVal
        }
    }

    async set(channel: string | number, key: string | number, value: any) {
        if (this.settings[channel] === undefined) {
            this.settings[channel] = {}
        }

        // ???
        let newSetting: { [key: string]: any } = {}
        newSetting[key] = value

        this.settings[channel] = { ...this.settings[channel], ...newSetting }

        await this.db.run('INSERT OR REPLACE INTO settings VALUES(?, ?)', channel, JSON.stringify(this.settings[channel]))
    }

    async remove(channel: string, key: string | number) {
        if (this.settings[key] !== undefined) {
            const settings = this.settings[key]
            settings[key] = undefined
        }
    }
}

export { CommandSQLiteProvider }