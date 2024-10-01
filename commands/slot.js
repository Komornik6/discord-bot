const { SlashCommandBuilder, PermissionsBitField, ChannelType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const SLOTS_FILE = path.resolve(__dirname, 'slots.json');

const CATEGORY_ID = '1238033145291608085'; // Zamień na ID swojej kategorii

const saveSlotData = (data) => {
    fs.writeFileSync(SLOTS_FILE, JSON.stringify(data, null, 2));
};

const loadSlotData = () => {
    if (!fs.existsSync(SLOTS_FILE)) {
        return [];
    }
    const rawData = fs.readFileSync(SLOTS_FILE, 'utf8');
    return JSON.parse(rawData);
};

const scheduleChannelRemoval = (guild, channelId, timeout) => {
    const MAX_TIMEOUT = 2147483647;

    if (timeout > MAX_TIMEOUT) {
        setTimeout(() => {
            console.log(`Ciąg dalszy czekania na usunięcie kanału o ID "${channelId}"...`);
            scheduleChannelRemoval(guild, channelId, timeout - MAX_TIMEOUT);
        }, MAX_TIMEOUT);
    } else {
        setTimeout(async () => {
            try {
                const channel = guild.channels.cache.get(channelId);
                if (channel) {
                    await channel.delete();
                    console.log(`Usunięto kanał o ID "${channelId}".`);

                    const data = loadSlotData().filter(entry => entry.channelId !== channelId);
                    saveSlotData(data);
                }
            } catch (error) {
                console.error(`Błąd podczas usuwania kanału o ID "${channelId}":`, error);
            }
        }, timeout);
    }
};

const resumeScheduledRemovals = (client) => {
    const slotData = loadSlotData();
    const now = Date.now();

    slotData.forEach(async (entry) => {
        if (entry.removeAfter === null) {
            console.log(`Kanał o ID "${entry.channelId}" jest ustawiony na na zawsze - nie będzie usuwany.`);
            return;
        }

        const remainingTime = entry.removeAfter - now;
        if (remainingTime > 0) {
            scheduleChannelRemoval(client.guilds.cache.get(entry.guildId), entry.channelId, remainingTime);
        } else {
            const channel = client.guilds.cache.get(entry.guildId).channels.cache.get(entry.channelId);
            if (channel) {
                await channel.delete();
                console.log(`Kanał o ID "${entry.channelId}" został usunięty natychmiastowo.`);
                const data = loadSlotData().filter(e => e.channelId !== entry.channelId);
                saveSlotData(data);
            }
        }
    });
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slot')
        .setDescription('Tworzy tymczasowy kanał z uprawnieniami dla właściciela.')
        .addStringOption(option =>
            option.setName('nazwa_kanału')
                .setDescription('Nazwa kanału, który chcesz utworzyć.')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('właściciel')
                .setDescription('Właściciel kanału.')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('czas_trwania')
                .setDescription('Czas trwania kanału: 0 (na zawsze) lub maksymalnie do 60 dni (w minutach).')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('ilość_pingów')
                .setDescription('Ilość pingów dla właściciela.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels),

    run: async (interaction) => {
        const channelName = interaction.options.getString('nazwa_kanału');
        const owner = interaction.options.getUser('właściciel');
        const duration = interaction.options.getInteger('czas_trwania');
        const pings = interaction.options.getInteger('ilość_pingów');
        const guild = interaction.guild;

        if (duration !== 0 && (duration < 1 || duration > 86400)) { // 60 dni w minutach = 86400 minut
            return interaction.reply({ content: 'Czas trwania musi wynosić 0 (na zawsze) lub maksymalnie do 60 dni (86400 minut).', ephemeral: true });
        }

        try {
            const newChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: CATEGORY_ID,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: owner.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages], // Ustaw uprawnienia dla właściciela
                    },
                    {
                        id: '1201659037033173072', // ID roli użytkownika
                        allow: [PermissionsBitField.Flags.ViewChannel],
                        deny: [PermissionsBitField.Flags.SendMessages],
                    },
                ],
            });

            let endDate;
            let removeAfter;
            if (duration > 0) {
                const timestamp = Math.floor((Date.now() + duration * 60 * 1000) / 1000);
                endDate = `<t:${timestamp}:f>`;
                removeAfter = Date.now() + duration * 60 * 1000;
                scheduleChannelRemoval(guild, newChannel.id, duration * 60 * 1000);
            } else {
                endDate = 'Kanał aktywny na zawsze';
                removeAfter = null;
            }

            const embed = new EmbedBuilder()
                .setTitle('Informacje o slocie')
                .setColor('#0014ff')
                .addFields(
                    { name: 'Sprzedawca', value: `<@${owner.id}>`, inline: true },
                    { name: 'ID Użytkownika', value: owner.id, inline: true },
                    { name: 'Data zakończenia slota', value: endDate, inline: false }
                )
                .setTimestamp();

            await newChannel.send({ embeds: [embed] });

            console.log(`Utworzono kanał ${newChannel.name} dla ${owner.tag}`);

            await interaction.reply({ content: `Kanał <#${newChannel.id}> został utworzony dla ${owner}.`, ephemeral: true });

            const slotData = loadSlotData();
            slotData.push({
                channelId: newChannel.id,
                guildId: guild.id,
                ownerId: owner.id,
                remainingPings: pings,
                removeAfter: removeAfter
            });
            saveSlotData(slotData);
        } catch (error) {
            console.error('Błąd podczas tworzenia kanału:', error);
            interaction.reply({ content: 'Wystąpił błąd podczas tworzenia kanału.', ephemeral: true });
        }
    },

    onReady: (client) => {
        resumeScheduledRemovals(client);
    }
};
