import Lowdb from 'lowdb'
import { BaseRoute } from './BaseRoute'
import { Router, Request, Response, NextFunction } from 'express'
import { TwitchCommandClient } from '../../client/TwitchCommandClient'
import { CommandOptions, CommandProvider } from '../../commands/TwitchChatCommand'

export class CommandRoutes extends BaseRoute {
  client: TwitchCommandClient
  commands: Lowdb.LowdbSync<CommandProvider>
  router: Router

  constructor(client: TwitchCommandClient) {
    super(client)

    this.commands = this.client.provider.get<CommandProvider>('commands')
    this.router.get('', this.getCommands.bind(this))
    this.router.get('/:name', this.getCommandByName.bind(this))
    this.router.put('/:name', this.updateCommand.bind(this))
  }

  private getCommands(req: Request, res: Response) {
    const commands = this.commands.getState()
    return this.response(res, 200, { commands })
  }

  private getCommandByName(req: Request, res: Response) {
    const { name } = req.params
    const command = this.commands.find({ name }).value()

    if (command) {
      return this.response(res, 200, { command })
    } else {
      return this.response(res, 404, `Command '${name}' not found`)
    }
  }

  private updateCommand(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body
      const { name } = req.params
      if (!body || !name) this.response(res, 400, 'Missing request body!')

      const command = this.commands.find({ name })
      if (!command.value()) return this.response(res, 404, `Command '${name}' is not found!`)

      const commandOptions = command.assign(body).write() as CommandOptions
      this.client.commands.forEach(command => {
        if (command.options.name === name) {
          command.options = {
            ...command.options,
            ...commandOptions
          }

          this.client.logger.info(`Command '${body.name}' updated!`)
        }
      })

      return this.response(res, 200, { command: commandOptions })
    } catch (err) {
      next(err)
    }
  }
}