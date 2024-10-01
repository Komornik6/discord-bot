const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "guildMemberAdd",

  run: async (member, client) => {
    client.newest = member;
    client.config.autoRole.forEach(async (role) => {
      const rolex = await member.guild.roles.fetch(role);
      if (!rolex) return;
      await member.roles.add(rolex);
    });

    const welcomeChannelId = "Id kanału powitań"; // Zastąp prawdziwym ID kanału powitań.
    const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);

    if (!welcomeChannel) {
      console.error(
        `Kanał powitań o ID ${welcomeChannelId} nie został znaleziony.`
      );
      return;
    }

    const invites = await member.guild.invites.fetch();
    const inviteUsed = invites.find((inv) => inv.uses > inv.maxUses);

    const inviter = inviteUsed ? inviteUsed.inviter : null;
    const inviterTag = inviter ? inviter.tag : "Nieznany";
    const inviterId = inviter ? inviter.id : null;

    const inviterMember = inviterId
      ? await member.guild.members.fetch(inviterId)
      : null;
    const userInvites = invites.filter(
      (inv) => inv.inviter && inv.inviter.id === inviterId
    );
    const inviteCount = userInvites.reduce((acc, inv) => acc + inv.uses, 0);

    const embed = new EmbedBuilder()
      .setTitle(`**Witaj!**`)
      .setDescription(
        `Dziękujemy ${member} za dołączenie na nasz serwer **Crystal Sh0p**.\n` +
          `Jesteś **${member.guild.memberCount}** osobą na naszym Discordzie!`
      )
      .setColor("#0014ff") // Kolor embeda
      .setThumbnail(member.user.displayAvatarURL());

    await welcomeChannel.send({ embeds: [embed] });
  },
};
