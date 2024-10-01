const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const discordTranscripts = require("discord-html-transcripts");

const openTickets = {};
const pendingForms = {};

module.exports = {
  name: "interactionCreate",

  run: async (interaction, client) => {
    // Id roli administratora dla każdej kategorii ticketa
    client.config.ticketRolesByCategory = {
      "💸 Zamówienia": "1214684033569783929",
      "💱 Wymiany": "1285322626528575569",
      "🔰 Współpraca": "1209251610203521094",
      "📞 Support": "1201658993169141870",
    };

    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command(interaction, client);
      } catch (e) {
        console.log(e);
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === "verify") {
        const member = interaction.member;
        const role = await interaction.guild.roles.fetch(
          client.config.verifyRole
        );
        await member.roles.add(role);
        await interaction.reply({
          content: "`✅` Zostałeś zweryfikowany!",
          ephemeral: true,
        });
      } else if (interaction.customId.endsWith("_ticket")) {
        const category = interaction.customId.split("_")[0];

        const existingTicketChannelId = Object.values(openTickets).find(
          (id) => id === interaction.user.id
        );

        if (existingTicketChannelId) {
          await interaction.reply({
            content:
              "`🔓` Masz już otwarty ticket!\nZamknij go przed otwarciem nowego.",
            ephemeral: true,
          });
          return;
        }

        if (category === "💱 Wymiany") {
          const modal = new ModalBuilder()
            .setCustomId("exchange_form")
            .setTitle("Formularz wymiany")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("amount")
                  .setLabel("Ilość (PLN)")
                  .setStyle(TextInputStyle.Short)
                  .setRequired(true)
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("from_item")
                  .setLabel("Z czego")
                  .setStyle(TextInputStyle.Short)
                  .setRequired(true)
              ),
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("to_item")
                  .setLabel("Na co")
                  .setStyle(TextInputStyle.Short)
                  .setRequired(true)
              )
            );

          await interaction.showModal(modal);
          pendingForms[interaction.user.id] = category;
        } else if (category === "📞 Support") {
          const modal = new ModalBuilder()
            .setCustomId("support_form")
            .setTitle("Formularz wsparcia")
            .addComponents(
              new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                  .setCustomId("issue_description")
                  .setLabel("Opisz problem")
                  .setStyle(TextInputStyle.Paragraph)
                  .setRequired(true)
              )
            );

          await interaction.showModal(modal);
          pendingForms[interaction.user.id] = category;
        } else {
          const adminRole = client.config.ticketRolesByCategory[category];

          if (!adminRole) {
            await interaction.reply({
              content: "`⛔` Błąd: Nie znaleziono roli dla tej kategorii.",
              ephemeral: true,
            });
            return;
          }

          const channel = await interaction.guild.channels
            .create({
              name: `${category}-${interaction.user.username}`,
              type: ChannelType.GuildText,
              parent: client.config.ticketCategory,
              permissionOverwrites: [
                {
                  id: interaction.guild.roles.everyone,
                  deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                  id: interaction.user.id,
                  allow: [PermissionFlagsBits.ViewChannel],
                },
                {
                  id: adminRole,
                  allow: [PermissionFlagsBits.ViewChannel],
                },
              ],
            })
            .then((channel) => channel.setTopic(`${interaction.user.id}`));

          openTickets[channel.id] = interaction.user.id;

          await channel.send({
            content: `||@everyone||`,
            embeds: [
              new EmbedBuilder()
                .setTitle("Ticket: " + category)
                .setDescription(
                  "Dziękujemy za otwarcie ticketu! Wkrótce ktoś się z Tobą skontaktuje.\nJeśli masz aktywny kod rabatowy użyj **/use-rabat**"
                )
                .setColor("#0014ff"),
            ],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId("ticketaccept")
                  .setLabel("Przyjmij ticket")
                  .setStyle(1),

                new ButtonBuilder()
                  .setCustomId("ticketclose")
                  .setLabel("Zamknij ticket")
                  .setStyle(4)
              ),
            ],
          });

          await interaction.reply({
            content: "`🔓` Twój ticket został otwarty!",
            ephemeral: true,
          });
        }
      } else if (interaction.customId === "ticketaccept") {
        const admin = interaction.member;
        const ticketChannel = interaction.channel;

        const requiredRole = client.config.ticketRole;
        if (!admin.roles.cache.has(requiredRole)) {
          await interaction.reply({
            content: "`⛔` Nie masz uprawnień do przyjęcia tego ticketu.",
            ephemeral: true,
          });
          return;
        }

        const ticketOwnerId = ticketChannel.topic;
        const ticketOwner = await interaction.guild.members.fetch(
          ticketOwnerId
        );

        await ticketChannel.setTopic(
          `Ticket został przyjęty przez administratora ${admin.user.tag}`
        );

        await ticketChannel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("#0014ff")
              .setDescription(
                `Ticket został przyjęty przez administratora ${admin.user.tag}.`
              ),
          ],
        });

        const updatedRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("ticketclose")
            .setLabel("Zamknij ticket")
            .setStyle(4)
        );

        await interaction.update({ components: [updatedRow] });

        const embed = new EmbedBuilder()
          .setTitle("📌 JESTEŚ WZYWANY")
          .setDescription(
            `Witam <@${ticketOwner.id}>, jesteś wzywany na swojego ticketa!\nCzas na odpowiedź to **4 GODZINY**, w przeciwnym razie ticket zostanie **usunięty**!`
          )
          .setColor("#0014ff")
          .setTimestamp();

        try {
          await ticketOwner.send({ embeds: [embed] });
        } catch (error) {
          console.log(
            `Nie udało się wysłać wiadomości do użytkownika ${ticketOwner.user.tag}`
          );
        }
      } else if (interaction.customId === "ticketclose") {
        if (interaction.channel.parentId !== client.config.ticketCategory)
          return;

        const transcript = await discordTranscripts.createTranscript(
          interaction.channel,
          {
            filename: `${interaction.channel.name}.html`,
            limit: -1,
            saveImages: true,
            poweredBy: false,
          }
        );

        delete openTickets[interaction.channel.id];

        await interaction.channel.delete();

        const logChannel = await interaction.guild.channels.fetch(
          client.config.ticketLog
        );
        await logChannel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle("Ticket został zamknięty")
              .setDescription(
                `Ticket został zamknięty przez <@${interaction.user.id}>. Aby otworzyć transkrypt, pobierz plik i otwórz go **w przeglądarce**.`
              )
              .setColor("#0014ff"),
          ],
          files: [transcript],
        });
      } else if (interaction.customId.startsWith("rr")) {
        const role = await interaction.guild.roles.fetch(
          interaction.customId.split("rr")[1]
        );
        await interaction.member.roles.add(role);
        await interaction.reply({
          content: `Otrzymałeś rolę ${role.name}!`,
          ephemeral: true,
        });
      }
    } else if (interaction.isModalSubmit()) {
      if (interaction.customId === "exchange_form") {
        const amount = interaction.fields.getTextInputValue("amount");
        const fromItem = interaction.fields.getTextInputValue("from_item");
        const toItem = interaction.fields.getTextInputValue("to_item");
        const category = pendingForms[interaction.user.id];

        const adminRole = client.config.ticketRolesByCategory[category];

        const channel = await interaction.guild.channels
          .create({
            name: `${category}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: client.config.ticketCategory,
            permissionOverwrites: [
              {
                id: interaction.guild.roles.everyone,
                deny: [PermissionFlagsBits.ViewChannel],
              },
              {
                id: interaction.user.id,
                allow: [PermissionFlagsBits.ViewChannel],
              },
              {
                id: adminRole,
                allow: [PermissionFlagsBits.ViewChannel],
              },
            ],
          })
          .then((channel) => channel.setTopic(`${interaction.user.id}`));

        openTickets[channel.id] = interaction.user.id;

        await channel.send({
          content: `||@everyone||`,
          embeds: [
            new EmbedBuilder()
              .setTitle("Ticket: " + category)
              .setDescription(
                "Dziękujemy za otwarcie ticketu! Wkrótce ktoś się z Tobą skontaktuje."
              )
              .addFields(
                { name: "Ilość (PLN)", value: amount, inline: true },
                { name: "Z czego", value: fromItem, inline: true },
                { name: "Na co", value: toItem, inline: true }
              )
              .setColor("#0014ff"),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("ticketaccept")
                .setLabel("Przyjmij ticket")
                .setStyle(1),

              new ButtonBuilder()
                .setCustomId("ticketclose")
                .setLabel("Zamknij ticket")
                .setStyle(4)
            ),
          ],
        });

        delete pendingForms[interaction.user.id];

        await interaction.reply({
          content: "`🔓` Twój ticket został otwarty!",
          ephemeral: true,
        });
      } else if (interaction.customId === "support_form") {
        const issueDescription =
          interaction.fields.getTextInputValue("issue_description");
        const category = pendingForms[interaction.user.id];

        const adminRole = client.config.ticketRolesByCategory[category];

        const channel = await interaction.guild.channels
          .create({
            name: `${category}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: client.config.ticketCategory,
            permissionOverwrites: [
              {
                id: interaction.guild.roles.everyone,
                deny: [PermissionFlagsBits.ViewChannel],
              },
              {
                id: interaction.user.id,
                allow: [PermissionFlagsBits.ViewChannel],
              },
              {
                id: adminRole,
                allow: [PermissionFlagsBits.ViewChannel],
              },
            ],
          })
          .then((channel) => channel.setTopic(`${interaction.user.id}`));

        openTickets[channel.id] = interaction.user.id;

        await channel.send({
          content: `||@everyone||`,
          embeds: [
            new EmbedBuilder()
              .setTitle("Ticket: " + category)
              .setDescription(
                "Dziękujemy za otwarcie ticketu! Wkrótce ktoś się z Tobą skontaktuje."
              )
              .addFields({ name: "Opis problemu", value: issueDescription })
              .setColor("#0014ff"),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("ticketaccept")
                .setLabel("Przyjmij ticket")
                .setStyle(1),

              new ButtonBuilder()
                .setCustomId("ticketclose")
                .setLabel("Zamknij ticket")
                .setStyle(4)
            ),
          ],
        });

        delete pendingForms[interaction.user.id];

        await interaction.reply({
          content: "`🔓` Twój ticket został otwarty!",
          ephemeral: true,
        });
      }
    }
  },
};
