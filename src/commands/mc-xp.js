// ============================================================
// Comando /mc-xp - Calculadora de Experiencia y Niveles de Minecraft
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

function getPointsForLevel(level) {
  if (level <= 0) return 0;
  if (level <= 16) {
    return Math.floor(Math.pow(level, 2) + 6 * level);
  } else if (level <= 31) {
    return Math.floor(2.5 * Math.pow(level, 2) - 40.5 * level + 360);
  } else {
    return Math.floor(4.5 * Math.pow(level, 2) - 162.5 * level + 2220);
  }
}

function buildMcXpPayload(client, currentLvl, targetLvl) {
  const currentPts = getPointsForLevel(currentLvl);
  const targetPts = getPointsForLevel(targetLvl);
  const diffPts = Math.max(0, targetPts - currentPts);

  const mobsNeeded = Math.ceil(diffPts / 5);
  const bottlesNeeded = Math.ceil(diffPts / 7);
  const blazesNeeded = Math.ceil(diffPts / 10);
  const endermanNeeded = Math.ceil(diffPts / 5);

  const embed = createNebulaEmbed(client, {
    color: COLORS.MINECRAFT,
    title: '📗 Calculadora de Experiencia (XP) de Minecraft',
    description:
      `>>> **Objetivo:** Subir de **Nivel ${currentLvl}** a **Nivel ${targetLvl}**\n\n` +
      `### 💎 Puntos de Experiencia Requeridos:\n` +
      `${SYMBOLS.ARROW} **Orbes de XP Faltantes:** \`${diffPts.toLocaleString()} XP\`\n` +
      `${SYMBOLS.ARROW} **Puntos Acumulados Actuales:** \`${currentPts.toLocaleString()} XP\`\n` +
      `${SYMBOLS.ARROW} **Puntos Totales al Nivel ${targetLvl}:** \`${targetPts.toLocaleString()} XP\`\n\n` +
      `### ⚔️ Equivalencias para Farmear:\n` +
      `• 🧟 **Mobs Comunes (Zombis / Esqueletos):** \`~${mobsNeeded.toLocaleString()}\` eliminados.\n` +
      `• 👁️ **Endermans (Granja del End):** \`~${endermanNeeded.toLocaleString()}\` eliminados.\n` +
      `• 🔥 **Blazes (Fortaleza del Nether):** \`~${blazesNeeded.toLocaleString()}\` eliminados.\n` +
      `• 🧪 **Frascos de Experiencia:** \`~${bottlesNeeded.toLocaleString()}\` botellas arrojadas.\n\n` +
      `💡 *Dato curioso:* Para pasar de Nivel 0 a 30 (el nivel óptimo de la Mesa de Encantamientos) necesitas exactamente **1,395 puntos de XP**.`,
    footerText: 'Nebula XP Engine • Matemáticas de Minecraft'
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_mc_xp_quick_0_30')
      .setLabel('Nivel 0 ➔ 30')
      .setEmoji('🎯')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('btn_mc_xp_quick_27_30')
      .setLabel('Nivel 27 ➔ 30')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_mc_xp_quick_0_50')
      .setLabel('Nivel 0 ➔ 50')
      .setEmoji('⚡')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mc-xp')
    .setDescription('Calcula orbes de XP y mobs necesarios para subir de nivel con accesos directos táctiles')
    .addIntegerOption(opt =>
      opt.setName('nivel_actual')
        .setDescription('Tu nivel de XP actual (ej: 0 o 27)')
        .setMinValue(0)
        .setMaxValue(500)
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('nivel_deseado')
        .setDescription('El nivel que deseas alcanzar (ej: 30)')
        .setMinValue(1)
        .setMaxValue(500)
        .setRequired(true)
    ),

  buildMcXpPayload,

  async execute(interaction) {
    const currentLvl = interaction.options.getInteger('nivel_actual');
    const targetLvl = interaction.options.getInteger('nivel_deseado');

    if (targetLvl <= currentLvl) {
      return await interaction.reply({
        content: `❌ El nivel deseado (\`${targetLvl}\`) debe ser superior a tu nivel actual (\`${currentLvl}\`).`,
        ephemeral: true
      });
    }

    const payload = buildMcXpPayload(interaction.client, currentLvl, targetLvl);
    await interaction.reply(payload);
  }
};
