// ============================================================
// Comando /ip - Dirección IP y Conexión de Servidor
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ip')
    .setDescription('Muestra la dirección de conexión oficial y accesos directos al servidor'),

  async execute(interaction) {
    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.SECONDARY,
      title: '🌐 Conexión & Servidor Oficial | Nebula Studios',
      description:
        `>>> **¿Listo para jugar con nosotros?** Únete utilizando cualquiera de las opciones de conexión directa o lánzalo desde **Nebula Launcher** con mods de rendimiento preconfigurados.\n\n` +
        `${SYMBOLS.ARROW} **Dirección de Servidor:** \`play.nebuladevstudios.com\`\n` +
        `${SYMBOLS.ARROW} **Versión Recomendada:** \`1.20.4 - 1.21.x\` (Java & Bedrock)\n` +
        `${SYMBOLS.ARROW} **Puerto Java:** \`25565\` (Predeterminado)\n` +
        `${SYMBOLS.ARROW} **Puerto Bedrock:** \`19132\``,
      fields: [
        {
          name: '🚀 ¿Cómo unirte con un clic?',
          value: 'Descarga **Nebula Launcher v5.0.8** y el servidor aparecerá automáticamente añadido en tu lista de multijugador con mods de rendimiento preconfigurados.',
          inline: false
        },
        {
          name: '🛡️ Estado de Seguridad',
          value: 'Protección Anti-DDoS Anycast activa • Ping optimizado para América y Europa.',
          inline: false
        }
      ]
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Descargar Nebula Launcher')
        .setStyle(ButtonStyle.Link)
        .setEmoji('🚀')
        .setURL('https://nebuladevstudios.com/launcher.html'),
      new ButtonBuilder()
        .setLabel('Discord Oficial')
        .setStyle(ButtonStyle.Link)
        .setEmoji('💬')
        .setURL('https://discord.gg/cfE254mQHZ')
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
