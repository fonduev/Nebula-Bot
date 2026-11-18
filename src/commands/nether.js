// ============================================================
// Comando /nether - Calculadora de Sincronización de Portales
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

function buildNetherPayload(client, x, z, direction = 'to_nether') {
  let targetX, targetZ, fromName, toName, ruleText, ratio;

  if (direction === 'to_nether') {
    targetX = Math.round(x / 8);
    targetZ = Math.round(z / 8);
    fromName = '🌍 Superficie (Overworld)';
    toName = '🔥 Inframundo (Nether)';
    ruleText = 'Dividir X y Z entre 8';
    ratio = '1 bloque en el Nether = 8 bloques en el Overworld';
  } else {
    targetX = Math.round(x * 8);
    targetZ = Math.round(z * 8);
    fromName = '🔥 Inframundo (Nether)';
    toName = '🌍 Superficie (Overworld)';
    ruleText = 'Multiplicar X y Z por 8';
    ratio = '8 bloques en el Overworld = 1 bloque en el Nether';
  }

  const embed = createNebulaEmbed(client, {
    color: direction === 'to_nether' ? 0xd97706 : 0x10b981,
    title: '🌀 Calculadora de Portales de Minecraft',
    description:
      `>>> **Conversión:** ${fromName} ➔ ${toName}\n\n` +
      `### 📍 Coordenadas de Origen:\n` +
      `${SYMBOLS.ARROW} **X:** \`${x}\` • **Z:** \`${z}\`\n\n` +
      `### 🎯 Coordenadas Exactas del Portal Destino:\n` +
      `${SYMBOLS.ARROW} **X:** \`${targetX}\`\n` +
      `${SYMBOLS.ARROW} **Y:** \`64\` *(o en el techo del Nether Y=120+)*\n` +
      `${SYMBOLS.ARROW} **Z:** \`${targetZ}\`\n\n` +
      `### 💡 Consejos de Enlace de Portales:\n` +
      `• **Regla Matemática:** \`${ruleText}\` (${ratio}).\n` +
      `• **Radio de Detección:** El juego busca portales existentes en un radio de 128 bloques. Si dos portales están muy cerca, constrúyelos en estas coordenadas exactas para evitar que se crucen con bases de otros jugadores.\n` +
      `• **Autopistas de Hielo:** Crea caminos de Hielo Azul (*Blue Ice*) en el Nether a la altura calculada para viajar 8 veces más rápido con barcas.`,
    footerText: 'Nebula Minecraft Tools • Calculadora de Portales'
  });

  const nextDir = direction === 'to_nether' ? 'to_overworld' : 'to_nether';
  const nextDirLabel = direction === 'to_nether' ? 'Invertir: Nether ➔ Overworld' : 'Invertir: Overworld ➔ Nether';

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`btn_nether_flip_${x}_${z}_${nextDir}`)
      .setLabel(nextDirLabel)
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nether')
    .setDescription('Calcula coordenadas para sincronizar portales entre Overworld y Nether con botones interactivos')
    .addNumberOption(opt =>
      opt.setName('x')
        .setDescription('Coordenada X actual')
        .setRequired(true)
    )
    .addNumberOption(opt =>
      opt.setName('z')
        .setDescription('Coordenada Z actual')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('direccion')
        .setDescription('Dirección de la conversión')
        .addChoices(
          { name: 'Overworld ➔ Nether (Divide entre 8)', value: 'to_nether' },
          { name: 'Nether ➔ Overworld (Multiplica por 8)', value: 'to_overworld' }
        )
        .setRequired(false)
    ),

  buildNetherPayload,

  async execute(interaction) {
    const x = interaction.options.getNumber('x');
    const z = interaction.options.getNumber('z');
    const direction = interaction.options.getString('direccion') || 'to_nether';

    const payload = buildNetherPayload(interaction.client, x, z, direction);
    await interaction.reply(payload);
  }
};
