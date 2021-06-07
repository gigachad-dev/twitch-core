import lowdb from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'

interface Settings {
  /**
   * Client channels
   */
  channels: string[]

  /**
   * Bot username
   */
  bot_username: string

  /**
   * Twitch OAuth token
   */
  oauth_token: string

  /**
   * https://dev.twitch.tv/docs/authentication#refreshing-access-tokens
   */
  refresh_token: string

  /**
   * https://dev.twitch.tv/console/apps
   */
  client_id: string
  secret_token: string

  /**
   * https://dev.twitch.tv/docs/authentication#scopes
   */
  twitch_scope: string[]

  /**
   * Ignored users
   */
  ignore: string[]

  /**
   * Command prefix
   */
  prefix: symbol
}

class SettingsProvider {
  public db: lowdb.LowdbSync<unknown>

  constructor(path: string, values?: unknown) {
    const adapter = new FileSync(path)

    this.db = lowdb(adapter)
    this.db.defaults({ values }).write()
  }
}

export { SettingsProvider }