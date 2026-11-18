// ============================================================
// Comando /ruleta - Casino & Apuestas en la Ruleta Cósmica
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

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

function runRuletaGame(client, guildId, user, bet, colorPick) {
  const userData = getUserData(guildId, user.id);
  const balance = userData.coins || 0;

  if (balance < bet) {
    return {
      error: `❌ Fondos insuficientes. Tienes **${balance} 🪙 Nebula Coins**, no puedes apostar **${bet}**. Usa \`/daily\` para conseguir monedas gratis.`
    };
  }

  // Girar la ruleta (0 a 36)
  const rolledNumber = Math.floor(Math.random() * 37);
  let winningColor = 'verde';
  let colorEmoji = '🟢';

  if (RED_NUMBERS.includes(rolledNumber)) {
    winningColor = 'rojo';
    colorEmoji = '🔴';
  } else if (BLACK_NUMBERS.includes(rolledNumber)) {
    winningColor = 'negro';
    colorEmoji = '⚫';
  }

  const won = winningColor === colorPick;
  let profit = 0;
  let multiplier = 0;

  if (won) {
    multiplier = colorPick === 'verde' ? 14 : 2;
    profit = bet * (multiplier - 1);
    modifyCoins(guildId, user.id, profit);
  } else {
    modifyCoins(guildId, user.id, -bet);
  }

  const newBalance = getUserData(guildId, user.id).coins;

  const embed = createNebulaEmbed(client, {
    color: won ? COLORS.GOLD : COLORS.ERROR,
    title: won ? '🎉 ¡VICTORIA EN LA RULETA!' : '💀 HAS PERDIDO LA APUESTA',
    thumbnail: user.displayAvatarURL({ dynamic: true }),
    description:
      `# **Resultado: ${colorEmoji} Número ${rolledNumber} (${winningColor.toUpperCase()})**\n\n` +
      `${SYMBOLS.ARROW} **Tu apuesta:** \`${bet} Coins\` a ${colorPick === 'rojo' ? '🔴 Rojo' : colorPick === 'negro' ? '⚫ Negro' : '🟢 Verde'}\n` +
      (won
        ? `${SYMBOLS.ARROW} **Premio ganado:** \`+${bet * multiplier} Coins\` *(Multiplicador x${multiplier})*\n`
        : `${SYMBOLS.ARROW} **Monedas perdidas:** \`-${bet} Coins\`\n`) +
      `${SYMBOLS.ARROW} **Saldo restante:** \`${newBalance} 🪙 Nebula Coins\``,
    footerText: 'Nebula Casino & Economy • ¡Juega con responsabilidad!'
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`btn_ruleta_repeat_${bet}_rojo`)
      .setLabel(`Rojo (${bet} 🪙)`)
      .setEmoji('🔴')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`btn_ruleta_repeat_${bet}_negro`)
      .setLabel(`Negro (${bet} 🪙)`)
      .setEmoji('⚫')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`btn_ruleta_repeat_${bet}_verde`)
      .setLabel(`Verde x14 (${bet} 🪙)`)
      .setEmoji('🟢')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('btn_view_my_perfil')
      .setLabel('Mi Saldo')
      .setEmoji('🪙')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ruleta')
    .setDescription('Apuesta tus Nebula Coins en la ruleta estelar con botones táctiles')
    .addIntegerOption(opt =>
      opt
        .setName('apuesta')
        .setDescription('Cantidad de Nebula Coins que deseas apostar')
        .setMinValue(10)
        .setMaxValue(50000)
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt
        .setName('color')
        .setDescription('Color al que apuestas: Rojo (x2), Negro (x2) o Verde Cósmico (x14)')
        .setRequired(true)
        .addChoices(
          { name: '🔴 Rojo (Multiplicador x2)', value: 'rojo' },
          { name: '⚫ Negro (Multiplicador x2)', value: 'negro' },
          { name: '🟢 Verde Cósmico 0 (Premio x14)', value: 'verde' }
        )
    ),

  runRuletaGame,

  async execute(interaction) {
    const bet = interaction.options.getInteger('apuesta');
    const colorPick = interaction.options.getString('color');

    const result = runRuletaGame(interaction.client, interaction.guildId, interaction.user, bet, colorPick);

    if (result.error) {
      return await interaction.reply({ content: result.error, ephemeral: true });
    }

    return await interaction.reply(result);
  }
};
