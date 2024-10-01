const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {

    data: new SlashCommandBuilder()
        .setName('banlist')
        .setDescription('Wyświetla listę zbanowanych użytkowników.')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    run: async (interaction, client) => {

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: 'Nie masz uprawnień do używania tej komendy!', ephemeral: true });
        }

        try {
            const bans = await interaction.guild.bans.fetch();
            if (bans.size === 0) {
                return interaction.reply({ content: 'Na tym serwerze nie ma zbanowanych użytkowników.', ephemeral: true });
            }

            const bannedUsers = bans.map(banInfo => {
                return {
                    username: banInfo.user.tag,
                    reason: banInfo.reason || 'Brak powodu'
                };
            });

            const embed = new EmbedBuilder()
                .setTitle('Lista zbanowanych użytkowników')
                .setColor('#0014ff')
                .setDescription(bannedUsers.map(user => `**Użytkownik:** ${user.username}\n**Powód:** ${user.reason}`).join('\n\n'));

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'Wystąpił błąd podczas pobierania listy zbanowanych użytkowników.', ephemeral: true });
        }
    }
};
