import fetch from 'node-fetch'
import { CommandOptions, TwitchChatCommand, TwitchChatMessage, TwitchCommandClient } from '../../src'

interface CatResponse {
    file: string
}

export default class Cat extends TwitchChatCommand {
    private cat_emotes: string[]
    private cat_api: string

    constructor(client: TwitchCommandClient, options: CommandOptions) {
        super(client, options)

        /**
         * CoolCat    https://twitchemotes.com/emotes/58127
         * DxCat      https://twitchemotes.com/emotes/110734
         * GlitchCat  https://twitchemotes.com/emotes/304486301
         */
        this.cat_emotes = ['CoolCat', 'DxCat', 'GlitchCat']
        this.cat_api = 'http://aws.random.cat/meow'
    }

    async run(msg: TwitchChatMessage) {
        try {
            const response = await fetch(this.cat_api)
            const json: CatResponse = await response.json()
            const emote = this.cat_emotes[this.rand(0, this.cat_emotes.length - 1)]

            msg.reply(`${emote} ${json.file}`)
        } catch (err) {
            console.log(err)
        }
    }

    rand(min: number, max: number) {
        return Math.floor(min + Math.random() * (max + 1 - min))
    }
}