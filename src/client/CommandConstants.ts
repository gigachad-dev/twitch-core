const GLOBAL_SETTINGS_KEY = 'global'
const GLOBAL_EMOTES_URL = 'https://api.twitchemotes.com/api/v4/emotes?id=1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30'
const BOT_TYPE_NORMAL = 'bot_type_normal'
const BOT_TYPE_NORMAL_MODDED = 'bot_type_normal_modded'
const BOT_TYPE_KNOWN = 'bot_type_known'
const BOT_TYPE_VERIFIED = 'bot_type_verified'
const MESSAGE_LIMITS = {
    'bot_type_normal': { messages: 20, timespan: 30 },
    'bot_type_normal_modded': { messages: 100, timespan: 30 },
    'bot_type_known': { messages: 50, timespan: 30 },
    'bot_type_verified': { messages: 7500, timespan: 30 }
}

const CommandConstants = Object.freeze({
    /**
     * Global settings key to save global bot preferences
     */
    GLOBAL_SETTINGS_KEY,

    /**
     * Service url for Emotes service
     */
    GLOBAL_EMOTES_URL,

    /**
     * Known bot
     */
    BOT_TYPE_KNOWN,

    /**
     * Normal bot type (user, not mod)
     */
    BOT_TYPE_NORMAL,

    /**
     * Verified bot
     */
    BOT_TYPE_VERIFIED,

    /**
     * Normal bot type with mod (user, channel mod)
     */
    BOT_TYPE_NORMAL_MODDED,

    /**
     * Enumeration for message limits configuration
     */
    MESSAGE_LIMITS
})

export { CommandConstants }