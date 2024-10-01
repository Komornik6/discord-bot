const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

const stateFilePath = path.resolve(__dirname, 'konkurs_state.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('konkurs')
        .setDescription('Uruchamia konkurs.')
        .addStringOption(option =>
            option.setName('nagroda')
                .setDescription('Nagroda w konkursie.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('czas')
                .setDescription('Czas trwania konkursu.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('jednostka')
                .setDescription('Jednostka czasu (minuty, godziny, dni, tygodnie).')
                .setRequired(true)
                .addChoices(
                    { name: 'Minuty', value: 'minutes' },
                    { name: 'Godziny', value: 'hours' },
                    { name: 'Dni', value: 'days' },
                    { name: 'Tygodnie', value: 'weeks' }
                ))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    run: async (interaction) => {
        const prize = interaction.options.getString('nagroda');
        const duration = interaction.options.getInteger('czas');
        const unit = interaction.options.getString('jednostka');

        let timeInMilliseconds;

        switch (unit) {
            case 'minutes':
                timeInMilliseconds = duration * 60000;
                break;
            case 'hours':
                timeInMilliseconds = duration * 3600000;
                break;
            case 'days':
                timeInMilliseconds = duration * 86400000;
                break;
            case 'weeks':
                timeInMilliseconds = duration * 604800000;
                break;
            default:
                return interaction.reply({ content: '`🕛` Nieprawidłowa jednostka czasu.', ephemeral: true });
        }

        if (timeInMilliseconds > 2592000000) { // 1 miesiąc w milisekundach
            return interaction.reply({ content: '`🕛` Czas trwania konkursu nie może przekraczać 1 miesiąca.', ephemeral: true });
        }

        const endTime = new Date(Date.now() + timeInMilliseconds);
        const formattedEndTime = endTime.toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', hour12: false });
        const timestamp = Math.floor(endTime.getTime() / 1000);

        const embed = new EmbedBuilder()
            .setTitle('🎉 Konkurs 🎉')
            .setDescription(`Weź udział w konkursie, aby wygrać **${prize}**!\n\nAby wziąć udział trzeba zaprosić minimum 1 osobę z linku tymczasowego (.gg/crystalsh0p nie zalicza).
            Zaproszona osoba musi się zweryfikować.\n\n**Udział wzięło**: \`0\`\n**Data zakończenia**: <t:${timestamp}:f>`)
            .setColor('#0014ff')
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('join_giveaway')
                .setLabel('Dołącz')
                .setStyle(ButtonStyle.Success)
        );

        try {
            const message = await interaction.channel.send({ embeds: [embed], components: [row] });

            const participants = new Set();
            const contestId = `contest_${Date.now()}`;
            const contestState = {
                messageId: message.id,
                channelId: interaction.channel.id,
                guildId: interaction.guild.id,
                prize,
                endTime: endTime.getTime(),
                participants: Array.from(participants)
            };

            saveContestState(contestId, contestState);

            await interaction.reply({ content: `🎉 Konkurs został uruchomiony pomyślnie! Wiadomość konkursowa została wysłana. 🎉`, ephemeral: true });

            const collector = message.createMessageComponentCollector({ time: timeInMilliseconds });

            collector.on('collect', (i) => {
                if (!participants.has(i.user.id)) {
                    participants.add(i.user.id);
                    i.reply({ content: '`🎁` Dołączyłeś do konkursu!', ephemeral: true });
                    updateContestMessage(message, participants.size, prize, timestamp);
                    contestState.participants = Array.from(participants);
                    saveContestState(contestId, contestState);
                } else {
                    i.reply({ content: '`🎉` Już dołączyłeś do konkursu!', ephemeral: true });
                }
            });

            collector.on('end', async () => {
                try {
                    const originalMessage = await interaction.channel.messages.fetch(message.id).catch(() => null);

                    if (originalMessage) {
                        const participantArray = Array.from(participants);

                        if (participantArray.length > 0) {
                            const winner = participantArray[Math.floor(Math.random() * participantArray.length)];
                            await originalMessage.reply(`🎉 Gratulacje <@${winner}>! Wygrałeś **${prize}**! 🎉`);
                        } else {
                            await originalMessage.reply('Nikt nie dołączył do konkursu. 😢');
                        }
                    } else {
                        console.log('Wiadomość konkursowa została usunięta. Pomijanie wysyłania wiadomości zakończenia konkursu.');
                    }

                } catch (error) {
                    console.error('Błąd podczas próby zakończenia konkursu:', error);
                } finally {
                    removeContestState(contestId);
                }
            });

        } catch (error) {
            console.error('Błąd podczas wysyłania wiadomości konkursowej:', error);
            await interaction.reply({ content: '`❌` Wystąpił błąd podczas uruchamiania konkursu. Sprawdź logi, aby uzyskać więcej informacji.', ephemeral: true });
        }
    },

    restoreContest: async (client) => {
        if (!fs.existsSync(stateFilePath)) return;

        const contests = JSON.parse(fs.readFileSync(stateFilePath));
        const now = Date.now();

        for (const [contestId, contestState] of Object.entries(contests)) {
            const channel = await client.channels.fetch(contestState.channelId).catch(() => null);
            if (!channel) continue;

            const message = await channel.messages.fetch(contestState.messageId).catch(() => null);
            if (!message) {
                removeContestState(contestId);
                continue;
            }

            const remainingTime = contestState.endTime - now;
            if (remainingTime <= 0) {
                removeContestState(contestId);
                continue;
            }

            const participants = new Set(contestState.participants);
            const duration = Math.floor(remainingTime / 86400000);
            const unit = 'days';
            const formattedEndTime = new Date(contestState.endTime).toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw', hour12: false });
            const timestamp = Math.floor(contestState.endTime / 1000);

            const collector = message.createMessageComponentCollector({ time: remainingTime });

            collector.on('collect', (i) => {
                if (!participants.has(i.user.id)) {
                    participants.add(i.user.id);
                    i.reply({ content: '`🎁` Dołączyłeś do konkursu!', ephemeral: true });
                    updateContestMessage(message, participants.size, contestState.prize, timestamp);
                    contestState.participants = Array.from(participants);
                    saveContestState(contestId, contestState);
                } else {
                    i.reply({ content: '`🎉` Już dołączyłeś do konkursu!', ephemeral: true });
                }
            });

            collector.on('end', async () => {
                try {
                    const originalMessage = await channel.messages.fetch(message.id).catch(() => null);

                    if (originalMessage) {
                        const participantArray = Array.from(participants);

                        if (participantArray.length > 0) {
                            const winner = participantArray[Math.floor(Math.random() * participantArray.length)];
                            await originalMessage.reply(`🎉 Gratulacje <@${winner}>! Wygrałeś **${contestState.prize}**! 🎉`);
                        } else {
                            await originalMessage.reply('Nikt nie dołączył do konkursu. 😢');
                        }
                    } else {
                        console.log('Wiadomość konkursowa została usunięta. Pomijanie wysyłania wiadomości zakończenia konkursu.');
                    }

                } catch (error) {
                    console.error('Błąd podczas próby zakończenia konkursu:', error);
                } finally {
                    removeContestState(contestId);
                }
            });
        }
    }
};

function updateContestMessage(message, participantCount, prize, timestamp) {
    const updatedEmbed = new EmbedBuilder()
        .setTitle('🎉 Konkurs 🎉')
        .setDescription(`Weź udział w konkursie, aby wygrać **${prize}**!\n\nAby wziąć udział trzeba zaprosić minimum 1 osobę z linku tymczasowego (.gg/crystalsh0p nie zalicza).
            Zaproszona osoba musi się zweryfikować.\n\n**Udział wzięło**: \`${participantCount}\`\n**Data zakończenia**: <t:${timestamp}:f>`)
        .setColor('#0014ff')
        .setTimestamp();

    message.edit({ embeds: [updatedEmbed] });
}

function saveContestState(contestId, contestState) {
    let contests = {};
    if (fs.existsSync(stateFilePath)) {
        contests = JSON.parse(fs.readFileSync(stateFilePath));
    }
    contests[contestId] = contestState;
    fs.writeFileSync(stateFilePath, JSON.stringify(contests, null, 2));
}

function removeContestState(contestId) {
    if (!fs.existsSync(stateFilePath)) return;

    const contests = JSON.parse(fs.readFileSync(stateFilePath));
    delete contests[contestId];
    fs.writeFileSync(stateFilePath, JSON.stringify(contests, null, 2));
}
