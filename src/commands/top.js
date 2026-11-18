// ============================================================
// Comando /top - Tabla de Clasificación de Miembros (Leaderboard)
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');
const { getTopUsers } = require('../utils/database');

const MEDALS = ['🥇', '🥈', '🥉'];

function buildTopPayload(client, guild, authorId) {
  const topList = getTopUsers(guild.id, 10);

  if (topList.length === 0) {
    return {
      embeds: [
        createNebulaEmbed(client, {
          color: COLORS.WARNING,
          title: '📜 Sin Clasificaciones',
          description: '> Aún no hay registros de actividad en este servidor. ¡Empieza a chatear para ganar XP!'
        })
      ],
      components: []
    };
  }

  const rows = topList.map((entry, index) => {
    const medal = MEDALS[index] || `\`#${index + 1}\``;
    return `${medal} <@${entry.userId}> • **Nivel ${entry.level}** • \`${entry.xp.toLocaleString()} XP\` • \`${entry.coins || 0} 🪙\``;
  }).join('\n');

  const embed = createNebulaEmbed(client, {
    color: COLORS.GOLD,
    title: '🏆 Tabla de Clasificación Cósmica (Top 10)',
    thumbnail: guild.iconURL({ dynamic: true }),
    description:
      `>>> Los miembros más activos y destacados de **${guild.name}**:\n\n` +
      rows + '\n\n' +
      `*Gana XP y sube en la clasificación participando en los canales de texto.*`,
    footerText: 'Nebula Leaderboard • Top 10 Servidor'
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_view_my_rank')
      .setLabel('Mi Nivel')
      .setEmoji('📊')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_view_my_perfil')
      .setLabel('Mi Perfil')
      .setEmoji('🪐')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('btn_top_refresh')
      .setLabel('Actualizar')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('top')
    .setDescription('Muestra la tabla de clasificación de los miembros con mayor nivel y botones interactivos'),

  buildTopPayload,

  async execute(interaction) {
    const payload = buildTopPayload(interaction.client, interaction.guild, interaction.user.id);
    await interaction.reply(payload);
  }
};
