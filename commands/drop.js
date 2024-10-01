const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const { DateTime } = require("luxon");
const fs = require("fs");
const crypto = require("crypto");
const ms = require("ms");
const axios = require("axios");

const discountFilePath = "./discounts.json";
const webhookUrl = "";

const generateDiscountCode = () => {
  return crypto
    .randomBytes(16)
    .toString("hex")
    .toUpperCase()
    .slice(0, 16)
    .match(/.{1,4}/g)
    .join("-");
};

const saveDiscounts = (discounts) => {
  try {
    fs.writeFileSync(discountFilePath, JSON.stringify(discounts, null, 2));
  } catch (error) {
    console.error("Błąd zapisu pliku rabatów:", error);
  }
};

const loadDiscounts = () => {
  if (fs.existsSync(discountFilePath)) {
    try {
      return JSON.parse(fs.readFileSync(discountFilePath));
    } catch (error) {
      console.error("Błąd odczytu pliku rabatów:", error);
      return {};
    }
  }
  return {};
};

const formatDate = (date) => {
  return new Date(date).toLocaleString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const logToWebhook = async (discountCode, user, interactionUser) => {
  const embed = new EmbedBuilder()
    .setTitle("Nowy Rabat")
    .setColor("#0014ff")
    .addFields(
      { name: "Wysłano do", value: `<@${user.id}>`, inline: true },
      { name: "Kod Rabatowy", value: discountCode, inline: true },
      {
        name: "Wysłane przez",
        value: `<@${interactionUser.id}>`,
        inline: true,
      },
      { name: "Czas", value: formatDate(new Date()), inline: true }
    )
    .setTimestamp();

  try {
    await axios.post(webhookUrl, {
      embeds: [embed.toJSON()],
    });
  } catch (error) {
    console.error("Błąd wysyłania logów do webhooka:", error);
  }
};

const cooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("drop")
    .setDescription("Losuje, czy użytkownik wygrał zniżkę.")
    .setDefaultMemberPermissions(
      PermissionsBitField.Flags.UseApplicationCommands
    ),

  run: async (interaction) => {
    const userId = interaction.user.id;
    const now = Date.now();
    const cooldownAmount = ms("1h");

    if (cooldowns.has(userId)) {
      const expirationTime = cooldowns.get(userId) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = expirationTime - now;
        const timeString = ms(timeLeft, { long: true });
        return interaction.reply({
          content: `Musisz poczekać jeszcze ${timeString} przed użyciem tej komendy ponownie.`,
          ephemeral: true,
        });
      }
    }

    cooldowns.set(userId, now);

    const random = Math.random() * 100;

    const userPing = interaction.user.toString();

    let tytul, opis, kolor;
    let discountCode = null;
    let discountType = null;

    if (random < 4) {
      // 4% szans na wygranie zniżki 5%
      tytul = "`✅` UDAŁO SIĘ!";
      discountCode = generateDiscountCode();
      discountType = "5%";
      opis = `Gratulacje ${userPing}, wygrałeś zniżkę na **5%**!\nTwój kod rabatowy to \`${discountCode}\`.\n\nWażność twojej zniżki kończy się za **2 dni**!`;
      kolor = "#00ff00"; // Zielony kolor dla sukcesu
    } else if (random < 5) {
      // 1% szans na wygranie zniżki 10%
      tytul = "`✅` UDAŁO SIĘ!";
      discountCode = generateDiscountCode();
      discountType = "10%";
      opis = `Gratulacje ${userPing}, wygrałeś zniżkę na **10%**!\nTwój kod rabatowy to \`${discountCode}\`.\n\nWażność twojej zniżki kończy się za **2 dni**!`;
      kolor = "#00ff00"; // Zielony kolor dla sukcesu
    } else {
      // 95% szans na brak wygranej
      tytul = "`❌` NIE TYM RAZEM!";
      opis = `Niestety ${userPing}, ale nic nie wygrałeś!\nSpróbuj ponownie za **1 godzinę**!`;

      const nextTry = DateTime.fromMillis(now + cooldownAmount, {
        zone: "Europe/Warsaw",
      });
      const timeString = nextTry.toLocaleString(DateTime.TIME_SIMPLE);

      opis += `\n\n**Ponownie możesz spróbować o godzinie**: \`${timeString}\``;
      kolor = "#ff0000"; // Czerwony kolor dla porażki
    }

    const embed = new EmbedBuilder()
      .setTitle(tytul)
      .setDescription(opis)
      .setColor(kolor);

    await interaction.reply({ embeds: [embed] });

    if (discountCode) {
      const discounts = loadDiscounts();

      discounts[discountCode] = {
        ownerId: interaction.user.id,
        used: false,
        discountType,
      };

      saveDiscounts(discounts);

      const message = `Dziękujemy za udział! Oto twój kod rabatowy na ${discountType}: \`${discountCode}\``;
      try {
        await interaction.user.send(message);
        console.log(
          `Kod rabatowy ${discountCode} został wysłany do użytkownika ${interaction.user.tag} (${interaction.user.id}).`
        );

        await logToWebhook(discountCode, interaction.user, interaction.user);
      } catch (error) {
        console.error("Błąd wysyłania wiadomości prywatnej:", error);
        await interaction.followUp({
          content:
            "Nie mogę wysłać wiadomości do Ciebie. Sprawdź ustawienia prywatności.",
          ephemeral: true,
        });
      }
    }
  },
};
