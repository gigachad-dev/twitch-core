import { TwitchCommandClient } from '../client/TwitchCommandClient'

interface ChatChannel {
    channel: string
    room_id?: string
}

class TwitchChatChannel {
    private originalMessage: ChatChannel
    private client: TwitchCommandClient

    constructor(originalMessage: ChatChannel, client: TwitchCommandClient) {
        this.originalMessage = originalMessage
        this.client = client
    }

    /**
     * Get channel name
     */
    get name() {
        return this.originalMessage.channel
    }

    /**
     * Get room_id
     */
    get id() {
        return this.originalMessage.room_id
    }
}

export { TwitchChatChannel }