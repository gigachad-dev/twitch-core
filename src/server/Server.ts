import fs from 'fs'
import path from 'path'
import morgan from 'morgan'
import { CommandRoutes } from './routes/CommandRoutes'
import { ResponseError } from './ResponseError'
import { TwitchCommandClient } from 'src/client/TwitchCommandClient'
import express, { Express, Request, Response, NextFunction, ErrorRequestHandler } from 'express'

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
    this.app.use(this.onError)
  }

  private onError(
    err: ErrorRequestHandler | any,
    req: Request,
    res: Response,
    next: NextFunction
  ): Response<any, Record<string, any>> {
    if (!(err instanceof ResponseError)) {
      err = new ResponseError(500, 'Internal error')
    }

    return res.status(err.status).json(err)
  }

  start(): void {
    this.registerRoutes()
    this.app.listen(this.port, () => {
      this.client.logger.info(`Server is running http://localhost:${this.port}`)
    })
  }
}