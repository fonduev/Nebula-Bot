// ============================================================
// Comando /qr - Generador de Códigos QR Cósmicos
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('qr')
    .setDescription('Genera un código QR interactivo de alta resolución a partir de un enlace o texto')
    .addStringOption(opt =>
      opt.setName('texto')
        .setDescription('Enlace o texto que contendrá el código QR')
        .setRequired(true)
    ),

  async execute(interaction) {
    const rawData = interaction.options.getString('texto');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(rawData)}&color=000000&bgcolor=ffffff&margin=10`;

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.ACCENT,
      title: '📱 Generador de Código QR',
      image: qrUrl,
      description:
        `>>> Escanea la imagen con la cámara de tu teléfono móvil para acceder al contenido codificado.\n\n` +
        `${SYMBOLS.ARROW} **Contenido:** \`${rawData.length > 80 ? rawData.slice(0, 77) + '...' : rawData}\`\n` +
        `${SYMBOLS.ARROW} **Resolución:** \`350x350 px\`\n` +
        `${SYMBOLS.ARROW} **Generado por:** ${interaction.user}`,
      footerText: 'Nebula Utility • Escaneo Rápido de Códigos QR'
    });

    await interaction.reply({ embeds: [embed] });
  }
};
