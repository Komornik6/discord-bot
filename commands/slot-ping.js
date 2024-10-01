const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const SLOTS_FILE = path.resolve(__dirname, "slots.json");

const loadSlotData = () => {
  if (!fs.existsSync(SLOTS_FILE)) {
    return [];
  }
  const rawData = fs.readFileSync(SLOTS_FILE, "utf8");
  return JSON.parse(rawData);
};

const saveSlotData = (data) => {
  fs.writeFileSync(SLOTS_FILE, JSON.stringify(data, null, 2));
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("slot-ping")
    .setDescription("Użyj jednego z dostępnych pingów w swoim kanale."),

  run: async (interaction) => {
    const channelId = interaction.channel.id;
    const userId = interaction.user.id;

    const slots = loadSlotData();
    const slot = slots.find(
      (entry) => entry.channelId === channelId && entry.ownerId === userId
    );

    if (!slot) {
      return interaction.reply({
        content:
          "Nie jesteś właścicielem tego kanału lub nie masz dostępnych pingów.",
        ephemeral: true,
      });
    }

    if (slot.remainingPings <= 0) {
      return interaction.reply({
        content: "Wykorzystałeś wszystkie swoje pingi.",
        ephemeral: true,
      });
    }
    slot.remainingPings--;
    saveSlotData(slots);

    await interaction.channel.send(
      `Wysłano ping @everyone. Pozostałe pingi: ${slot.remainingPings}`
    );

    interaction.reply({ content: "Użyłeś pinga.", ephemeral: true });
  },
};
