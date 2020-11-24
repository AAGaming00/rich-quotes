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

      rawContents[i] = { raw, type: 0 };

      if (/^(?!\\)> (.+)/.test(raw)) {
         rawContents[i].type = 1;

         if (i != 0 && rawContents[i - 1].type === 1)
            rawContents[i].quote = [...rawContents[i - 1].quote, raw.slice(2)];
         else rawContents[i].quote = [raw.slice(2)];
      }

      let mention_match = raw.matchAll(/(?!\\)<@!?(\d{17,19})>/g);

      if (mention_match) {
         let mentions_ = [];

         let matching = true;

         while (matching) {
            let mention = mention_match.next();

            if (!mention.done) mentions_.push({ id: mention.value[1], self: mention.id === currentUser.id });
            else matching = false;
         }

         if (mentions_.length === 1 && /^ ?(?!\\)<@!?\d/.test(raw) && i != 0 && rawContents[i - 1].type === 1) {
            quotes.push({
               content: rawContents[i - 1].quote.join('\n').trim(),
               author: mentions_[0].id
            });
            mentions_[0].self = false;
         }

         if (mentions_.length !== 0) mentions = mentions.length !== 0 ? [ ...mentions, ...mentions_ ] : mentions_;
      }
   }

   if (mentions.length !== 0) mentions.filter(m => m.self);

   if (mentions.length !== 0) broadMention = true;

   return { quotes: quotes.length !== 0 ? quotes : false, broadMention };
}