const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Tworzy niestandardowy embed.")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("Tytuł embeda. (opcjonalne)")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription(
          "Opis embeda. Możesz użyć \\n, aby dodać nową linię. (opcjonalne)"
        )
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("color")
        .setDescription("Kolor embeda w formacie HEX lub RANDOM. (opcjonalne)")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  run: async (interaction, client) => {
    try {
      const title =
        interaction.options.getString("title") || "Niestandardowy Embed";
      const description = interaction.options.getString("description") || null;
      const color = interaction.options.getString("color") || null;
      const embed = new EmbedBuilder().setTitle(title);

      if (description) {
        embed.setDescription(description);
      }

      if (color && color.toUpperCase() !== "RANDOM") {
        embed.setColor(color);
      } else {
        embed.setColor(Math.floor(Math.random() * 16777215).toString(16));
      }

      const channel = interaction.channel;
      await channel.send({ embeds: [embed] });

      await interaction.reply({
        content: "Embed został pomyślnie wysłany!",
        ephemeral: true,
      });
    } catch (error) {
      console.error("Wystąpił błąd:", error);
      await interaction.reply({
        content: "Wystąpił błąd podczas wysyłania embeda.",
        ephemeral: true,
      });
    }
  },
};
