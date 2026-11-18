// ============================================================
// Comando /voz-info - Diagnóstico de Canales de Voz
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');
const { getSession } = require('../utils/musicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voz-info')
    .setDescription('Muestra el estado técnico, calidad de audio y miembros en el canal de voz actual'),

  async execute(interaction) {
    const memberVoice = interaction.member.voice.channel;
    if (!memberVoice) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.WARNING,
            title: '🔇 No estás en un Canal de Voz',
            description: '> Conéctate a cualquier canal de voz para ver su diagnóstico.'
          })
        ],
        ephemeral: true
      });
    }

    const session = getSession(interaction.guildId);
    const membersInChannel = memberVoice.members;
    const humans = membersInChannel.filter(m => !m.user.bot).size;
    const bots = membersInChannel.filter(m => m.user.bot).size;

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.PRIMARY,
      title: `🔊 Diagnóstico de Voz | ${memberVoice.name}`,
      description:
        `>>> **Canal:** <#${memberVoice.id}>\n` +
        `**Categoría:** ${memberVoice.parent ? memberVoice.parent.name : 'Sin categoría'}\n\n` +
        `${SYMBOLS.ARROW} **Bitrate de Audio:** \`${memberVoice.bitrate / 1000} kbps\`\n` +
        `${SYMBOLS.ARROW} **Límite de Usuarios:** \`${memberVoice.userLimit === 0 ? 'Ilimitado' : memberVoice.userLimit}\`\n` +
        `${SYMBOLS.ARROW} **Miembros Conectados:** \`${membersInChannel.size}\` (👤 ${humans} humanos | 🤖 ${bots} bots)\n` +
        `${SYMBOLS.ARROW} **Región RTC:** \`${memberVoice.rtcRegion || 'Automática'}\``,
      fields: [
        {
          name: '🎵 Estado del Reproductor Nebula',
          value: session
            ? `🟢 **En Reproducción:** ${session.track?.name || 'Audio Activo'}\n• **Volumen:** \`${Math.round(session.volume * 100)}%\` • **Pausado:** \`${session.isPaused ? 'Sí' : 'No'}\``
            : '⚪ **En Reposo:** Ninguna música reproduciéndose actualmente en este servidor.',
          inline: false
        }
      ],
      footerText: `Nebula Voice Analytics • Canal: ${memberVoice.name}`
    });

    await interaction.reply({ embeds: [embed] });
  }
};
