import { TwitchCommandClient } from '../client/TwitchCommandClient'

interface CommandParserResult {
    command: string
    prefix?: string
    args?: string[] | []
}

class CommandParser {
    protected commands: object[]
    private client: TwitchCommandClient

    constructor(commands: object[], client: TwitchCommandClient) {
        this.commands = commands
        this.client = client
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

        if (this.client.verboseLogging) {
            this.client.logger.debug('%o', regex)
        }

        const matches = regex.exec(message)

        if (this.client.verboseLogging && matches !== null) {
            this.client.logger.debug('%o', matches)
        }

        if (matches !== null) {
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
