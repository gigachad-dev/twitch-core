import { TwitchChatCommand } from './TwitchChatCommand'

interface CommandParserResult {
  command: string
  prefix?: string
  args?: string[] | []
}

class CommandParser {
  protected commands: TwitchChatCommand[]

  constructor(commands: TwitchChatCommand[]) {
    this.commands = commands
  }

  parse(message: string, prefix: string): CommandParserResult | null {
    if (prefix === '?' ||
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

    const regex = new RegExp('^(' + prefix + ')([^\\s]+) ?(.*)', 'gims')
    const matches = regex.exec(message)

    if (matches) {
      const prefix = matches[1]
      const command = matches[2]
      let args: string[] = []

      if (matches.length > 3) {
        const argsString = matches[3].trim()
        args = argsString.split(' ').filter(v => v !== '')
      }

      const result = {
        command: command,
        prefix: prefix,
        args: args
      }

      return result
    }

    return null
  }
}

export { CommandParser, CommandParserResult }
