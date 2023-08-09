import '@total-typescript/ts-reset';
import {
  ActionRowBuilder,
  Client,
  Colors,
  EmbedBuilder,
  GatewayIntentBits,
  type MessageActionRowComponentBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  type Message,
  type TextChannel,
  type Guild,
  ButtonBuilder,
  ButtonStyle,
  type StringSelectMenuInteraction,
  type ButtonInteraction,
  type GuildMember,
} from 'discord.js';
import * as discordTranscripts from 'discord-html-transcripts';
import { env } from './env/env';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

const embed = new EmbedBuilder()
  .setTitle('WiseScript Development Support')
  .setDescription('Select a ticket type below to get started')
  .setColor(Colors.Red)
  .setFooter({
    text: 'WiseScript Development',
  })
  .setTimestamp()
  .setImage(env.THUMBNAIL_ICON);

const selectMenu = new StringSelectMenuBuilder()
  .setCustomId('ticket-type')
  .setPlaceholder('Select a ticket type')
  .addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel('General Support')
      .setDescription('Get help with anything')
      .setValue('general')
      .setEmoji({ name: '🔧' }),
    new StringSelectMenuOptionBuilder()
      .setLabel('Bug Report')
      .setDescription('Report a bug')
      .setValue('bug')
      .setEmoji({ name: '🐞' }),
  );

const sendMessage = async (channel: TextChannel) => {
  try {
    await channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(
          selectMenu,
        ) as ActionRowBuilder<MessageActionRowComponentBuilder>,
      ],
    });

    console.log('Message sent');
  } catch (err) {
    console.log('Error sending message');
    console.error(err);
  }
};

const updateMessage = async (message: Message) => {
  try {
    await message.edit({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(
          selectMenu,
        ) as ActionRowBuilder<MessageActionRowComponentBuilder>,
      ],
    });

    console.log('Message updated');
  } catch (err) {
    console.log('Error updating message');
    console.error(err);
  }
};

client.on('ready', async () => {
  const channel = client.channels.cache.get(env.CHANNEL_ID) as TextChannel;
  const messages = await channel.messages.fetch();
  const message = messages.get(env.MESSAGE_ID);

  if (!message) {
    await sendMessage(channel);
    return;
  }

  await updateMessage(message);
});

const interactionSelectMenu = async (
  interaction: StringSelectMenuInteraction,
) => {
  const guild = client.guilds.cache.get(env.GUILD_ID) as Guild;
  const channels = await guild.channels.fetch();

  const channelExists = channels.find(
    channel =>
      channel?.name ===
      `${interaction.user.username}-${interaction.values[0] as string}`,
  );

  if (channelExists) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('WiseScript Development Support')
          .setDescription(`You already have a ticket in <#${channelExists.id}>`)
          .setColor(Colors.Green)
          .setFooter({
            text: 'WiseScript Development',
            iconURL: env.GUILD_ICON,
          }),
      ],
      ephemeral: true,
    });
    return;
  }

  const channel = await guild.channels.create({
    name: `${interaction.user.username}-${interaction.values[0] as string}`,
    parent: env.CATEGORY_ID,
    permissionOverwrites: [
      {
        id: interaction.user.id,
        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
      },
      { id: guild.roles.everyone.id, deny: ['ViewChannel'] },
      {
        id: env.ADMIN_ID,
        allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
      },
    ],
  });

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle('WiseScript Development Support')
        .setDescription(`Your ticket has been created in <#${channel.id}>`)
        .setColor(Colors.Green)
        .setFooter({
          text: 'WiseScript Development',
          iconURL: env.GUILD_ICON,
        }),
    ],
    ephemeral: true,
  });

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle('WiseScript Development Support')
        .setDescription(`Hi <@${interaction.user.id}>, how can we help you?`)
        .setColor(Colors.Red)
        .setFooter({
          text: 'WiseScript Development',
          iconURL: env.GUILD_ICON,
        })
        .setTimestamp(),
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close')
          .setLabel('Close ticket ❌')
          .setStyle(ButtonStyle.Secondary),
      ) as ActionRowBuilder<MessageActionRowComponentBuilder>,
    ],
  });
};

const interactionButton = async (interaction: ButtonInteraction) => {
  const channel = interaction.channel as TextChannel;
  const guild = interaction.guild as Guild;
  const user = guild.members.cache.find(
    member => member.user.username === channel.name.split('-')[0],
  ) as GuildMember;

  if (interaction.customId === 'close') {
    await channel.permissionOverwrites.delete(user);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('WiseScript Development Support')
          .setDescription(`Ticket closed by <@${interaction.user.id}>`)
          .setColor(Colors.Red)
          .setFooter({
            text: 'WiseScript Development',
            iconURL: env.GUILD_ICON,
          })
          .setTimestamp(),
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('reopen')
            .setLabel('Reopen ticket 🔓')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('archive')
            .setLabel('Archive ticket 🗑')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('transcript')
            .setLabel('Generate Transcript 📜')
            .setStyle(ButtonStyle.Secondary),
        ) as ActionRowBuilder<MessageActionRowComponentBuilder>,
      ],
    });
  }

  if (interaction.customId === 'archive') {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('WiseScript Development Support')
          .setDescription(`Ticket archived by <@${interaction.user.id}>`)
          .setColor(Colors.Red)
          .setFooter({
            text: 'WiseScript Development',
            iconURL: env.GUILD_ICON,
          })
          .setTimestamp(),
      ],
    });

    await new Promise(resolve => setTimeout(resolve, 5000));
    await channel.delete();
  }

  if (interaction.customId === 'transcript') {
    const attachment = await discordTranscripts.createTranscript(channel);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('WiseScript Development Support')
          .setDescription(`Transcript generated by <@${interaction.user.id}>`)
          .setColor(Colors.Red)
          .setFooter({
            text: 'WiseScript Development',
            iconURL: env.GUILD_ICON,
          })
          .setTimestamp(),
      ],
      files: [attachment],
    });
  }

  if (interaction.customId === 'reopen') {
    await channel.permissionOverwrites.edit(user, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    });

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('WiseScript Development Support')
          .setDescription(`Ticket reopened by <@${interaction.user.id}>`)
          .setColor(Colors.Red)
          .setFooter({
            text: 'WiseScript Development',
            iconURL: env.GUILD_ICON,
          })
          .setTimestamp(),
      ],
    });
  }
};

client.on('interactionCreate', async interaction => {
  if (interaction.isButton()) return interactionButton(interaction);

  if (interaction.isStringSelectMenu())
    return interactionSelectMenu(interaction);
});

void client.login(env.TOKEN);
