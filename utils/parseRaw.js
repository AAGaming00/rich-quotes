const { getModule } = require('powercord/webpack');

/**
 * Get markdown quotes from message contents
 * @param {Object[]} rawContents 
 */
module.exports = function parseRaw(rawContents) {
   const currentUser = getModule(['getCurrentUser'], false).getCurrentUser();

   let quotes = [],
      broadMention = false;

   for (let i in rawContents) {
      const raw = `${rawContents[i]}`;

      rawContents[i] = { raw, type: 0 };

      if (/^> (.+)/.test(raw)) {
         rawContents[i].type = 1;

         if (i != 0 && rawContents[i - 1].type === 1)
            rawContents[i].quote = [...rawContents[i - 1].quote, raw.slice(2)];
         else rawContents[i].quote = [raw.slice(2)];
      }

      if (/^ ?<@!?(\d+)>/.test(raw)) {
         const id = /^ ?<@!?(\d+)>/.exec(raw)[1];

         if (i != 0 && rawContents[i - 1].type === 1) quotes.push({
            content: rawContents[i - 1].quote.join('\n').trim(),
            author: id
         });
         else if (id === currentUser.id) broadMention = true;
      }
   }

   return { quotes: quotes.length !== 0 ? quotes : false, broadMention };
}