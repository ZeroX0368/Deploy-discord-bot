
const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ApplicationCommandOptionType, ButtonStyle } = require('discord.js');
const express = require('express');
const axios = require('axios');

// Bot configuration
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const EMBED_COLORS = {
  BOT_EMBED: '#5865F2'
};
const SUPPORT_SERVER = process.env.SUPPORT_SERVER || null;
const DASHBOARD = {
  enabled: false,
  baseURL: ''
};

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Express app for API
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Utility functions
function timeformat(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

function stripIndent(str) {
  return str.replace(/^\s+/gm, '');
}

// Bot stats function
const botstats = require('./shared/botstats');

// Import shared modules for info command
const user = require('./shared/user');
const channelInfo = require('./shared/channel');
const guildInfo = require('./shared/guild');
const avatar = require('./shared/avatar');
const emojiInfo = require('./shared/emoji');

// Slash commands
const commands = [
  {
    name: 'bot',
    description: 'Bot related commands',
    options: [
      {
        name: 'invite',
        description: "Get bot's invite",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'stats',
        description: "Get bot's statistics",
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'uptime',
        description: "Get bot's uptime",
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },
  {
    name: 'dog',
    description: 'Get a random dog image',
  },
  {
    name: 'info',
    description: 'Show various information',
    options: [
      {
        name: 'user',
        description: 'Get user information',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'name',
            description: 'Name of the user',
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: 'channel',
        description: 'Get channel information',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'name',
            description: 'Name of the channel',
            type: ApplicationCommandOptionType.Channel,
            required: false,
          },
        ],
      },
      {
        name: 'guild',
        description: 'Get guild information',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'bot',
        description: 'Get bot information',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'avatar',
        description: 'Display avatar information',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'name',
            description: 'Name of the user',
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: 'emoji',
        description: 'Display emoji information',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'name',
            description: 'Name of the emoji',
            type: ApplicationCommandOptionType.String,
            required: true,
          },
        ],
      },
    ],
  }
];

// Register slash commands
async function registerCommands() {
  try {
    console.log('Started refreshing application (/) commands.');

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
}

// Bot invite function
function botInvite(client) {
  const embed = new EmbedBuilder()
    .setAuthor({ name: "Invite" })
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription("Hey there! Thanks for considering to invite me\nUse the button below to navigate where you want");

  let components = [];
  components.push(new ButtonBuilder().setLabel("Invite Link").setURL(client.getInvite()).setStyle(ButtonStyle.Link));

  if (SUPPORT_SERVER) {
    components.push(new ButtonBuilder().setLabel("Support Server").setURL(SUPPORT_SERVER).setStyle(ButtonStyle.Link));
  }

  let buttonsRow = new ActionRowBuilder().addComponents(components);
  return { embeds: [embed], components: [buttonsRow] };
}

// Bot ready event
client.once('ready', async () => {
  console.log(`${client.user.tag} is online!`);
  
  // Add getInvite method to client
  client.getInvite = () => {
    return `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&scope=bot%20applications.commands`;
  };
  
  await registerCommands();
});

// Interaction handler
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'bot') {
    const sub = interaction.options.getSubcommand();
    
    if (sub === 'invite') {
      const response = botInvite(interaction.client);
      try {
        await interaction.user.send(response);
        return interaction.reply({ content: "Check your DM for my information! :envelope_with_arrow:"});
      } catch (ex) {
        return interaction.reply({ content: "I cannot send you my information! Is your DM open?", ephemeral: true });
      }
    }
    else if (sub === 'stats') {
      const response = botstats(interaction.client);
      return interaction.reply(response);
    }
    else if (sub === 'uptime') {
      await interaction.reply(`My Uptime: \`${timeformat(process.uptime())}\``);
    }
  }
  
  if (commandName === 'dog') {
    try {
      const response = await axios.get('https://dog.ceo/api/breeds/image/random');
      const dogImage = response.data.message;
      
      const embed = new EmbedBuilder()
        .setTitle('🐕 Random Dog Image')
        .setImage(dogImage)
        .setColor(EMBED_COLORS.BOT_EMBED)
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching dog image:', error);
      await interaction.reply({ content: 'Sorry, I could not fetch a dog image right now!', ephemeral: true });
    }
  }
  
  if (commandName === 'info') {
    const sub = interaction.options.getSubcommand();
    if (!sub) return interaction.reply({ content: 'Not a valid subcommand', ephemeral: true });
    
    let response;

    try {
      // user
      if (sub === 'user') {
        let targetUser = interaction.options.getUser('name') || interaction.user;
        let target = await interaction.guild.members.fetch(targetUser);
        response = user(target);
      }

      // channel
      else if (sub === 'channel') {
        let targetChannel = interaction.options.getChannel('name') || interaction.channel;
        response = channelInfo(targetChannel);
      }

      // guild
      else if (sub === 'guild') {
        response = await guildInfo(interaction.guild);
      }

      // bot
      else if (sub === 'bot') {
        response = botstats(interaction.client);
      }

      // avatar
      else if (sub === 'avatar') {
        let target = interaction.options.getUser('name') || interaction.user;
        response = avatar(target);
      }

      // emoji
      else if (sub === 'emoji') {
        let emoji = interaction.options.getString('name');
        response = emojiInfo(emoji);
      }

      // return
      else {
        response = { content: 'Incorrect subcommand', ephemeral: true };
      }

      await interaction.reply(response);
    } catch (error) {
      console.error('Error in info command:', error);
      await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
    }
  }
});

// API Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Discord Bot API',
    endpoints: {
      '/api/dog': 'Get random dog image',
      '/api/bot/stats': 'Get bot statistics'
    }
  });
});

app.get('/api/dog', async (req, res) => {
  try {
    const response = await axios.get('https://dog.ceo/api/breeds/image/random');
    res.json({
      success: true,
      image: response.data.message,
      breed: response.data.message.split('/')[4]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dog image'
    });
  }
});

app.get('/api/bot/stats', (req, res) => {
  if (!client.user) {
    return res.status(503).json({
      success: false,
      error: 'Bot is not ready'
    });
  }

  const stats = {
    guilds: client.guilds.cache.size,
    users: client.guilds.cache.reduce((size, g) => size + g.memberCount, 0),
    channels: client.channels.cache.size,
    uptime: timeformat(process.uptime()),
    ping: client.ws.ping
  };

  res.json({
    success: true,
    stats
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);
});

// Login bot
if (TOKEN) {
  client.login(TOKEN);
} else {
  console.error('DISCORD_TOKEN not found in environment variables');
}
