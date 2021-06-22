import path from 'path'
import Lowdb from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import { TwitchCommandClient } from 'src/client/TwitchCommandClient'

export class SettingsProvider {
  private client: TwitchCommandClient
  private providers: Record<string, Lowdb.LowdbSync<any>>

  constructor(client: TwitchCommandClient) {
    this.client = client
  }

  /**
   * Set Settings Provider
   *
   * @param files
   */
  set(...files: string[]): void {
    for (const file of files) {
      const ext = path.extname(file)
      const name = path.basename(file, ext)
      const provider = Lowdb(
        new FileSync(file)
      )

      this.providers = {
        ...this.providers,
        [name]: provider
      }
    }
  }

  /**
   * Get Settings Provider
   *
   * @param name
   * @returns
   */
  get<T>(name: string): Lowdb.LowdbSync<T> {
    return this.providers[name] as Lowdb.LowdbSync<T>
  }
}