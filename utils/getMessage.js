const { getModule, http: { get }, constants: { Endpoints } } = require('powercord/webpack');

const User = getModule(m => m.prototype && m.prototype.tag, false);
const Timestamp = getModule(m => m.prototype && m.prototype.toDate && m.prototype.month, false);
const { getMessage } = getModule(['getMessages'], false);

module.exports = async (guildId, channelId, messageId, lastFetch) => {
   let message = getMessage(channelId, messageId);

   if (!message) {
      if (lastFetch > Date.now() - 2500) await new Promise(r => setTimeout(r, 2500));

      const { getGuild } = await getModule(['getGuild']);

      let data;
      let errorData = false;
      let rateLimit = false;

      const inGuild = guildId === '@me' ? true : getGuild(guildId) !== undefined;

      if (!inGuild) return { error: 'missing-access', inGuild: false };

      const errorRes = (msg) => { return { error: msg, inGuild: true} };

      async function req() {
         try {data = await get({
            url: Endpoints.MESSAGES(channelId),
            query: { limit: 1, around: messageId },
            retries: 2
         })} catch (e) {
            if (!e.text) return { error: 'failed-request', inGuild: true };
   
            const error = JSON.parse(e.text);
   
            switch (error.message) {
               case 'Unknown Channel': { return errorData = errorRes('unknown-channel') };
               case 'Missing Access': { return errorData = errorRes('missing-access') };
               case 'You are being rate limited.': { rateLimit = error.retry_after * 1000 } break;
               default: { return errorData = errorRes('invalid-response') };
            }
         }
      }
      
      await req();

      if (rateLimit) {
         await new Promise(r => setTimeout(r, rateLimit));
         await req();
      }

      if (errorData) return errorData;

      const msg = data.body[0];

      if (!msg.id === messageId) return { error: 'no-match', closest: msg.id, inGuild: true };

      msg.author = new User(msg.author);
      msg.timestamp = new Timestamp(msg.timestamp);

      message = msg;
   }
   return message;
}