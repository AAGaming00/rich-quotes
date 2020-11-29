const setting = (title, description, fallback = true) => {
   return { strings: [ title, description ], fallback }
}

module.exports = {
   list: {
      displayChannel: setting('Display Channel', 'When disabled channel will instead be displayed in info.'),
      displayTimestamp: setting('Display Timestamps', 'When disabled timestamps will instead be displayed in info.'),
      displayMoreBtn: setting('Display More Button', 'When disabled will not display More button.'),
      displayNickname: setting('Display Nickname', 'When disabled will always show actual username.'),
      displayReactions: setting('Display Reactions', 'When disabled will not display reactions.'),

      displayEmbeds: setting('Display Embeds', 'When disabled will not display images/videos/etc.'),

      embedImages: setting('Embed Images', 'When disabled will not display images.'),
      embedVideos: setting('Embed Videos', 'When disabled will not display regular videos.'),
      embedYouTube: setting('Embed YouTube', 'When disabled will not display special external vidoes like YouTube.'),
      embedAudio: setting('Embed Audio', 'When disabled will not display attached audio files.'),
      embedFile: setting('Embed Files', 'When disabled will not display attached misc. files.'),
      //embedSpecial: setting('Embed Special', 'When disabled will not display special embeds eg. Sketchfab.'),
      embedOther: setting('Embed Other', 'When disabled will not display misc. embeds eg. github repo description.'),

      embedAll: setting('', ''),

      nestedQuotes: setting('Quote Nesting', 'Control how many levels of nesting is rendered within quotes (0 for none, will apply to replies as well).', 3),

      cullQuoteCommands: setting('Cull Quote Commands', 'Removes messages that look like a quote bot command from chat.'),

      cullBotQuotes: setting('Cull Bot Quotes', 'Removes embeds from bot messages that have an error-free linked quote.'),


      replyReplace: setting('Replace Replies', 'When disabled will not replace replies in top-level messages.'),

      replyMode: {
         strings: {
            'Reply Display Mode': 'Controls reply display for replacement & inside quotes (nested).',

            'Natural': 'Closest to discord\'s; keeps same parent header & removes header of Rich Quote.',
            'Middle': 'Removes parent header reply text and makes some minor tweaks to Rich Quote.',
            'Standard': 'Removes parent header reply text, changes nothing about Rich Quote design, and looks as if it was a link.'
         },
         fallback: 0
      },

      reply_displayMoreBtn: setting('', ''),

      reply_displayEmbeds: setting('', ''),


      cacheSearch: setting('Cache quote searches', 'When disabled quote search will no longer cache results.'),
      partialQuotes: setting('Partial Quotes', 'When disabled full messages will display on cached quotes.'),
      clearCache: setting('Clear Cache', 'When disabled quote search will no longer cache results.')
   },
   display: [ 0, 6 ],
   embeds: [ 6, 6 ]
}