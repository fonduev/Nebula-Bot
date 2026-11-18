// ============================================================
// Comando /reporte - Centro de Tickets & Feedback
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reporte')
    .setDescription('Envía una sugerencia o reporta un problema sobre Nebula Launcher o el servidor')
    .addStringOption(option =>
      option
        .setName('tipo')
        .setDescription('Elige si es un fallo técnico o una sugerencia')
        .setRequired(true)
        .addChoices(
          { name: '🐛 Reporte de Bug / Error Técnico', value: 'bug' },
          { name: '💡 Sugerencia / Nueva Función', value: 'sugerencia' }
        )
    )
    .addStringOption(option =>
      option
        .setName('descripcion')
        .setDescription('Explica detalladamente tu caso')
        .setRequired(true)
    ),

  async execute(interaction) {
    const tipo = interaction.options.getString('tipo');
    const descripcion = interaction.options.getString('descripcion');
    const isBug = tipo === 'bug';
    const ticketId = `NB-${Math.floor(1000 + Math.random() * 9000)}`;

    const embed = createNebulaEmbed(interaction.client, {
      color: isBug ? COLORS.ERROR : COLORS.GOLD,
      title: isBug ? '🐛 Reporte de Incidencia Registrado' : '💡 Sugerencia de la Comunidad Recibida',
      thumbnail: interaction.user.displayAvatarURL({ dynamic: true }),
      description:
        `>>> **Ticket ID:** \`#${ticketId}\`\n` +
        `**Remitente:** ${interaction.user.tag} (\`${interaction.user.id}\`)\n` +
        `**Estado:** 🟡 \`En cola de revisión por el equipo de desarrollo\``,
      fields: [
        {
          name: '📝 Contenido del Reporte',
          value: `\`\`\`${descripcion.slice(0, 1000)}\`\`\``,
          inline: false
        },
        {
          name: '📌 Próximos Pasos',
          value: isBug
            ? 'Nuestro equipo técnico analizará los registros para replicar el problema y lanzar un parche correctivo.'
            : 'Tu sugerencia será evaluada para incluirla en el roadmap de próximas actualizaciones del lanzador.',
          inline: false
        }
      ],
      footerText: `Nebula Feedback Center • Ticket #${ticketId}`
    });

    await interaction.reply({
      content: `✅ ¡Gracias por contribuir a la mejora de **Nebula Dev Studios**!`,
      embeds: [embed]
    });
  }
};
