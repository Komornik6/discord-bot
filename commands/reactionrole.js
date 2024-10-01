const { SlashCommandBuilder } = require("discord.js");
const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder } = require("discord.js");

module.exports = {

    data: new SlashCommandBuilder()
        .setName("reactionrole")
        .setDescription("Tworzy panel reakcji")
        .addChannelOption(option => option
            .setName("kanał")
            .setDescription("Kanał, na którym ma zostać utworzony panel")
            .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    run: async (interaction, client) => {

        const channel = interaction.options.getChannel("kanał");
        const rrdata = client.config.reactionRole;

        rrdata.forEach(async (rr) => {

            const row = new ActionRowBuilder()
            rr.roles.forEach(role => {
                row.addComponents(new ButtonBuilder()
                    .setCustomId('rr'+role.id)
                    .setLabel(role.button)
                    .setStyle(Math.floor(Math.random() * 3) + 1)
                )
            })

            await channel.send({ embeds: [new EmbedBuilder()
                .setDescription(rr.content)
                .setColor(0x2f3136)
                .setFooter({ text: 'Wybierz rolę, którą chcesz dostać!' })], components: [row] })

        });

    }

}