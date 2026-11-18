// ============================================================
// Comando /perfil - Ficha Cósmica Integral de Jugador
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed, createProgressBar } = require('../utils/theme');
const { getUserData, getLinkedMinecraft } = require('../utils/database');

async function buildProfilePayload(client, guild, targetUser, authorId) {
  const member = guild ? await guild.members.fetch(targetUser.id).catch(() => null) : null;
  const userData = getUserData(guild.id, targetUser.id);
  const mcUser = getLinkedMinecraft(targetUser.id);

  const nextLvlXp = userData.level * userData.level * 100;
  const prevLvlXp = (userData.level - 1) * (userData.level - 1) * 100;
  const currentLvlProgress = Math.max(0, userData.xp - prevLvlXp);
  const neededForNext = Math.max(1, nextLvlXp - prevLvlXp);
  const progressBar = createProgressBar(currentLvlProgress, neededForNext, 10);

  const mcInfo = mcUser
    ? `🎮 **Minecraft:** \`${mcUser}\` *(Vinculado con Nebula Launcher)*\n` +
      `👤 **Skin Render:** [Ver Skin 3D](https://mc-heads.net/body/${encodeURIComponent(mcUser)}/180)`
    : `🎮 **Minecraft:** \`No vinculado\` *(Usa \`/vincular <nick>\` para enlazar tu skin)*`;

  const embed = createNebulaEmbed(client, {
    color: COLORS.PRIMARY,
    title: `🪐 Perfil Cósmico: ${targetUser.username}`,
    thumbnail: mcUser ? `https://mc-heads.net/body/${encodeURIComponent(mcUser)}/180` : targetUser.displayAvatarURL({ dynamic: true, size: 256 }),
    description:
      `>>> *${userData.bio || 'Viajero del cosmos de Nebula Dev Studios'}*\n\n` +
      `### 🏆 Progreso & Gamificación:\n` +
      `${SYMBOLS.ARROW} **Nivel:** \`${userData.level}\` • **Nebula Coins:** \`${userData.coins || 0} 🪙\`\n` +
      `${SYMBOLS.ARROW} **Experiencia:** \`${userData.xp.toLocaleString()} XP\`\n` +
      `${SYMBOLS.ARROW} **Siguiente Nivel:** ${progressBar}\n` +
      `${SYMBOLS.ARROW} **Racha Diaria:** \`${userData.dailyStreak || 0} días consecutivos 🔥\`\n\n` +
      `### ⛏️ Ecosistema Gaming:\n` +
      mcInfo + '\n\n' +
      `### 🛡️ Membresía en Discord:\n` +
      `${SYMBOLS.ARROW} **Llegada:** <t:${Math.floor((member?.joinedTimestamp || Date.now()) / 1000)}:R>\n` +
      `${SYMBOLS.ARROW} **Rol Principal:** ${member?.roles?.highest || '@everyone'}`,
    footerText: 'Nebula Identity Core • Ecosistema Gamer Unificado'
  });

  const row = new ActionRowBuilder();
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`btn_view_rank_${targetUser.id}`)
      .setLabel('Ver Nivel')
      .setEmoji('📊')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_view_top')
      .setLabel('Top 10')
      .setEmoji('🏆')
      .setStyle(ButtonStyle.Secondary)
  );

  if (targetUser.id === authorId) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('btn_claim_daily')
        .setLabel('Daily')
        .setEmoji('🪙')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('btn_edit_bio')
        .setLabel('Editar Bio')
        .setEmoji('✏️')
        .setStyle(ButtonStyle.Primary)
    );
  }

  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`btn_perfil_refresh_${targetUser.id}`)
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('perfil')
    .setDescription('Muestra la ficha integral de jugador con botones táctiles y biografía editable')
    .addUserOption(opt =>
      opt.setName('usuario')
        .setDescription('Miembro a consultar (por defecto tú)')
        .setRequired(false)
    ),

  buildProfilePayload,

  async execute(interaction) {
    const targetUser = interaction.options.getUser('usuario') || interaction.user;
    const payload = await buildProfilePayload(interaction.client, interaction.guild, targetUser, interaction.user.id);
    await interaction.reply(payload);
  }
};
