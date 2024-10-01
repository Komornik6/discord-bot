const { SlashCommandBuilder } = require("@discordjs/builders");
const fs = require("fs");

const discountFilePath = "./discounts.json";

const loadDiscounts = () => {
  if (fs.existsSync(discountFilePath)) {
    return JSON.parse(fs.readFileSync(discountFilePath));
  }
  return {};
};

const saveDiscounts = (discounts) => {
  fs.writeFileSync(discountFilePath, JSON.stringify(discounts, null, 2));
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

const discountCodeRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("use-rabat")
    .setDescription("Używa kodu rabatowego.")
    .addStringOption((option) =>
      option
        .setName("kod")
        .setDescription("Kod rabatowy do wykorzystania.")
        .setRequired(true)
    ),

  run: async (interaction) => {
    const discountCode = interaction.options.getString("kod");
    const discounts = loadDiscounts();
    const user = interaction.user;

    if (!discountCodeRegex.test(discountCode)) {
      await interaction.reply({
        content:
          'Kod rabatowy ma nieprawidłowy format. Prawidłowy format to "XXXX-XXXX-XXXX-XXXX".',
        ephemeral: true,
      });
      return;
    }

    if (discounts[discountCode]) {
      if (discounts[discountCode].ownerId !== user.id) {
        await interaction.reply({
          content: "Nie możesz użyć kodu, który nie należy do Ciebie.",
          ephemeral: true,
        });

        await interaction.channel.send(
          `<@${user.id}> próbował użyć kodu \`${discountCode}\`, ale nie jest jego właścicielem.`
        );
        return;
      }

      if (discounts[discountCode].used) {
        await interaction.reply({
          content: "Ten kod rabatowy został już użyty.",
          ephemeral: true,
        });

        await interaction.channel.send(
          `<@${user.id}> próbował użyć kodu \`${discountCode}\`, ale kod został już użyty.`
        );
      } else {
        discounts[discountCode].used = true;
        discounts[discountCode].usedAt = new Date().toISOString();
        saveDiscounts(discounts);

        await interaction.reply({
          content: `Kod rabatowy \`${discountCode}\` został pomyślnie użyty.`,
          ephemeral: true,
        });

        await interaction.channel.send(
          `<@${user.id}> pomyślnie użył kodu rabatowego \`${discountCode}\`.`
        );
      }
    } else {
      await interaction.reply({
        content: "Nieprawidłowy kod rabatowy.",
        ephemeral: true,
      });

      await interaction.channel.send(
        `<@${user.id}> próbował użyć kodu \`${discountCode}\`, ale kod jest nieprawidłowy.`
      );
    }
  },
};
