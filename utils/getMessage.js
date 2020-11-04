const { getModule, http: { get }, constants: { Endpoints } } = require('powercord/webpack');

const User = getModule(m => m.prototype && m.prototype.tag, false);
const Timestamp = getModule(m => m.prototype && m.prototype.toDate && m.prototype.month, false);
const { getMessage } = getModule(['getMessages'], false);

function lastFetch(set = false) {
   if (!window.localStorage.richQuoteFetch) return 0;
   else if (!set) return JSON.parse(window.localStorage.richQuoteFetch).timestamp;
   else return window.localStorage.richQuoteFetch = JSON.stringify({ timestamp: Date.now() });
}

module.exports = async (guildId, channelId, messageId) => {
   let message = getMessage(channelId, messageId);

   if (!message) {
      if (lastFetch() > Date.now() - 2500) await new Promise(r => setTimeout(r, 2500));
      
      const { getGuilds } = await getModule(['getGuilds']);

      let data;
      let errorData = false;
      let rateLimit = false;

      const inGuild = guildId === '@me' ? true : (() => {
         let is = false;
         Object.keys(getGuilds()).forEach((key) => { if (key == guildId) is = true }); return is
      })();

      const req = async () => {
         try {data = await get({
            url: Endpoints.MESSAGES(channelId),
            query: { limit: 1, around: messageId },
            retries: 2
         })} catch (e) {
            if (!e.text) return { error: 'failed-request', inGuild: inGuild };
   
            const error = JSON.parse(e.text);
   
            console.log(JSON.parse(e.text));
   
            switch (error.message) {
               case 'Unknown Channel': { return errorData = { error: 'unknown-channel', inGuild: true } };
               case 'Missing Access': { return errorData = { error: 'missing-access', inGuild: inGuild } };
               case 'You are being rate limited.': { rateLimit = error.retry_after * 1000 } break;
               default: { return errorData = { error: 'invalid-response', inGuild: inGuild } };
            }
         }
      }
      
      await req();

      if (rateLimit) {
         await new Promise(r => setTimeout(r, rateLimit));
         await req();
      }

      lastFetch(true);

      if (errorData) return errorData;

      const msg = data.body[0];

      if (!msg.id === messageId) return { error: 'no-match', closest: msg.id, inGuild: true };

      if (!inGuild) return { error: 'missing-access', inGuild: false }

      msg.author = new User(msg.author);
      msg.timestamp = new Timestamp(msg.timestamp);

      message = msg;
   }
   return message;
}