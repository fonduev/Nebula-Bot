// ============================================================
// Comando /daily - Recompensa Diaria & Racha Cósmica
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');
const { claimDaily, getUserData } = require('../utils/database');

function createDailyButtons() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_view_my_perfil')
      .setLabel('Mi Perfil')
      .setEmoji('🪐')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('btn_slots_repeat_10')
      .setLabel('Probar Slots (10 🪙)')
      .setEmoji('🎰')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_view_top')
      .setLabel('Top 10')
      .setEmoji('🏆')
      .setStyle(ButtonStyle.Secondary)
  );
  return [row];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Reclama tu recompensa diaria de Nebula Coins y gestiona tu balance con botones táctiles'),

  createDailyButtons,

  async execute(interaction) {
    const result = claimDaily(interaction.guildId, interaction.user.id);

    if (!result.success) {
      const availableAt = Math.floor((Date.now() + result.remainingMs) / 1000);
      const hours = Math.floor(result.remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((result.remainingMs % (1000 * 60 * 60)) / (1000 * 60));

      const cooldownEmbed = createNebulaEmbed(interaction.client, {
        color: COLORS.WARNING,
        title: '⏳ Recompensa Diaria Ya Reclamada',
        thumbnail: interaction.user.displayAvatarURL({ dynamic: true }),
        description:
          `>>> Ya has recolectado tus **Nebula Coins** de hoy.\n\n` +
          `${SYMBOLS.ARROW} **Disponible de nuevo:** <t:${availableAt}:R> (<t:${availableAt}:t>)\n` +
          `${SYMBOLS.ARROW} **Tiempo restante:** \`${hours}h ${minutes}m\`\n\n` +
          `*¡Vuelve mañana para no perder tu racha de bonificación diaria!*`,
        footerText: 'Nebula Economy • Sistema de Recompensas 24h'
      });

      return await interaction.reply({
        embeds: [cooldownEmbed],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('btn_view_my_perfil')
              .setLabel('Ver mi Saldo')
              .setEmoji('🪐')
              .setStyle(ButtonStyle.Primary)
          )
        ],
        ephemeral: true
      });
    }

    const userData = getUserData(interaction.guildId, interaction.user.id);
    const fireEmojis = '🔥'.repeat(Math.min(result.streak, 5));

    const claimEmbed = createNebulaEmbed(interaction.client, {
      color: COLORS.GOLD,
      title: '🪙 ¡Recompensa Diaria Cobrada con Éxito!',
      thumbnail: interaction.user.displayAvatarURL({ dynamic: true }),
      description:
        `# **+${result.reward} Nebula Coins**\n\n` +
        `> ¡Has reclamado tu suministro estelar diario y acumulado experiencia!\n\n` +
        `${SYMBOLS.ARROW} **Racha actual:** \`${result.streak} días consecutivos\` ${fireEmojis}\n` +
        `${SYMBOLS.ARROW} **Experiencia ganada:** \`+50 XP\`\n` +
        `${SYMBOLS.ARROW} **Saldo total:** \`${result.totalCoins} 🪙 Coins\`\n` +
        `${SYMBOLS.ARROW} **Nivel actual:** \`Nivel ${userData.level}\`\n\n` +
        `*¡Mantén tu racha activa mañana para recibir un bono aún mayor!*`,
      footerText: 'Nebula Economy • Recompensas Diarias'
    });

    return await interaction.reply({
      embeds: [claimEmbed],
      components: createDailyButtons()
    });
  }
};
