import fs from 'fs'
import path from 'path'
import morgan from 'morgan'
import express, { Express } from 'express'
import { CommandRoutes } from './routes/CommandRoutes'
import { TwitchCommandClient } from '../client/TwitchCommandClient'

export class Server {
  private client: TwitchCommandClient
  private port: number
  private app: Express

  constructor(client: TwitchCommandClient, port: number) {
    this.client = client
    this.port = port

    const logger = morgan('common', {
      stream: fs.createWriteStream(path.join(process.cwd(), 'log_server.log'), {
        flags: 'a'
      })
    })

    this.app = express()
    this.app.use(logger)
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: true, inflate: false }))
  }

  private registerRoutes(): void {
    this.app.use('/api/commands', new CommandRoutes(this.client).router)
  }

  start(): void {
    this.registerRoutes()
    this.app.listen(this.port, () => {
      this.client.logger.info(`Server is running http://localhost:${this.port}`)
    })
  }
}