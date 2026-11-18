// ============================================================
// Comando /8ball - Oráculo Cósmico Místico
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

const RESPUESTAS = [
  { text: 'Definitivamente sí, las estrellas se han alineado a tu favor.', type: 'positive' },
  { text: 'Sin ninguna duda, el cosmos respalda esa idea.', type: 'positive' },
  { text: 'Es completamente seguro y garantizado.', type: 'positive' },
  { text: 'Puedes contar con ello al 100%.', type: 'positive' },
  { text: 'Todo apunta a un desenlace glorioso.', type: 'positive' },
  { text: 'Las constelaciones de Nebula brillan con una confirmación absoluta.', type: 'positive' },
  { text: 'Las señales del espacio son confusas, prueba consultar en otro momento.', type: 'neutral' },
  { text: 'Es mejor que no conozcas la respuesta aún.', type: 'neutral' },
  { text: 'El futuro está en movimiento, concéntrate y vuelve a preguntar.', type: 'neutral' },
  { text: 'Hay una fuerte interferencia en el hiperespacio, no puedo predecirlo.', type: 'neutral' },
  { text: 'No cuentes con ello bajo ninguna circunstancia.', type: 'negative' },
  { text: 'Mi veredicto cósmico es un rotundo y contundente NO.', type: 'negative' },
  { text: 'Mis fuentes espaciales dicen que las probabilidades son nulas.', type: 'negative' },
  { text: 'Ni siquiera instalando Sodium podrías salvar ese resultado.', type: 'negative' }
];

function answer8Ball(client, user, question) {
  const pick = RESPUESTAS[Math.floor(Math.random() * RESPUESTAS.length)];

  const colorMap = {
    positive: COLORS.SUCCESS,
    neutral: COLORS.GOLD,
    negative: COLORS.ERROR
  };

  const iconMap = {
    positive: '✨',
    neutral: '🔮',
    negative: '☄️'
  };

  const embed = createNebulaEmbed(client, {
    color: colorMap[pick.type],
    title: '🎱 Bola 8 Mágica | Oráculo del Cosmos',
    description:
      `>>> 👤 **Pregunta Planteada:**\n\`${question}\`\n\n` +
      `${iconMap[pick.type]} **Respuesta del Oráculo:**\n> **${pick.text}**`,
    footerText: `Consultado por ${user.tag || user.username} • Oráculo Cósmico`
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_8ball_ask')
      .setLabel('Preguntar de Nuevo')
      .setEmoji('🔮')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('btn_moneda_again')
      .setLabel('Lanzar Moneda')
      .setEmoji('🪙')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Hazle una pregunta de Sí o No al oráculo cósmico de Nebula con controles táctiles')
    .addStringOption(option =>
      option.setName('pregunta').setDescription('¿Qué misterio deseas consultar con el cosmos?').setRequired(true)
    ),

  answer8Ball,

  async execute(interaction) {
    const question = interaction.options.getString('pregunta');
    const result = answer8Ball(interaction.client, interaction.user, question);
    await interaction.reply(result);
  }
};
