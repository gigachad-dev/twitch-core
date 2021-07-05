import { Response, Router } from 'express'
import { TwitchCommandClient } from '../../client/TwitchCommandClient'

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
    response = typeof response === 'string' ?
      { message: response } :
      response

    return res.status(status).json({
      ok: status === 200,
      ...response
    })
  }
}