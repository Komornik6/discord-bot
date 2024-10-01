const {
  SlashCommandBuilder,
  PermissionsBitField,
  ChannelType,
  EmbedBuilder,
} = require("discord.js");
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
    .setName("dodaj-pingi")
    .setDescription("Dodaje pingów do użytkownika w slocie.")
    .addUserOption((option) =>
      option
        .setName("użytkownik")
        .setDescription("Użytkownik, do którego chcesz dodać ping.")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("ilość_pingów")
        .setDescription("Liczba pingów, którą chcesz dodać.")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels),

  run: async (interaction) => {
    const user = interaction.options.getUser("użytkownik");
    const pingCount = interaction.options.getInteger("ilość_pingów");
    const guild = interaction.guild;

    try {
      const slotData = loadSlotData();
      const slot = slotData.find((entry) => entry.ownerId === user.id);

      if (!slot) {
        return interaction.reply({
          content: "Nie znaleziono slota dla tego użytkownika.",
          ephemeral: true,
        });
      }

      slot.remainingPings += pingCount;
      saveSlotData(slotData);

      await interaction.reply({
        content: `Dodano ${pingCount} pingów dla ${user.tag}.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Błąd podczas dodawania pingów:", error);
      interaction.reply({
        content: "Wystąpił błąd podczas dodawania pingów.",
        ephemeral: true,
      });
    }
  },
};
