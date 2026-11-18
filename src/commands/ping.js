// ============================================================
// Comando /ping - Velocímetro de Latencia Cósmica
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed, createProgressBar } = require('../utils/theme');

function buildPingPayload(client, roundtripLatency) {
  const wsPing = Math.max(1, client.ws.ping || 0);

  let statusPill = '🟢 Excelente (Ultrarrápido)';
  let pingColor = COLORS.SUCCESS;

  if (roundtripLatency > 200 || wsPing > 150) {
    statusPill = '🟡 Aceptable';
    pingColor = COLORS.WARNING;
  }
  if (roundtripLatency > 400 || wsPing > 300) {
    statusPill = '🔴 Elevada (Posible congestión de red)';
    pingColor = COLORS.ERROR;
  }

  // Barra de calidad (inversa: menor ping = barra más llena)
  const qualityWs = Math.max(0, 100 - Math.min(Math.round((wsPing / 300) * 100), 100));
  const qualityRound = Math.max(0, 100 - Math.min(Math.round((roundtripLatency / 400) * 100), 100));

  const barWs = createProgressBar(qualityWs, 100, 10);
  const barRound = createProgressBar(qualityRound, 100, 10);

  const embed = createNebulaEmbed(client, {
    color: pingColor,
    title: '⚡ Velocímetro de Latencia Cósmica | Nebula Bot',
    description:
      `>>> **Diagnóstico de rendimiento de red bidireccional en tiempo real.**\n` +
      `Medición exacta del tiempo de respuesta entre el clúster de Nebula y los servidores de Discord Gateway.`,
    fields: [
      {
        name: '⏱️ Latencia REST Roundtrip (Mensaje)',
        value: `\`${roundtripLatency} ms\`\n${barRound}`,
        inline: false
      },
      {
        name: '📡 Discord WebSocket Gateway (Heartbeat)',
        value: `\`${wsPing} ms\`\n${barWs}`,
        inline: false
      },
      {
        name: '📊 Calidad de Conexión',
        value: `\`${statusPill}\``,
        inline: true
      },
      {
        name: '🌐 Región Gateway',
        value: '`US-East / Cloudflare`',
        inline: true
      }
    ],
    footerText: 'Nebula Network Diagnostics • Mediciones en vivo'
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_ping_refresh')
      .setLabel('Medir de Nuevo')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('btn_ping_uptime')
      .setLabel('Estado del Bot')
      .setEmoji('📊')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Comprueba la latencia en tiempo real de respuesta de Nebula Bot y Discord con botón de refresco'),

  buildPingPayload,

  async execute(interaction) {
    const sent = await interaction.deferReply({ fetchReply: true });
    const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;

    const payload = buildPingPayload(interaction.client, roundtripLatency);
    await interaction.editReply(payload);
  }
};
