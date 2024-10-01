const { Client, IntentsBitField, Collection, ActivityType } = require('discord.js');
const { TOKEN } = require('./config.json');
const fs = require('fs');

const client = new Client({ intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildBans,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent
] });

client.commands = new Collection();
client.config = require('./config.json');
client.newest = null;
client.payments = [];

client.once('ready', async () => {
    fs.readdirSync('./handlers').forEach(async handler => { await require(__dirname + `/handlers/${handler}`)(client) })
    console.log('Ready!');
    client.user.setPresence({activities: [{ name: ` Crystal Sh0p 🔮 `, type: ActivityType.Watching }],});

    // Przywrócenie stanu konkursu po restarcie
    const konkurs = require('./commands/konkurs.js');
    await konkurs.restoreContest(client);

    // Przywrócenie stanu slotów po restarcie
    const slot = require('./commands/slot.js');
    slot.onReady(client);
});

client.login(TOKEN)