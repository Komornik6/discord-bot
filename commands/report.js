const fs = require('fs');
const { SlashCommandBuilder, EmbedBuilder, WebhookClient } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Zgłasza użytkownika do administracji.')
        .addUserOption(option =>
            option.setName('nazwa_użytkownika')
                .setDescription('Użytkownik, którego chcesz zgłosić.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('powód')
                .setDescription('Powód zgłoszenia.')
                .setRequired(true)),

    run: async (interaction) => {
        const reportedUser = interaction.options.getUser('nazwa_użytkownika');
        const reason = interaction.options.getString('powód');
        const reportingUser = interaction.user;

        await interaction.reply({ content: `Dziękujemy, zgłoszenie zostało przyjęte.`, ephemeral: true });

        if (!reportedUser) {
            return interaction.reply({ content: 'Nie znaleziono użytkownika do zgłoszenia.', ephemeral: true });
        }

        try {
            const report = {
                reportedUserId: reportedUser.id,
                reportedUserName: reportedUser.tag,
                reportingUserId: reportingUser.id,
                reportingUserName: reportingUser.tag,
                reason: reason,
                timestamp: new Date().toISOString()
            };

            fs.readFile('report.json', 'utf8', (err, data) => {
                if (err) {
                    console.error(err);
                    return interaction.reply({ content: 'Wystąpił błąd podczas zapisywania zgłoszenia.', ephemeral: true });
                }

                let reports = [];
                if (data) {
                    reports = JSON.parse(data);
                }
                reports.push(report);

                fs.writeFile('report.json', JSON.stringify(reports, null, 2), err => {
                    if (err) {
                        console.error(err);
                        return interaction.reply({ content: 'Wystąpił błąd podczas zapisywania zgłoszenia.', ephemeral: true });
                    }
                    console.log(`Zapisano zgłoszenie: ${reportedUser.tag} | Powód: ${reason} | Zgłoszone przez: ${reportingUser.tag}`);

                    interaction.channel.send(`Dziękujemy za zgłoszenie <@${reportingUser.id}>. Zgłoszenie zostało przyjęte.`);

                    const webhookClient = new WebhookClient({
                        id: '', // ID webhooka
                        token: '' // Token webhooka
                    });

                    const embed = new EmbedBuilder()
                        .setTitle('Nowe Zgłoszenie')
                        .setColor('#0014ff')
                        .addFields(
                            { name: 'Zgłoszony Użytkownik', value: `<@${reportedUser.id}>`, inline: true },
                            { name: 'Powód', value: reason, inline: true },
                            { name: 'Zgłoszone przez', value: `<@${reportingUser.id}>`, inline: true },
                            { name: 'Czas', value: new Date().toISOString(), inline: true }
                        )
                        .setTimestamp();

                    webhookClient.send({
                        embeds: [embed.toJSON()]
                    }).then(() => {
                        webhookClient.destroy();
                    }).catch(error => {
                        console.error('Błąd podczas wysyłania webhooka:', error);
                        interaction.reply({ content: 'Wystąpił błąd podczas wysyłania zgłoszenia.', ephemeral: true });
                    });
                });
            });

        } catch (error) {
            console.error(error);
            interaction.reply({ content: 'Wystąpił błąd podczas wysyłania zgłoszenia.', ephemeral: true });
        }
    }
};
