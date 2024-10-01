const { SlashCommandBuilder } = require("@discordjs/builders");
const { PermissionsBitField } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nuke")
    .setDescription("Usuwa wybrany kanał i tworzy go ponownie.")
    .addChannelOption((option) =>
      option
        .setName("kanał")
        .setDescription("Kanał, który chcesz zresetować.")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels),

  run: async (interaction) => {
    const channel = interaction.options.getChannel("kanał");

    if (!channel) {
      return interaction.reply({
        content: "Nie mogę znaleźć tego kanału.",
        ephemeral: true,
      });
    }

    const channelName = channel.name;
    const channelPosition = channel.position;
    const channelParent = channel.parent;
    const channelTopic = channel.topic;
    const channelNSFW = channel.nsfw;
    const channelRateLimit = channel.rateLimitPerUser;
    const channelPermissions = channel.permissionOverwrites.cache.map(
      (permission) => ({
        id: permission.id,
        allow: permission.allow.bitfield,
        deny: permission.deny.bitfield,
      })
    );

    try {
      await interaction.reply({
        content: `Kanał ${channelName} jest resetowany...`,
        ephemeral: true,
      });

      await channel.delete();

      const newChannel = await interaction.guild.channels.create({
        name: channelName,
        type: channel.type,
        parent: channelParent,
        position: channelPosition,
        topic: channelTopic,
        nsfw: channelNSFW,
        rateLimitPerUser: channelRateLimit,
        permissionOverwrites: channelPermissions,
      });

      await newChannel.send(`Channel Nuked by \`${interaction.user.tag}\``);
    } catch (error) {
      console.error("Błąd przy nukowaniu kanału:", error);
    }
  },
};
