const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');

const discountFilePath = './discounts.json';
const webhookUrl = '';

const generateDiscountCode = () => {
    return crypto.randomBytes(16).toString('hex').toUpperCase().slice(0, 16).match(/.{1,4}/g).join('-');
};

const saveDiscounts = (discounts) => {
    try {
        fs.writeFileSync(discountFilePath, JSON.stringify(discounts, null, 2));
    } catch (error) {
        console.error('Błąd zapisu pliku rabatów:', error);
    }
};

const loadDiscounts = () => {
    if (fs.existsSync(discountFilePath)) {
        try {
            return JSON.parse(fs.readFileSync(discountFilePath));
        } catch (error) {
            console.error('Błąd odczytu pliku rabatów:', error);
            return {};
        }
    }
    return {};
};

const logToWebhook = async (discountCode, user, interactionUser) => {
    const embed = new EmbedBuilder()
        .setTitle('Nowy Rabat')
        .setColor('#0014ff')
        .addFields(
            { name: 'Wysłano do', value: `<@${user.id}>`, inline: true },
            { name: 'Kod Rabatowy', value: discountCode, inline: true },
            { name: 'Wysłane przez', value: `<@${interactionUser.id}>`, inline: true },
            { name: 'Czas', value: new Date().toISOString(), inline: true }
        )
        .setTimestamp();

    try {
        await axios.post(webhookUrl, {
            embeds: [embed.toJSON()],
        });
    } catch (error) {
        console.error('Błąd wysyłania logów do webhooka:', error);
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rabat')
        .setDescription('Wysyła kod rabatowy do użytkownika.')
        .addUserOption(option =>
            option.setName('nick')
                .setDescription('Użytkownik, któremu chcesz wysłać kod rabatowy.')
                .setRequired(true))
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

    run: async (interaction) => {
        const user = interaction.options.getUser('nick');
        const discountCode = generateDiscountCode();
        const message = `Dziękujemy za zakup w naszym sklepie. Oto twój kod rabatowy -5% na następne zakupy \`${discountCode}\``;

        const discounts = loadDiscounts();

        discounts[discountCode] = {
            ownerId: user.id,
            used: false
        };

        saveDiscounts(discounts);

        try {
            await user.send(message);
            await interaction.reply({ content: `Kod rabatowy został wysłany do ${user.tag}.`, ephemeral: true });

            console.log(`Kod rabatowy ${discountCode} został wysłany do użytkownika ${user.tag} (${user.id}).`);

            await logToWebhook(discountCode, user, interaction.user);

        } catch (error) {
            console.error('Błąd wysyłania wiadomości prywatnej:', error);
            await interaction.reply({ content: 'Nie mogę wysłać wiadomości do tego użytkownika.', ephemeral: true });
        }
    }
};
