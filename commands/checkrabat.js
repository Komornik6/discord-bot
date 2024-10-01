const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");

const discountFilePath = "./discounts.json";

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

const saveDiscounts = (discounts) => {
  try {
    fs.writeFileSync(discountFilePath, JSON.stringify(discounts, null, 2));
  } catch (error) {
    console.error("Błąd zapisu pliku rabatów:", error);
  }
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

module.exports = {
  data: new SlashCommandBuilder()
    .setName("checkrabat")
    .setDescription("Sprawdza, czy użytkownik ma aktywny rabat.")
    .addUserOption((option) =>
      option
        .setName("nick")
        .setDescription("Użytkownik, którego rabat chcesz sprawdzić.")
        .setRequired(true)
    ),

  run: async (interaction) => {
    const user = interaction.options.getUser("nick");
    const discounts = loadDiscounts();

    const userDiscounts = Object.keys(discounts).filter(
      (code) => discounts[code].ownerId === user.id
    );

    if (userDiscounts.length > 0) {
      const activeDiscounts = userDiscounts.filter(
        (code) => !discounts[code].used
      );
      const usedDiscounts = userDiscounts.filter(
        (code) => discounts[code].used
      );

      let response = `Użytkownik **${user.tag}** posiada następujące kody rabatowe:\n\n`;

      if (activeDiscounts.length > 0) {
        response += `**Aktywne kody rabatowe:**\n`;
        activeDiscounts.forEach((code) => {
          response += `- \`${code}\`\n`;
        });
      } else {
        response += `**Brak aktywnych kodów rabatowych.**\n`;
      }

      if (usedDiscounts.length > 0) {
        response += `\n**Użyte kody rabatowe:**\n`;
        usedDiscounts.forEach((code) => {
          response += `- \`${code}\` (użyto: ${formatDate(
            discounts[code].usedAt
          )})\n`;
        });
      } else {
        response += `\n**Brak użytych kodów rabatowych.**\n`;
      }

      await interaction.reply({ content: response, ephemeral: true });
    } else {
      await interaction.reply({
        content: `Użytkownik **${user.tag}** nie ma żadnych kodów rabatowych.`,
        ephemeral: true,
      });
    }
  },
};
