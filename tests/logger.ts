import winston from 'winston'

class ClientLogger {
    log: winston.Logger

    constructor() {
        const loggerFormatter = winston.format.printf(info =>
            `[${info.timestamp}] (${info.service ?? '?'}) ${info.level.toUpperCase()}: ${info.message}`
        )

        const formatter = winston.format.combine(
            winston.format.timestamp({ format: 'YYYY/MM/DD HH:mm:ss' }), loggerFormatter
        )

        this.log = winston.createLogger({
            level: 'silly',
            format: winston.format.json(),
            transports: [
                new winston.transports.File({
                    filename: 'log_error.log',
                    level: 'error',
                    format: formatter
                }),

                new winston.transports.File({
                    filename: 'log_info.log',
                    level: 'info',
                    format: formatter
                }),

                new winston.transports.File({
                    filename: 'log_full.log',
                    format: formatter
                })
            ]
        })

        this.log.add(new winston.transports.Console({
            format: formatter,
            level: 'verbose'
        }))
    }

    getLogger(moduleName: string) {
        return this.log.child({ service: moduleName })
    }
}

const Logger = (name: string) => new ClientLogger().getLogger(name)

export { Logger }