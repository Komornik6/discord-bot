const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('donate')
        .setDescription('Podaje link do darowizn na rzecz serwera.'),

    run: async (interaction, client) => {
        await interaction.reply({ embeds: [
            new EmbedBuilder()
                .setTitle('Wesprzyj nas!')
                .setDescription('Wpłać nam darowiznę: [Kliknij Tutaj](https://buycoffee.to/galemma)')
                .setColor('#0014ff')
        ]});
    }
};
