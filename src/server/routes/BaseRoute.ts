import { Response, Router } from 'express'
import { TwitchCommandClient } from 'src/client/TwitchCommandClient'

export abstract class BaseRoute {
  client: TwitchCommandClient
  router: Router

  constructor(client: TwitchCommandClient) {
    this.client = client
    this.router = Router()
  }

  response(
    res: Response,
    status: number,
    response: any
  ): Response<any, Record<string, any>> {
    return res.status(status).json({ ok: status === 200, ...response })
  }
}