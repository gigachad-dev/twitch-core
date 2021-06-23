export class ResponseError {
  ok: boolean
  status: number
  message: Array<any> | string

  constructor(status: number, message: any) {
    this.ok = false
    this.status = status
    this.message = message
  }
}