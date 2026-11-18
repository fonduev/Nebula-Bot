// ============================================================
// Comando /changelog - Historial de Versiones
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('changelog')
    .setDescription('Consulta las notas de los últimos parches y mejoras de Nebula Launcher'),

  async execute(interaction) {
    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.PRIMARY,
      title: '📜 Registro de Versiones | Nebula Launcher',
      url: 'https://github.com/fonduev/astral-nebula-launcher/releases',
      description:
        `>>> **Historial oficial de desarrollo y parches aplicados al cliente de Minecraft.**\n` +
        `Mantén tu lanzador actualizado para disfrutar de las últimas optimizaciones y novedades.`,
      fields: [
        {
          name: '🚀 v5.0.8 — Versión Actual Estable',
          value:
            `${SYMBOLS.ARROW} **Discord RPC Fix:** Filtro de paquetes internos de Simple Voice Chat para prevenir desconexiones al alternar servidores.\n` +
            `${SYMBOLS.ARROW} **Empaquetado OTA:** Módulo \`app.asar\` optimizado para actualizaciones silenciosas.\n` +
            `${SYMBOLS.ARROW} **Optimización de Memoria:** Reducción del consumo base en reposo a menos de 180 MB.`,
          inline: false
        },
        {
          name: '⚡ v5.0.7',
          value:
            `${SYMBOLS.ARROW} Soporte expandido para NeoForge en Minecraft 1.21.x.\n` +
            `${SYMBOLS.ARROW} Mejoras de rendimiento en el renderizado y carga de texturas.`,
          inline: false
        },
        {
          name: '🛠️ v5.0.6',
          value:
            `${SYMBOLS.ARROW} Detección automática inteligente de la memoria RAM del equipo.\n` +
            `${SYMBOLS.ARROW} Perfiles de optimización Java ZGC y G1GC preconfigurados.`,
          inline: false
        }
      ],
      footerText: 'Nebula Dev Studios • GitHub Releases'
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Ver Todos los Releases')
        .setStyle(ButtonStyle.Link)
        .setEmoji('🐙')
        .setURL('https://github.com/fonduev/astral-nebula-launcher/releases'),
      new ButtonBuilder()
        .setLabel('Descargar v5.0.8')
        .setStyle(ButtonStyle.Link)
        .setEmoji('📥')
        .setURL('https://nebuladevstudios.com/launcher.html#descargas')
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
