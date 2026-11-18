// ============================================================
// Comando /queue - Cola de Reproducción
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');
const { getSession } = require('../utils/musicManager');

function buildQueuePayload(client, guildId) {
  const session = getSession(guildId);

  if (!session || (!session.currentTrack && session.queue.length === 0)) {
    return {
      embeds: [
        createNebulaEmbed(client, {
          color: COLORS.WARNING,
          title: '📜 Cola Vacía',
          description: '> Actualmente no hay ninguna canción en la cola. Usa `/play` para añadir música.'
        })
      ],
      components: []
    };
  }

  const current = session.currentTrack;
  const queueList = session.queue.slice(0, 10).map((t, i) => {
    return `\`${i + 1}.\` **${t.title}** \`[${t.duration}]\` • *Pedida por ${t.requestedBy || 'Usuario'}*`;
  }).join('\n');

  const embed = createNebulaEmbed(client, {
    color: COLORS.PRIMARY,
    title: '📜 Cola de Reproducción de Música',
    thumbnail: current ? current.thumbnail : null,
    description:
      `>>> 🎶 **Sonando Ahora:**\n` +
      `# **${current ? current.title : 'Ninguna'}**\n` +
      `⏱️ Duración: \`${current ? current.duration : '0:00'}\` • Origen: \`${current ? current.source : 'Desconocido'}\`\n\n` +
      `📑 **Próximas en la Cola (${session.queue.length}):**\n` +
      (queueList || '*No hay canciones en espera.*'),
    footerText: `Nebula Audio Queue • Total en cola: ${session.queue.length}`
  });

  if (session.queue.length > 10) {
    embed.addFields({
      name: '📌 Y más canciones...',
      value: `Hay **${session.queue.length - 10}** canciones adicionales en la cola.`
    });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('music_btn_toggle')
      .setLabel(session.isPlaying ? 'Pausar' : 'Reanudar')
      .setEmoji(session.isPlaying ? '⏸️' : '▶️')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('music_btn_skip')
      .setLabel('Saltar')
      .setEmoji('⏭️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('music_btn_stop')
      .setLabel('Detener')
      .setEmoji('⏹️')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('btn_queue_refresh')
      .setLabel('Actualizar')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Muestra la lista de canciones en espera con botones de control táctil de reproducción'),

  buildQueuePayload,

  async execute(interaction) {
    const payload = buildQueuePayload(interaction.client, interaction.guildId);
    await interaction.reply(payload);
  }
};
