const {
  SlashCommandBuilder,
  PermissionsBitField,
  EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const SLOTS_FILE = path.resolve(__dirname, "slots.json");

const saveSlotData = (data) => {
  fs.writeFileSync(SLOTS_FILE, JSON.stringify(data, null, 2));
};

const loadSlotData = () => {
  if (!fs.existsSync(SLOTS_FILE)) {
    return [];
  }
  const rawData = fs.readFileSync(SLOTS_FILE, "utf8");
  return JSON.parse(rawData);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("zmien-wlasciciela")
    .setDescription("Zmień właściciela istniejącego slota.")
    .addChannelOption((option) =>
      option
        .setName("kanal")
        .setDescription("Kanał, którego właściciela chcesz zmienić.")
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName("nowy_wlasciciel")
        .setDescription("Nowy właściciel kanału.")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels),

  run: async (interaction) => {
    const channel = interaction.options.getChannel("kanal");
    const newOwner = interaction.options.getUser("nowy_wlasciciel");
    const slotData = loadSlotData();
    const slot = slotData.find((entry) => entry.channelId === channel.id);

    if (!slot) {
      return interaction.reply({
        content: "Nie znaleziono tego kanału w danych o slotach.",
        ephemeral: true,
      });
    }

    try {
      await channel.permissionOverwrites.edit(newOwner.id, {
        ViewChannel: true,
        SendMessages: true,
      });

      await channel.permissionOverwrites.delete(slot.ownerId);

      slot.ownerId = newOwner.id;
      saveSlotData(slotData);

      const embed = new EmbedBuilder()
        .setTitle("Zmiana właściciela slota")
        .setColor("#0014ff")
        .setDescription(`Właściciel kanału został zmieniony.`)
        .addFields(
          { name: "Kanał", value: `<#${channel.id}>`, inline: true },
          { name: "Nowy właściciel", value: `<@${newOwner.id}>`, inline: true }
        )
        .setTimestamp();

      await channel.send({ embeds: [embed] });

      await interaction.reply({
        content: `Właściciel kanału <#${channel.id}> został zmieniony na ${newOwner}.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Błąd podczas zmiany właściciela kanału:", error);
      interaction.reply({
        content: "Wystąpił błąd podczas zmiany właściciela kanału.",
        ephemeral: true,
      });
    }
  },
};
