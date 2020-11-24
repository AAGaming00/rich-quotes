const setting = (title, description, fallback = true) => {
   return { strings: [ title, description ], fallback }
}

module.exports = {
   linkSelector: /https?:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/channels\/(\d{17,19}|@me)\/(\d{17,19})\/(\d{17,19})/,

   settings: {
      list: {
         displayChannel: setting('Display Channel', 'When disabled channel will instead be displayed in info.'),
         displayTimestamp: setting('Display Timestamps', 'When disabled timestamps will instead be displayed in info.'),
         displayMoreBtn: setting('Display More Button', 'When disabled will not display More button.'),
         displayNickname: setting('Display Nickname', 'When disabled will always show actual username.'),
         displayReactions: setting('Display Reactions', 'When disabled will not display reactions.'),
         cullBotQuotes: setting('Cull Bot Quotes', 'Removes embeds from bot messages that have an error-free linked quote.'),

         displayEmbeds: setting('Display Embeds', 'When disabled will not display images/videos/etc.'),

         embedImages: setting('Embed Images', 'When disabled will not display images.'),
         embedVideos: setting('Embed Videos', 'When disabled will not display regular videos.'),
         embedYouTube: setting('Embed YouTube', 'When disabled will not display special external vidoes like YouTube.'),
         embedAudio: setting('Embed Audio', 'When disabled will not display attached audio files.'),
         embedFile: setting('Embed Files', 'When disabled will not display attached misc. files.'),
         //embedSpecial: setting('Embed Special', 'When disabled will not display special embeds eg. Sketchfab.'),
         embedOther: setting('Embed Other', 'When disabled will not display misc. embeds eg. github repo description.'),

         embedAll: setting('', ''),

         cacheSearch: setting('Cache quote searches', 'When disabled quote search will no longer cache results.'),
         partialQuotes: setting('Partial Quotes', 'When disabled full messages will display on cached quotes.'),
         clearCache: setting('Clear Cache', 'When disabled quote search will no longer cache results.')
      },
      display: [ 0, 7 ],
      embeds: [ 7, 6 ]
   }
}