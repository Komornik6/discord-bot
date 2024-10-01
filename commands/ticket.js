const { SlashCommandBuilder } = require("@discordjs/builders");
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  PermissionsBitField,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Tworzy panel do ticketów.")
    .addChannelOption((o) =>
      o
        .setName("kanał")
        .setDescription(
          "Kanał, na którym będą wysyłane wiadomości o ticketach."
        )
        .setRequired(true)
    )
    .addStringOption((o) =>
      o
        .setName("wiadomość")
        .setDescription("Wiadomość, która będzie użyta w embedzie.")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  run: async (interaction, client) => {
    const channel = interaction.options.getChannel("kanał");
    const message = interaction.options.getString("wiadomość");
    const categories = client.config.ticketCategories;

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("Ticket | Crystal Sh0p `🔮`")
          .setDescription(
            `
            **Zamówienia** - *Miejsce, w którym możesz złożyć zamówienie w naszym sklepie.*
            **Wymiany** - *Usługa umożliwiająca wymianę walut.*
            **Współprace** - *Przedstaw nam swoją propozycję współpracy lub partnerstwa.*
            **Support** - *Dział, w którym uzyskasz pomoc we wszystkich pozostałych sprawach.*
            
            *Jeśli utworzysz zgłoszenie w niewłaściwej kategorii, zostanie ono zamknięte.*
            Aby skontaktować się z zespołem administracyjnym serwera, proszę wybrać odpowiednią kategorię z poniższej listy 🔰
            `
          )
          .setColor("#0014ff"),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(categories[0] + "_ticket")
            .setLabel(categories[0])
            .setStyle(2),
          new ButtonBuilder()
            .setCustomId(categories[1] + "_ticket")
            .setLabel(categories[1])
            .setStyle(2),
          new ButtonBuilder()
            .setCustomId(categories[2] + "_ticket")
            .setLabel(categories[2])
            .setStyle(2),
          new ButtonBuilder()
            .setCustomId(categories[3] + "_ticket")
            .setLabel(categories[3])
            .setStyle(2)
        ),
      ],
    });

    await interaction.reply({
      content: "Panel ticketów został ustawiony!",
      ephemeral: true,
    });
  },
};
