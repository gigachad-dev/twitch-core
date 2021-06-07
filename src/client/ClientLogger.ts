import winston from 'winston'

class ClientLogger {
  private log: winston.Logger

  constructor() {
    const formatter = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY/MM/DD HH:mm:ss'
      }),
      winston.format.printf(info =>
        `[${info.timestamp}] (${info.service ?? '?'}) ${info.level.toUpperCase()}: ${info.message}`
      )
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

  getLogger(moduleName?: string): winston.Logger {
    return this.log.child({ service: moduleName })
  }
}

export { ClientLogger }