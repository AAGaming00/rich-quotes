// @todo This giant hack has false negatives, eventually should be fixed
const spoilerMatcher = (b) => new RegExp(`\\|\\|${b.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&').replace('\/\/','\/\/(.*?)').replace(/\//g,'\\/')}(.*?)\\|\\|`);

const mime = require('../node_modules/mime-types')

module.exports = (messageData, settings, hasEmbedSpoilers) => {
    if (!settings.embedAll) {
        if (messageData.embeds?.length !== 0) {
            let colorFixes = [];
            let urls = []

            messageData.embeds = messageData.embeds?.filter((embed, i) => {
                if (spoilerMatcher(embed.url).test(messageData.content)) hasEmbedSpoilers = true;
                if (typeof embed.color !== 'string') colorFixes.push(i);

                let keepEmbed = true;

                if (embed.image) keepEmbed = settings.embedImages;
                else if (embed.video) {
                    keepEmbed = settings.embedVideos;
                    if (!embed.video.proxyURL) keepEmbed = settings.embedYouTube
                } else keepEmbed = settings.embedOther;

                if (keepEmbed) urls.push(embed.url);

                if (urls.length === 1 && messageData.content === urls[0]) messageData.content = '';

                return keepEmbed;
            });

            // @todo Move this to filter?
            if (colorFixes.length !== 0) colorFixes.forEach((e, i) => { if (messageData.embeds[i]) messageData.embeds[i].color = '#00000000' });
        }

        if (messageData.attachments?.length !== 0)
        messageData.attachments = messageData.attachments.filter((file) => {
            const mime_type = mime.lookup(file.proxy_url.split('/')[6]);
            if (mime_type) switch (mime_type.split('/')[0]) {
                case 'image': return settings.embedImages; break;
                case 'video': return settings.embedVideos; break;
                case 'audio': return settings.embedAudio; break;
                default: return settings.embedFile; break;
            }
            else return settings.embedFile;
        });
    } else {
        let urls = [];

        messageData.embeds.forEach((embed, i) => {
            if (spoilerMatcher(embed.url).test(messageData.content)) hasEmbedSpoilers = true;
            if (typeof embed.color !== 'string') messageData.embeds[i].color = '#00000000';
            urls.push(embed.url);
        });

        if (urls.length === 1 && messageData.content === urls[0]) messageData.content = '';
    }
}