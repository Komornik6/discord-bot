const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  PermissionsBitField,
} = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Usuwa określoną liczbę wiadomości z kanału.")
    .addIntegerOption((option) =>
      option
        .setName("liczba")
        .setDescription("Liczba wiadomości do usunięcia.")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels),

  run: async (interaction) => {
    const number = interaction.options.getInteger("liczba");
    const channel = interaction.channel;

    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ManageMessages
      )
    ) {
      return await interaction.reply({
        content: "Nie masz wystarczających uprawnień do użycia tej komendy.",
        ephemeral: true,
      });
    }

    if (isNaN(number) || number < 1 || number > 100) {
      return await interaction.reply({
        content:
          "Liczba wiadomości do usunięcia musi być liczbą całkowitą w zakresie od 1 do 100.",
        ephemeral: true,
      });
    }

    try {
      await channel.bulkDelete(number, true);
      await interaction.reply({
        content: `Pomyślnie usunięto ${number} wiadomości.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Błąd podczas usuwania wiadomości:", error);
      await interaction.reply({
        content: "Wystąpił błąd podczas usuwania wiadomości.",
        ephemeral: true,
      });
    }
  },
};
