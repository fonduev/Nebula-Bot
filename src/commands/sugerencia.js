// ============================================================
// Comando /sugerencia - Buzón Comunitario con Votación en Vivo
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

// Mapa en memoria de sugerencias (messageId -> { upvotes: Set, downvotes: Set, authorId, text })
const activeSuggestions = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sugerencia')
    .setDescription('Envía una sugerencia para el servidor o Nebula Launcher con votación comunitaria')
    .addStringOption(opt =>
      opt.setName('propuesta')
        .setDescription('Describe tu idea o propuesta con el mayor detalle posible')
        .setRequired(true)
    ),

  async execute(interaction) {
    const text = interaction.options.getString('propuesta');

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.SECONDARY,
      title: '💡 Nueva Sugerencia Comunitaria',
      thumbnail: interaction.user.displayAvatarURL({ dynamic: true }),
      description:
        `>>> **${text}**\n\n` +
        `${SYMBOLS.ARROW} **Autor:** ${interaction.user} (\`${interaction.user.tag}\`)\n` +
        `${SYMBOLS.ARROW} **Estado:** \`En Votación Comunitaria ⏳\`\n` +
        `${SYMBOLS.ARROW} **Fecha:** <t:${Math.floor(Date.now() / 1000)}:R>`,
      footerText: 'Nebula Community • Pulsa un botón para emitir tu voto'
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_sugg_up')
        .setLabel('Apoyar (0)')
        .setEmoji('👍')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('btn_sugg_down')
        .setLabel('Rechazar (0)')
        .setEmoji('👎')
        .setStyle(ButtonStyle.Danger)
    );

    const message = await interaction.reply({
      embeds: [embed],
      components: [row],
      fetchReply: true
    });

    activeSuggestions.set(message.id, {
      messageId: message.id,
      authorId: interaction.user.id,
      text,
      upvotes: new Set(),
      downvotes: new Set()
    });
  },

  activeSuggestions
};
