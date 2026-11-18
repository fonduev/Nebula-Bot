// ============================================================
// Comando /dado - Lanzador de Dados Cósmicos
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

function rollDice(client, user, caras = 6) {
  const resultado = Math.floor(Math.random() * caras) + 1;

  let mensaje = `Has obtenido una tirada aleatoria entre 1 y ${caras}.`;
  let color = COLORS.PRIMARY;

  if (caras === 20) {
    if (resultado === 20) {
      mensaje = '🔥 **¡CRÍTICO NATURAL! ¡Éxito legendario absoluto!**';
      color = COLORS.SUCCESS;
    } else if (resultado === 1) {
      mensaje = '💀 **¡PIFIA NATURAL! Fallo catastrófico en la tirada.**';
      color = COLORS.ERROR;
    }
  }

  const embed = createNebulaEmbed(client, {
    color: color,
    title: `🎲 Tirada de Dado D${caras}`,
    description:
      `>>> ${mensaje}\n\n` +
      `# **Resultado: \`${resultado}\`**\n\n` +
      `*Rango posible: 1 a ${caras}*`,
    footerText: `Lanzado por ${user.tag || user.username}`
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_dado_6')
      .setLabel('D6')
      .setEmoji('🎲')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_dado_12')
      .setLabel('D12')
      .setEmoji('🎲')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_dado_20')
      .setLabel('D20 (Rol)')
      .setEmoji('⚔️')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('btn_dado_100')
      .setLabel('D100 (%)')
      .setEmoji('🎯')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dado')
    .setDescription('Lanza un dado de rol o clásico con controles táctiles para relanzar')
    .addIntegerOption(option =>
      option
        .setName('caras')
        .setDescription('Elige el tipo de dado')
        .setRequired(false)
        .addChoices(
          { name: '🎲 Dado de 6 caras (D6 Clásico)', value: 6 },
          { name: '🎲 Dado de 12 caras (D12)', value: 12 },
          { name: '🎲 Dado de 20 caras (D20 Rol / Crítico)', value: 20 },
          { name: '🎲 Dado de 100 caras (D100 Porcentaje)', value: 100 }
        )
    ),

  rollDice,

  async execute(interaction) {
    const caras = interaction.options.getInteger('caras') || 6;
    const result = rollDice(interaction.client, interaction.user, caras);
    await interaction.reply(result);
  }
};
