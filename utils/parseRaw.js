const { getModule } = require('powercord/webpack');

/**
 * Get markdown quotes from message contents
 * @param {String[]} rawContents 
 */
module.exports = function parseRaw(rawContents) {
   const currentUser = getModule(['getCurrentUser'], false).getCurrentUser();

   let quotes = [],
       mentions = [],
       hasLink = false,
       isCommand = false,
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

         let lineMentions = [];

         if (mention_match) {

            let matching = true;

            while (matching) {
               let mention = mention_match.next();

               if (!mention.done) lineMentions.push({ 
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

         let urlMatch = raw.match(/https?:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/channels\/(?:\d{17,19}|@me)\/(?:\d{17,19})\/(?:\d{17,19})/);

         const testCommand = lineMentions.length === 0 && rawContents.length === 1;

         if (urlMatch) {
            hasLink = true;

            if (testCommand && (new RegExp(`^(?:[^\\s]{0,4})quote(?:[^\\s]{0,2})? ${urlMatch[0]}(?:\\s+)?$`)).test(raw)) 
               isCommand = true;
         } else if (testCommand && /^(?:[^\s]{0,4})quote(?:[^\s]{0,2})? (?:\d{17,19})(?:\s+)?$/.test(raw)) isCommand = true;
      }
   }

   if (mentions.length !== 0) mentions = mentions.filter(m => m.self === true);

   if (mentions.length !== 0) broadMention = true;

   return { quotes: quotes.length !== 0 ? quotes : false, broadMention, hasLink, isCommand };
}