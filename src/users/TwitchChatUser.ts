import { TwitchCommandClient, ChatterState } from '../client/TwitchCommandClient'

class TwitchChatUser {
  private originalMessage: ChatterState
  private client: TwitchCommandClient

  constructor(originalMessage: ChatterState, client: TwitchCommandClient) {
    this.originalMessage = originalMessage
    this.client = client
  }

  /**
   * Get display-name
   */
  get displayName() {
    return this.originalMessage['display-name']
  }

  /**
   * Get username
   */
  get username() {
    return this.originalMessage.username
  }

  /**
   * Get badges
   */
  get badges() {
    return this.originalMessage.badges
  }

  /**
   * Get user-id
   */
  get id() {
    return this.originalMessage['user-id']
  }

  /**
   * Get user-type on string
   */
  get userType() {
    return this.originalMessage['user-type']
  }

  /**
   * Whisper a message to the user
   * @param message
   */
  async whisper(message: string) {
    return this.client.whisper(this.username, message)
  }

  /**
   * Get the user #channel
   */
  get channel() {
    return '#' + this.username
  }

  /**
   * Check if user is Turbo
   */
  get isTurbo() {
    return this.originalMessage.turbo
  }

  /**
   * Check if user is the channel vip
   */
  get isVip() {
    return this.badges?.vip === '1'
  }

  /**
   * Check if user is the channel broadcaster
   */
  get isBroadcaster() {
    return this.badges?.broadcaster === '1'
  }

  /**
   * Check if user is the channel subscriber
   */
  get isSubscriber() {
    return this.originalMessage.subscriber
  }

  /**
   * Check if user is the channel moderator
   */
  get isModerator() {
    return this.originalMessage.mod
  }
}

export { TwitchChatUser }