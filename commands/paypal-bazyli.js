const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('paypal_bazyli')
        .setDescription('Wyświetla informacje o płatności')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    run: async (interaction, client) => {
        await interaction.reply({ embeds: [
            new EmbedBuilder()
                .setTitle('<:PayPal:1223745769425866813> Szczegóły Płatności PayPal!')
                .setDescription('**Mail:** `Bazyli.pay@proton.me`\n`🙍‍♂️` **Rodzina I Znajomi**\n`❌` **Brak Notatki**\n`✅` **Po wysłaniu pieniędzy wyślij zrzut ekranu z potwierdzeniem**')
                .setColor('#0014ff')
        ]});
    }
};
