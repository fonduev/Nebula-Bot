// ============================================================
// Comando /ppt - Minijuego Piedra, Papel o Tijera
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ppt')
    .setDescription('Juega una partida de Piedra, Papel o Tijera contra la inteligencia de Nebula Bot'),

  async execute(interaction) {
    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.ACCENT,
      title: '✂️ Duelo Cósmico | Piedra, Papel o Tijera',
      description:
        `>>> **¿Crees que puedes vencer al algoritmo de Nebula?**\n\n` +
        `Elige tu movimiento pulsando uno de los 3 botones interactivos inferiores.\n` +
        `¡Que la suerte del espacio esté de tu lado!`,
      fields: [
        {
          name: '⚔️ Reglas Clásicas',
          value: '`🪨 Piedra vence a ✂️ Tijera`\n`📄 Papel vence a 🪨 Piedra`\n`✂️ Tijera vence a 📄 Papel`',
          inline: false
        }
      ],
      footerText: `Retador: ${interaction.user.tag} • Elige tu opción abajo`
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ppt_piedra')
        .setLabel('Piedra')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🪨'),
      new ButtonBuilder()
        .setCustomId('ppt_papel')
        .setLabel('Papel')
        .setStyle(ButtonStyle.Success)
        .setEmoji('📄'),
      new ButtonBuilder()
        .setCustomId('ppt_tijera')
        .setLabel('Tijera')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('✂️')
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
