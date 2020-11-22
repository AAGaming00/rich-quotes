const { getModule, http: { get }, constants: { Endpoints } } = require('powercord/webpack');

const User = getModule(m => m.prototype && m.prototype.tag, false);
const Timestamp = getModule(m => m.prototype && m.prototype.toDate && m.prototype.month, false);
const getCachedMessage = getModule(['getMessages'], false).getMessage;
const { getGuild } = getModule(['getGuild'], false);

const errorRes = (msg) => { return { error: msg, inGuild: true} };

let lastFetch = 0;

module.exports = async function getMessage([guildId, channelId, messageId], retry = false) {
   let message = false;

   // Check Discord's local/client cache for message
   if (!retry) message = getCachedMessage(channelId, messageId);

   // Request message when not present in cache
   if (!message) {
      // Wait to do request
      if (lastFetch > Date.now() - 2500) await new Promise(r => setTimeout(r, Date.now() - lastFetch));

      if (!(guildId === '@me' ? true : getGuild(guildId) !== undefined))
         return { error: 'missing-access', inGuild: false };

      lastFetch = Date.now();


      let data, rateLimit;

      // Fetch Message
      try {data = await get({
         url: Endpoints.MESSAGES(channelId),
         query: { limit: 1, around: messageId },
         retries: 2
      })} catch (e) {
         if (!e.text) return errorRes('failed-request');

         const error = JSON.parse(e.text);

         switch (error.message) {
            case 'Unknown Channel': return errorRes('unknown-channel');
            case 'Missing Access': return errorRes('missing-access');
            case 'You are being rate limited.': { rateLimit = error.retry_after * 1000 } break;
            default: return errorRes('invalid-response');
         }
      }

      // When rate-limited add wait time given by discord to queue delay and re-queue request.
      if (rateLimit) {
         lastFetch = lastFetch + rateLimit;
         return await getMessage([guildId, channelId, messageId], true);
      }

      const msg = data.body[0];

      if (!msg.id === messageId) return { closest: msg.id, ...errorRes('no-match') };

      msg.author = new User(msg.author);
      msg.timestamp = new Timestamp(msg.timestamp);

      message = msg;
   }

   // @todo Add result of message fetch to client cache

   return message;
}