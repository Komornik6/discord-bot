const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('krypto')
        .setDescription('Wyświetla informacje o płatności')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    run: async (interaction, client) => {
        await interaction.reply({ embeds: [
            new EmbedBuilder()
                .setTitle('Szczegóły Płatności Kryptowalutami!')
                .setDescription('<:ltc:1223745543965114458> **LTC:** `ltc1qk95p3624fdnd7vyxj5usymv904wwpz3hvxp8n7`\n<:Usdt:1223745481633697792> **USDT**: `0xA37eb2B3Bb0f9A15BF012d11C2F36A71938b3D0b`\n<:Bitcone:1223745477984522280> **BTC:** `bc1qmflzz28306cv3unmztgzlzc5p93pk9lgtqvlcq`\n<:ETH:1234086992208334939> **ETH:** `0xA37eb2B3Bb0f9A15BF012d11C2F36A71938b3D0b`')
                .setColor('#0014ff')
        ]});
    }
};
