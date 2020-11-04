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

      let data;

      const { getGuilds } = await getModule(['getGuilds']);

      const inGuild = guildId === '@me' ? true : (() => {
         let is = false;
         Object.keys(getGuilds()).forEach((key) => { if (key == guildId) is = true }); return is
      })();

      try {
         data = await get({
            url: Endpoints.MESSAGES(channelId),
            query: { limit: 1, around: messageId },
            retries: 2
         })
      } catch (e) {
         if (!e.text) return { error: 'failed-request', inGuild: inGuild };

         const error = JSON.parse(e.text).message;

         switch (error) {
            case 'Unknown Channel': return { error: 'unknown-channel', inGuild: true };
            case 'Missing Access': return { error: 'missing-access', inGuild: inGuild };
            default: return { error: 'invalid-response', inGuild: inGuild };
         }
      }

      lastFetch(true);

      const msg = data.body[0];

      if (!msg.id === messageId) return { error: 'no-match', closest: msg.id, inGuild: true };

      if (!inGuild) return { error: 'missing-access', inGuild: false }

      msg.author = new User(msg.author);
      msg.timestamp = new Timestamp(msg.timestamp);

      message = msg;
   }
   return message;
}