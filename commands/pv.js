const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  PermissionsBitField,
} = require("discord.js");
const fs = require("fs");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pv")
    .setDescription("Wyślij wiadomość prywatną do użytkownika.")
    .addUserOption((option) =>
      option
        .setName("nick")
        .setDescription("Nick użytkownika, do którego chcesz wysłać wiadomość.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("wiadomość")
        .setDescription("Treść wiadomości.")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  run: async (interaction) => {
    const targetUser = interaction.options.getUser("nick");
    const messageContent = interaction.options.getString("wiadomość");
    const timestamp = new Date().toISOString();

    try {
      await targetUser.send(messageContent);
      await interaction.reply({
        content: `Wiadomość została wysłana do <@${targetUser.id}>.`,
        ephemeral: true,
      });

      console.log(
        `[${timestamp}] Użytkownik ${interaction.user.tag} (${interaction.user.id}) wysłał wiadomość do ${targetUser.tag} (${targetUser.id}):`
      );
      console.log(`Treść wiadomości: "${messageContent}"`);
      console.log("---");

      const webhookURL = "";
      const embed = new EmbedBuilder()
        .setTitle("Nowa Wiadomość Prywatna")
        .setColor("#0014ff")
        .addFields(
          { name: "Wysłano do", value: `<@${targetUser.id}>`, inline: true },
          { name: "Wiadomość", value: messageContent, inline: true },
          {
            name: "Wysłane przez",
            value: `<@${interaction.user.id}>`,
            inline: true,
          },
          { name: "Czas", value: new Date().toISOString(), inline: true }
        )
        .setTimestamp();

      await axios.post(webhookURL, {
        embeds: [embed.toJSON()],
      });
    } catch (error) {
      console.error(
        `[${timestamp}] Nie udało się wysłać wiadomości do użytkownika ${targetUser.tag} (${targetUser.id}). Błąd: ${error.message}`
      );
      await interaction.reply({
        content:
          "Nie udało się wysłać wiadomości. Użytkownik może mieć wyłączone wiadomości prywatne.",
        ephemeral: true,
      });

      const webhookURL = "";
      const errorEmbed = new EmbedBuilder()
        .setTitle("Błąd Wysyłania Wiadomości Prywatnej")
        .setColor("#0014ff")
        .setDescription(
          `Nie udało się wysłać wiadomości do użytkownika <@${targetUser.id}>.`
        )
        .addFields(
          { name: "Błąd", value: error.message },
          { name: "Wysłane przez", value: `<@${interaction.user.id}>` },
          { name: "Czas", value: new Date().toISOString() }
        )
        .setTimestamp();

      await axios.post(webhookURL, {
        embeds: [errorEmbed.toJSON()],
      });
    }
  },
};
