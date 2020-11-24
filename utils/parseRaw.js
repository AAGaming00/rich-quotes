const { getModule } = require('powercord/webpack');

/**
 * Get markdown quotes from message contents
 * @param {Object[]} rawContents 
 */
module.exports = function parseRaw(rawContents) {
   const currentUser = getModule(['getCurrentUser'], false).getCurrentUser();

   let quotes = [],
       mentions = [],
       broadMention = false;

   for (let i in rawContents) {
      const raw = `${rawContents[i]}`;

      let leave = { raw, type: 0 };

      if (/^(?!\\)> (.+)/.test(raw)) {
         leave.type = 1;

         if (i != 0 && rawContents[i - 1].type === 1)
            leave.quote = [...rawContents[i - 1].quote, raw.slice(2)];
         else leave.quote = [ raw.slice(2) ];

         rawContents[i] = leave;
      }

      if (leave.type === 0) {
         let mention_match = raw.matchAll(/(?!\\)<@!?(\d{17,19})>/g);

         if (mention_match) {
            let lineMentions = [];

            let matching = true;

            while (matching) {
               let mention = mention_match.next();

               if (!mention.done) mentions_.push({ 
                  id: mention.value[1], 
                  index: mention.value.index,
                  self: mention.value[1] === currentUser.id 
               }); else matching = false;
            }

            if (lineMentions.length !== 0 && i != 0) {
               const mention = lineMentions[0];

               if (mention.index <= 1 && rawContents[i - 1].type === 1) {
                  quotes.push({
                     content: rawContents[i - 1].quote.join('\n').trim(),
                     author: mention.id
                  });

                  lineMentions[0].self = false;
               }
            }

            if (lineMentions.length !== 0) mentions = mentions.length !== 0 ? [ ...mentions, ...lineMentions ] : lineMentions;
         }
      }
   }

   if (mentions.length !== 0) mentions = mentions.filter(m => m.self === true);

   if (mentions.length !== 0) broadMention = true;

   return { quotes: quotes.length !== 0 ? quotes : false, broadMention };
}