const { EmbedBuilder, ChannelType } = require("discord.js");

const EMBED_COLORS = {
  BOT_EMBED: '#5865F2'
};

function stripIndent(str) {
  return str.replace(/^\s+/gm, '');
}

function channelTypes(type) {
  const types = {
    [ChannelType.GuildText]: 'Text',
    [ChannelType.DM]: 'DM',
    [ChannelType.GuildVoice]: 'Voice',
    [ChannelType.GroupDM]: 'Group DM',
    [ChannelType.GuildCategory]: 'Category',
    [ChannelType.GuildAnnouncement]: 'Announcement',
    [ChannelType.GuildNews]: 'News',
    [ChannelType.PublicThread]: 'Public Thread',
    [ChannelType.PrivateThread]: 'Private Thread',
    [ChannelType.GuildStageVoice]: 'Stage Voice',
    [ChannelType.GuildDirectory]: 'Directory',
    [ChannelType.GuildForum]: 'Forum'
  };
  return types[type] || 'Unknown';
}

module.exports = (channel) => {
  const { id, name, parent, position, type } = channel;

  let desc = stripIndent`
      ❯ ID: **${id}**
      ❯ Name: **${name}**
      ❯ Type: **${channelTypes(channel.type)}**
      ❯ Category: **${parent || "NA"}**\n
      `;

  if (type === ChannelType.GuildText) {
    const { rateLimitPerUser, nsfw } = channel;
    desc += stripIndent`
      ❯ Topic: **${channel.topic || "No topic set"}**
      ❯ Position: **${position}**
      ❯ Slowmode: **${rateLimitPerUser}**
      ❯ isNSFW: **${nsfw ? "✓" : "✕"}**\n
      `;
  }

  if (type === ChannelType.GuildPublicThread || type === ChannelType.GuildPrivateThread) {
    const { ownerId, archived, locked } = channel;
    desc += stripIndent`
      ❯ Owner Id: **${ownerId}**
      ❯ Is Archived: **${archived ? "✓" : "✕"}**
      ❯ Is Locked: **${locked ? "✓" : "✕"}**\n
      `;
  }

  if (type === ChannelType.GuildNews || type === ChannelType.GuildNewsThread) {
    const { nsfw } = channel;
    desc += stripIndent`
      ❯ isNSFW: **${nsfw ? "✓" : "✕"}**\n
      `;
  }

  if (type === ChannelType.GuildVoice || type === ChannelType.GuildStageVoice) {
    const { bitrate, userLimit, full } = channel;
    desc += stripIndent`
      ❯ Position: **${position}**
      ❯ Bitrate: **${bitrate}**
      ❯ User Limit: **${userLimit}**
      ❯ isFull: **${full ? "✓" : "✕"}**\n
      `;
  }

  const embed = new EmbedBuilder()
    .setAuthor({ name: "Channel Details" })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(desc);

  return { embeds: [embed] };
};
