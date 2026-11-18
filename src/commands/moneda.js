// ============================================================
// Comando /moneda - Lanzamiento de Moneda
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

function flipCoin(client, user) {
  const isCara = Math.random() < 0.5;
  const resultado = isCara ? 'Cara' : 'Cruz';
  const icono = isCara ? '🪙' : '🌟';
  const color = isCara ? COLORS.GOLD : COLORS.PRIMARY;

  const embed = createNebulaEmbed(client, {
    color: color,
    title: `${icono} ¡Lanzamiento de Moneda!`,
    description:
      `>>> La moneda cósmica gira a gran velocidad en el aire y aterriza mostrando:\n\n` +
      `# **${resultado.toUpperCase()}**\n\n` +
      `*El destino ha hablado.*`,
    footerText: `Lanzado por ${user.tag || user.username}`
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_moneda_again')
      .setLabel('Lanzar de Nuevo')
      .setEmoji('🪙')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('btn_slots_repeat_10')
      .setLabel('Jugar Slots')
      .setEmoji('🎰')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('moneda')
    .setDescription('Lanza una moneda estelar al aire (Cara o Cruz) con botón interactivo'),

  flipCoin,

  async execute(interaction) {
    const result = flipCoin(interaction.client, interaction.user);
    await interaction.reply(result);
  }
};
