// ============================================================
// Comando /sorteo - Sistema Profesional de Giveaways
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

// Almacén en memoria de sorteos activos (messageId -> GiveawayData)
const activeGiveaways = new Map();

function parseDuration(str) {
  const match = (str || '').trim().match(/^(\d+)([smhd])$/i);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case 's': return num * 1000;
    case 'm': return num * 60 * 1000;
    case 'h': return num * 60 * 60 * 1000;
    case 'd': return num * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sorteo')
    .setDescription('Crea un sorteo oficial con cuenta atrás y botón interactivo')
    .addStringOption(opt =>
      opt.setName('premio')
        .setDescription('¿Qué estás sorteando? (ej: Rango VIP Minecraft / Capa / Nitro)')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('duracion')
        .setDescription('Duración del sorteo (ej: 30s, 5m, 2h, 1d)')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('ganadores')
        .setDescription('Número de ganadores (por defecto 1)')
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Permiso Denegado',
            description: '> No posees la facultad (`Gestionar Servidor`) para crear sorteos oficiales.'
          })
        ],
        ephemeral: true
      });
    }

    const prize = interaction.options.getString('premio');
    const durationStr = interaction.options.getString('duracion');
    const winnerCount = interaction.options.getInteger('ganadores') || 1;

    const ms = parseDuration(durationStr);
    if (!ms || ms < 5000 || ms > 7 * 24 * 60 * 60 * 1000) {
      return await interaction.reply({
        content: '❌ Duración no válida. Usa un formato como `30s`, `5m`, `2h` o `1d` (entre 5 segundos y 7 días).',
        ephemeral: true
      });
    }

    const endTime = Math.floor((Date.now() + ms) / 1000);

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.GOLD,
      title: '🎉 ¡NUEVO SORTEO OFICIAL!',
      description:
        `# **${prize}**\n\n` +
        `> Pulsa el botón inferior para participar. ¡El ganador se anunciará automáticamente!\n\n` +
        `${SYMBOLS.ARROW} **Premio:** \`${prize}\`\n` +
        `${SYMBOLS.ARROW} **Ganadores:** \`${winnerCount}\`\n` +
        `${SYMBOLS.ARROW} **Organizado por:** ${interaction.user}\n` +
        `${SYMBOLS.ARROW} **Finaliza:** <t:${endTime}:R> (<t:${endTime}:f>)\n` +
        `${SYMBOLS.ARROW} **Participantes:** \`0\``,
      footerText: 'Nebula Giveaways • Sistema de Sorteos Oficial'
    });

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_giveaway_join')
        .setLabel('Participar (0)')
        .setEmoji('🎉')
        .setStyle(ButtonStyle.Success)
    );

    const message = await interaction.reply({
      embeds: [embed],
      components: [buttonRow],
      fetchReply: true
    });

    const giveawayData = {
      messageId: message.id,
      channelId: message.channelId,
      guildId: message.guildId,
      prize,
      winnerCount,
      endTime,
      hostId: interaction.user.id,
      participants: new Set()
    };

    activeGiveaways.set(message.id, giveawayData);

    // Temporizador para finalizar el sorteo
    setTimeout(async () => {
      const data = activeGiveaways.get(message.id);
      if (!data) return;

      const partArray = Array.from(data.participants);
      let winners = [];

      if (partArray.length > 0) {
        const shuffled = [...partArray].sort(() => 0.5 - Math.random());
        winners = shuffled.slice(0, data.winnerCount);
      }

      const winnerMentions = winners.length > 0
        ? winners.map(id => `<@${id}>`).join(', ')
        : 'Nadie (no hubo suficientes participantes)';

      const endEmbed = createNebulaEmbed(interaction.client, {
        color: winners.length > 0 ? COLORS.SUCCESS : COLORS.WARNING,
        title: '🎊 ¡SORTEO FINALIZADO!',
        description:
          `# **${data.prize}**\n\n` +
          `${SYMBOLS.ARROW} **Ganador(es):** ${winnerMentions}\n` +
          `${SYMBOLS.ARROW} **Total de participantes:** \`${partArray.length}\`\n` +
          `${SYMBOLS.ARROW} **Organizador:** <@${data.hostId}>`,
        footerText: 'Nebula Giveaways • ¡Felicidades a los ganadores!'
      });

      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_giveaway_ended')
          .setLabel(`Finalizado (${partArray.length} participantes)`)
          .setEmoji('🏁')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );

      try {
        const ch = await interaction.client.channels.fetch(data.channelId);
        if (ch) {
          const msg = await ch.messages.fetch(data.messageId);
          if (msg) {
            await msg.edit({ embeds: [endEmbed], components: [disabledRow] });
          }
          if (winners.length > 0) {
            await ch.send({
              content: `🎉 ¡Enhorabuena ${winnerMentions}! Has ganado el sorteo de **${data.prize}**.`
            });
          }
        }
      } catch (err) {
        console.error('[Giveaway Error]', err.message);
      }

      activeGiveaways.delete(message.id);
    }, ms);
  },

  activeGiveaways
};
