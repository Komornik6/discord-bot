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
    .setName("klient")
    .setDescription("Nadaje określoną rangę użytkownikowi.")
    .addUserOption((option) =>
      option
        .setName("nick")
        .setDescription("Użytkownik, któremu chcesz nadać rangę.")
        .setRequired(true)
    ),
  // .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  run: async (interaction, client) => {
    const user = interaction.options.getMember("nick");
    const commandUser = interaction.user;

    const roleIDToGive = "1201659035959689246"; // Zastąp prawdziwym ID roli, którą chcesz nadać
    const requiredRoleID = "1238120538292097024"; // Zastąp prawdziwym ID roli wymaganej do użycia komendy

    const roleToGive = interaction.guild.roles.cache.get(roleIDToGive);
    const requiredRole = interaction.guild.roles.cache.get(requiredRoleID);

    if (!user) {
      return interaction.reply({
        content: "Nie znaleziono użytkownika.",
        ephemeral: true,
      });
    }

    if (!roleToGive) {
      return interaction.reply({
        content: "Nie znaleziono rangi do nadania.",
        ephemeral: true,
      });
    }

    if (!interaction.member.roles.cache.has(requiredRoleID)) {
      return interaction.reply({
        content: `Nie masz uprawnień do użycia tej komendy. Musisz posiadać rangę ${requiredRole.name}.`,
        ephemeral: true,
      });
    }

    try {
      await user.roles.add(roleToGive);
      interaction.reply({
        content: `Nadano rangę "${roleToGive.name}" użytkownikowi ${user.user.tag}.`,
        ephemeral: true,
      });

      console.log(
        `Komenda użyta przez: ${commandUser.tag} | Użytkownik: ${
          user.user.tag
        } | Ranga: ${roleToGive.name} | Czas: ${new Date().toISOString()}`
      );

      const webhookURL = "";
      const embed = new EmbedBuilder()
        .setTitle("Nadano Nową Rangę")
        .setColor("#0014ff")
        .addFields(
          { name: "Użyta przez", value: commandUser.tag, inline: true },
          { name: "Użytkownik", value: user.user.tag, inline: true },
          { name: "Ranga", value: roleToGive.name, inline: true },
          { name: "Czas", value: new Date().toISOString(), inline: true }
        )
        .setTimestamp();

      await axios.post(webhookURL, {
        embeds: [embed.toJSON()],
      });
    } catch (error) {
      console.error(error);
      interaction.reply({
        content: "Wystąpił błąd podczas nadawania rangi.",
        ephemeral: true,
      });
    }
  },
};
