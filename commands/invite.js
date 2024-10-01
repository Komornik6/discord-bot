const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs").promises;
const filePath = "./invites.json";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("invite")
    .setDescription(
      "Wyświetla informacje o liczbie osób zaproszonych przez danego użytkownika."
    )
    .addUserOption((option) =>
      option
        .setName("uzytkownik")
        .setDescription("Użytkownik, którego zaproszenia chcesz sprawdzić.")
        .setRequired(true)
    ),

  run: async (interaction) => {
    const targetUser = interaction.options.getUser("uzytkownik");

    try {
      const invites = await interaction.guild.invites.fetch();

      const userInvites = invites.filter(
        (invite) =>
          invite.inviter &&
          invite.inviter.id === targetUser.id &&
          !invite.inviter.bot
      );

      const totalUses = userInvites.reduce(
        (acc, invite) => acc + invite.uses,
        0
      );

      let inviteData = {};
      try {
        const data = await fs.readFile(filePath, "utf8");
        inviteData = JSON.parse(data);
      } catch (err) {
        if (err.code !== "ENOENT") throw err;
      }

      inviteData[targetUser.id] = {
        totalUses: totalUses,
        lastUpdated: new Date().toISOString(),
      };
      await fs.writeFile(filePath, JSON.stringify(inviteData, null, 2));

      const embed = new EmbedBuilder()
        .setColor("#0014ff")
        .setTitle(`Zaproszenia użytkownika ${targetUser.tag}`)
        .setDescription(`✅ **Liczba zaproszonych osób**: ${totalUses}`)
        .setFooter({
          text: `Dane ostatnio odświeżone: ${new Date().toLocaleString(
            "pl-PL"
          )}`,
        });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Wystąpił błąd:", error);
      await interaction.reply({
        content: "Wystąpił błąd podczas przetwarzania zaproszeń.",
        ephemeral: true,
      });
    }
  },
};
