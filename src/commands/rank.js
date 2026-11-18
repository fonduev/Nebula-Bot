// ============================================================
// Comando /rank - Tarjeta de Nivel y Progreso de XP
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed, createProgressBar } = require('../utils/theme');
const { getUserData, getTopUsers } = require('../utils/database');

function buildRankPayload(client, guild, targetUser) {
  const userData = getUserData(guild.id, targetUser.id);
  const topUsers = getTopUsers(guild.id, 100);
  const pos = topUsers.findIndex(u => u.userId === targetUser.id) + 1;
  const rankPosText = pos > 0 ? `#${pos}` : 'Sin clasificar';

  const nextLvlXp = userData.level * userData.level * 100;
  const prevLvlXp = (userData.level - 1) * (userData.level - 1) * 100;
  const currentProgress = Math.max(0, userData.xp - prevLvlXp);
  const needed = Math.max(1, nextLvlXp - prevLvlXp);
  const bar = createProgressBar(currentProgress, needed, 12);

  const embed = createNebulaEmbed(client, {
    color: COLORS.GOLD,
    title: `📊 Nivel y Experiencia de ${targetUser.username}`,
    thumbnail: targetUser.displayAvatarURL({ dynamic: true, size: 256 }),
    description:
      `>>> **Posición en el Servidor:** \`${rankPosText}\`\n\n` +
      `### 🌟 Estadísticas de Actividad:\n` +
      `${SYMBOLS.ARROW} **Nivel:** \`${userData.level}\`\n` +
      `${SYMBOLS.ARROW} **Experiencia Total:** \`${userData.xp.toLocaleString()} XP\`\n` +
      `${SYMBOLS.ARROW} **Progreso al Nivel ${userData.level + 1}:**\n` +
      `${bar} \`${currentProgress.toLocaleString()} / ${needed.toLocaleString()} XP\`\n\n` +
      `${SYMBOLS.ARROW} **Nebula Coins:** \`${userData.coins || 0} 🪙\`\n` +
      `${SYMBOLS.ARROW} **Racha Diaria:** \`${userData.dailyStreak || 0} días 🔥\``,
    footerText: 'Nebula XP & Rankings • Gana XP chateando activamente'
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`btn_view_perfil_${targetUser.id}`)
      .setLabel('Ver Perfil')
      .setEmoji('🪐')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('btn_view_top')
      .setLabel('Top 10')
      .setEmoji('🏆')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`btn_rank_refresh_${targetUser.id}`)
      .setLabel('Actualizar')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Consulta tu nivel de actividad, experiencia acumulada y progreso con botones interactivos')
    .addUserOption(opt =>
      opt.setName('usuario')
        .setDescription('Miembro a consultar (por defecto tú)')
        .setRequired(false)
    ),

  buildRankPayload,

  async execute(interaction) {
    const targetUser = interaction.options.getUser('usuario') || interaction.user;
    const payload = buildRankPayload(interaction.client, interaction.guild, targetUser);
    await interaction.reply(payload);
  }
};
