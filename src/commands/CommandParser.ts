import { TwitchCommandClient } from '../client/TwitchCommandClient'

interface CommandArguments {
  command: string
  prefix?: string
  args?: string[]
}

type CommandParsed = Required<CommandArguments>

class CommandParser {
  private client: TwitchCommandClient

  constructor(client: TwitchCommandClient) {
    this.client = client
  }

  parse(message: string, prefix: string): CommandParsed | null {
    const regex = new RegExp('^(' + this.escapePrefix(prefix) + ')([^\\s]+) ?(.*)', 'gims')
    const matches = regex.exec(message)

    if (matches) {
      const prefix = matches[1]
      const command = matches[2]
      const result: CommandParsed = {
        command: command,
        prefix: prefix,
        args: []
      }

      if (matches.length > 3) {
        result.args =
          matches[3]
            .trim()
            .split(' ')
            .filter(v => v !== '')
      }

      if (this.client.options.verboseLogging) {
        this.client.logger.verbose(JSON.stringify(result, null, 2))
      }

      return result
    }

    return null
  }

  private escapePrefix(prefix: string) {
    if (
      prefix === '?' ||
      prefix === '^' ||
      prefix === '[' ||
      prefix === ']' ||
      prefix === ']' ||
      prefix === '(' ||
      prefix === ')' ||
      prefix === '*' ||
      prefix === '\\'
    ) {
      prefix = '\\' + prefix
    }

    return prefix
  }
}

export { CommandParser, CommandArguments }
