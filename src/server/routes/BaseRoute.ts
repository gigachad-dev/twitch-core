import { Router } from 'express'
import { TwitchCommandClient } from 'src/client/TwitchCommandClient'

export abstract class BaseRoute {
  client: TwitchCommandClient
  router: Router

  constructor(client: TwitchCommandClient) {
    this.client = client
    this.router = Router()
  }
}