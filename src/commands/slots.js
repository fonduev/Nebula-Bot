// ============================================================
// Comando /slots - Tragamonedas Estelar Cósmica
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');
const { getUserData, modifyCoins } = require('../utils/database');

const SYMBOLS_POOL = ['🍒', '🍇', '🔔', '💎', '7️⃣', '🌌'];

function runSlotsGame(client, guildId, user, bet) {
  const userData = getUserData(guildId, user.id);
  const balance = userData.coins || 0;

  if (balance < bet) {
    return {
      error: `❌ Fondos insuficientes. Tienes **${balance} 🪙 Nebula Coins**, necesitas al menos **${bet}**. Usa \`/daily\` para conseguir monedas gratis.`
    };
  }

  // Generar 3 carretes aleatorios
  const r1 = SYMBOLS_POOL[Math.floor(Math.random() * SYMBOLS_POOL.length)];
  const r2 = SYMBOLS_POOL[Math.floor(Math.random() * SYMBOLS_POOL.length)];
  const r3 = SYMBOLS_POOL[Math.floor(Math.random() * SYMBOLS_POOL.length)];

  let won = false;
  let multiplier = 0;
  let title = '';

  if (r1 === r2 && r2 === r3) {
    won = true;
    if (r1 === '🌌') {
      multiplier = 25;
      title = '🌌 ¡JACKPOT SUPREMO CÓSMICO! (x25)';
    } else if (r1 === '7️⃣' || r1 === '💎') {
      multiplier = 15;
      title = '💎 ¡SUPER PREMIO! (x15)';
    } else {
      multiplier = 8;
      title = '🔔 ¡TRIPLE COINCIDENCIA! (x8)';
    }
  } else if (r1 === r2 || r2 === r3 || r1 === r3) {
    won = true;
    multiplier = 2;
    title = '🎉 ¡PAR COINCIDENTE! (x2)';
  } else {
    won = false;
    title = '💀 SIN SUERTE';
  }

  if (won) {
    const netProfit = bet * (multiplier - 1);
    modifyCoins(guildId, user.id, netProfit);
  } else {
    modifyCoins(guildId, user.id, -bet);
  }

  const newBalance = getUserData(guildId, user.id).coins;

  const embed = createNebulaEmbed(client, {
    color: won ? (multiplier >= 15 ? COLORS.GOLD : COLORS.SUCCESS) : COLORS.ERROR,
    title: title,
    thumbnail: user.displayAvatarURL({ dynamic: true }),
    description:
      `\`\`\`text\n` +
      `╔═════════════════════╗\n` +
      `║     NEBULA SLOTS    ║\n` +
      `╠═════════════════════╣\n` +
      `║   [ ${r1} | ${r2} | ${r3} ]   ║\n` +
      `╚═════════════════════╝\n` +
      `\`\`\`\n` +
      `${SYMBOLS.ARROW} **Apuesta:** \`${bet} 🪙 Coins\`\n` +
      (won
        ? `${SYMBOLS.ARROW} **Premio ganado:** \`+${bet * multiplier} Coins\` *(x${multiplier})*\n`
        : `${SYMBOLS.ARROW} **Monedas perdidas:** \`-${bet} Coins\`\n`) +
      `${SYMBOLS.ARROW} **Nuevo saldo:** \`${newBalance} 🪙 Nebula Coins\``,
    footerText: 'Nebula Slots & Casino • Tragamonedas Virtual'
  });

  const nextDouble = Math.min(bet * 2, 25000);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`btn_slots_repeat_${bet}`)
      .setLabel(`Girar (${bet} 🪙)`)
      .setEmoji('🎰')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`btn_slots_repeat_${nextDouble}`)
      .setLabel(`x2 (${nextDouble} 🪙)`)
      .setEmoji('🔥')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('btn_view_my_perfil')
      .setLabel('Mi Saldo')
      .setEmoji('🪐')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Prueba tu suerte en la máquina tragamonedas cósmica con controles táctiles')
    .addIntegerOption(opt =>
      opt
        .setName('apuesta')
        .setDescription('Cantidad de Nebula Coins a apostar')
        .setMinValue(10)
        .setMaxValue(25000)
        .setRequired(true)
    ),

  runSlotsGame,

  async execute(interaction) {
    const bet = interaction.options.getInteger('apuesta');
    const result = runSlotsGame(interaction.client, interaction.guildId, interaction.user, bet);

    if (result.error) {
      return await interaction.reply({ content: result.error, ephemeral: true });
    }

    return await interaction.reply(result);
  }
};
