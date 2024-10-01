const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, PermissionsBitField } = require('discord.js');

module.exports = {

    data: new SlashCommandBuilder()
        .setName('weryfikacja')
        .setDescription('Ustawia weryfikację na serwerze.')
        .addChannelOption(o => o
            .setName('kanał')
            .setDescription('Kanał, na którym będą wysyłane wiadomości o weryfikacji.')
            .setRequired(true))
        .addStringOption(o => o
            .setName('wiadomość')
            .setDescription('Wiadomość, która będzie użyta w embedzie.')
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
        

    run: async (interaction, client) => {
        
        const channel = interaction.options.getChannel('kanał');
        const message = interaction.options.getString('wiadomość');

        await channel.send({ embeds: [
            new EmbedBuilder()
                .setTitle('Weryfikacja')
                .setDescription(message)
                .setColor('#00af4b')
        ], components: [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('verify')
                    .setLabel('Zweryfikuj')
                    .setStyle(3)
            )
        ] })

        await interaction.reply({ content: 'Weryfikacja została ustawiona!', ephemeral: true });

    }

}