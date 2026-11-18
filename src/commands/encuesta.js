// ============================================================
// Comando /encuesta - Votaciones Comunitarias Interactivas
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed, createProgressBar } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('encuesta')
    .setDescription('Crea una encuesta interactiva con botones de votación en tiempo real para la comunidad')
    .addStringOption(option =>
      option.setName('pregunta').setDescription('La pregunta o tema a debatir').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('opcion_a').setDescription('Primera opción (Opción A)').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('opcion_b').setDescription('Segunda opción (Opción B)').setRequired(true)
    ),

  async execute(interaction) {
    const question = interaction.options.getString('pregunta');
    const optA = interaction.options.getString('opcion_a');
    const optB = interaction.options.getString('opcion_b');

    const emptyBar = createProgressBar(0, 1, 10);

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.ACCENT,
      title: `📊 Encuesta de la Comunidad`,
      description:
        `>>> # **${question}**\n\n` +
        `Vota haciendo clic en los botones inferiores. Los resultados se computan al instante.\n\n` +
        `🔵 **Opción A:** \`${optA}\`\n${emptyBar} *(0 votos)*\n\n` +
        `🟣 **Opción B:** \`${optB}\`\n${emptyBar} *(0 votos)*\n\n` +
        `📊 **Total de participantes:** \`0 votos registrados\``,
      footerText: `Encuesta iniciada por ${interaction.user.tag}`
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`poll_opt1_${Date.now()}`)
        .setLabel(`Opción A: ${optA.slice(0, 60)}`)
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔵'),
      new ButtonBuilder()
        .setCustomId(`poll_opt2_${Date.now()}`)
        .setLabel(`Opción B: ${optB.slice(0, 60)}`)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🟣')
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
