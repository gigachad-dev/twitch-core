import path from 'path'
import Lowdb from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import { CommandOptions } from '../commands/TwitchChatCommand'

interface TextCommandProvider {
  options: unknown,
  commands: CommandOptions[]
}

class SettingsProvider {
  private providers: Record<string, Lowdb.LowdbSync<any>>
  private defaults: Record<string, () => Record<string, unknown>>

  constructor() {
    this.defaults = {
      'commands': () => {
        return {
          Commands: {},
          TextCommandsManager: {}
        }
      },
      'text-commands': () => {
        return {
          options: {},
          commands: []
        }
      }
    }
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

      provider
        .defaults(this.defaults[name]?.call(this))
        .write()

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

export { SettingsProvider, TextCommandProvider }