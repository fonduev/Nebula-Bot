// ============================================================
// Comando /botinfo - Métricas y Estado Técnico
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, version: djsVersion, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Muestra el estado técnico, consumo de recursos y versión de Nebula Bot'),

  async execute(interaction) {
    const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalSeconds = Math.floor(process.uptime());
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let uptimeStr = '';
    if (days > 0) uptimeStr += `${days}d `;
    uptimeStr += `${hours}h ${minutes}m ${seconds}s`;

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.PRIMARY,
      title: '🛰️ Estado Técnico & Métricas del Bot | Nebula Core',
      thumbnail: interaction.client.user.displayAvatarURL(),
      description:
        `>>> **Asistente Oficial de Nebula Dev Studios**\n` +
        `Motor de ejecución reactivo con integración directa para servidores de Minecraft y Nebula Launcher.`,
      fields: [
        {
          name: '⏱️ Tiempo Activo (Uptime)',
          value: `\`${uptimeStr}\``,
          inline: true
        },
        {
          name: '🧠 Memoria RAM en Uso',
          value: `\`${memoryUsage} MB\``,
          inline: true
        },
        {
          name: '📡 Latencia de Socket',
          value: `\`${interaction.client.ws.ping} ms\``,
          inline: true
        },
        {
          name: '⚙️ Entorno Node.js',
          value: `\`${process.version}\``,
          inline: true
        },
        {
          name: '📚 Librería Discord.js',
          value: `\`v${djsVersion}\``,
          inline: true
        },
        {
          name: '🌐 Servidores Vinculados',
          value: `\`${interaction.client.guilds.cache.size}\` comunidad(es)`,
          inline: true
        }
      ],
      footerText: 'Nebula Dev Studios • Engine v1.0 • Node.js LTS'
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Web Oficial')
        .setStyle(ButtonStyle.Link)
        .setEmoji('🌐')
        .setURL('https://nebuladevstudios.com'),
      new ButtonBuilder()
        .setLabel('Invitar al Bot')
        .setStyle(ButtonStyle.Link)
        .setEmoji('➕')
        .setURL('https://discord.com/oauth2/authorize?client_id=1565335954284224622&permissions=8&scope=bot%20applications.commands')
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
