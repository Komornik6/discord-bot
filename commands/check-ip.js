const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("check-ip")
    .setDescription("Sprawdza informacje o podanym adresie IP.")
    .addStringOption((option) =>
      option
        .setName("ip")
        .setDescription("Adres IP do sprawdzenia")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  run: async (interaction) => {
    const ip = interaction.options.getString("ip");

    try {
      const response = await axios.get(`https://ipapi.co/${ip}/json/`);
      const data = response.data;

      if (data.error) {
        throw new Error(data.reason || "Nieprawidłowy adres IP.");
      }

      const embed = new EmbedBuilder()
        .setTitle(`Informacje o IP: ${data.ip}`)
        .setColor("#0014ff")
        .addFields(
          { name: "ISP", value: data.org || "Brak danych", inline: true },
          {
            name: "Lokalizacja",
            value: `${data.city}, ${data.region}, ${data.country_name}`,
            inline: true,
          },
          {
            name: "Strefa czasowa",
            value: data.timezone || "Brak danych",
            inline: true,
          },
          {
            name: "Kod pocztowy",
            value: data.postal || "Brak danych",
            inline: true,
          },
          {
            name: "Szerokość geograficzna",
            value: data.latitude ? data.latitude.toString() : "Brak danych",
            inline: true,
          },
          {
            name: "Długość geograficzna",
            value: data.longitude ? data.longitude.toString() : "Brak danych",
            inline: true,
          }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Błąd podczas pobierania danych o IP:", error);
      await interaction.reply({
        content:
          "Wystąpił błąd podczas pobierania informacji o podanym adresie IP. Sprawdź, czy adres IP jest poprawny.",
        ephemeral: true,
      });
    }
  },
};
