import Lowdb from 'lowdb'
import { Router, Request, Response } from 'express'
import { TwitchCommandClient } from 'src/client/TwitchCommandClient'
import { CommandProvider } from 'src/commands/TwitchChatCommand'
import { BaseRoute } from './BaseRoute'

export class CommandRoutes extends BaseRoute {
  client: TwitchCommandClient
  commands: Lowdb.LowdbSync<CommandProvider>
  router: Router

  constructor(client: TwitchCommandClient) {
    super(client)

    this.commands = this.client.provider.get<CommandProvider>('commands')
    this.router.get('', this.getCommands.bind(this))
  }

  private getCommands(req: Request, res: Response) {
    const commands = this.commands.getState()
    return res.status(200).json(commands)
  }
}