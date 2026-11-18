// ============================================================
// Comando /uptime - Monitor de Rendimiento y Tiempo en Línea
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const os = require('os');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Comprueba el tiempo de actividad ininterrumpido y estado técnico del bot'),

  async execute(interaction) {
    const processUptime = formatUptime(process.uptime());
    const osUptime = formatUptime(os.uptime());
    const memUsage = process.memoryUsage();
    const ramMb = (memUsage.rss / 1024 / 1024).toFixed(1);
    const heapUsedMb = (memUsage.heapUsed / 1024 / 1024).toFixed(1);
    const ping = interaction.client.ws.ping;
    const startTime = Math.floor((Date.now() - (process.uptime() * 1000)) / 1000);

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.SUCCESS,
      title: '⚡ Estado & Disponibilidad Técnica (Uptime)',
      thumbnail: interaction.client.user.displayAvatarURL(),
      description:
        `# **Nebula Bot • 100% Operativo**\n\n` +
        `${SYMBOLS.ARROW} **Tiempo Online:** \`${processUptime}\` (Iniciado <t:${startTime}:R>)\n` +
        `${SYMBOLS.ARROW} **Latencia Gateway (Ping):** \`${ping} ms\`\n` +
        `${SYMBOLS.ARROW} **Consumo de Memoria RAM:** \`${ramMb} MB\` (Heap: \`${heapUsedMb} MB\`)\n` +
        `${SYMBOLS.ARROW} **Plataforma Servidor:** \`${os.type()} ${os.release()} (${os.arch()})\`\n` +
        `${SYMBOLS.ARROW} **Versión de Node.js:** \`${process.version}\`\n` +
        `${SYMBOLS.ARROW} **Uptime del Sistema:** \`${osUptime}\``,
      footerText: 'Nebula Monitoring Core • Métricas en Tiempo Real'
    });

    await interaction.reply({ embeds: [embed] });
  }
};
