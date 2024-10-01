const { REST, Routes } = require('discord.js');
const { rootGuild, TOKEN } = require('../config.json');
const { readdirSync } = require('fs');

module.exports = async (client) => {

    const commands = [];
    const rest = new REST({ version: '10' }).setToken(TOKEN);

    console.log(`Started refreshing application (/) commands.`);
    readdirSync('./commands').filter(f => f.endsWith('.js')).forEach(async command => {
        const { data, run } = require(`../commands/${command}`);
        try {
            client.commands.set(data.name, run)
            commands.push(data.toJSON());
        } catch (error) {
            console.error(error);
        };

    })

    await rest.put(
        Routes.applicationGuildCommands(client.application.id, rootGuild),
        { body: commands },
    );

    console.log(`Successfully reloaded application (/) commands.`);

}