// ============================================================
// Nebula Bot - Sistema de Diseño y Estilos Cósmicos
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const COLORS = {
  PRIMARY: 0x8b5cf6,   // Púrpura Nebular
  SECONDARY: 0x38bdf8, // Azul / Cian Eléctrico
  ACCENT: 0xec4899,    // Rosa Cósmico
  SUCCESS: 0x10b981,   // Esmeralda / En Línea
  WARNING: 0xf59e0b,   // Ámbar / Alerta
  ERROR: 0xef4444,     // Rojo Carmesí / Error
  DARK: 0x1e1b4b,      // Espacio Profundo
  GOLD: 0xfbbf24,      // Oro Estelar
  MINECRAFT: 0x22c55e  // Verde Césped Minecraft
};

const SYMBOLS = {
  STAR: '✦',
  DIAMOND: '◈',
  ARROW: '▹',
  DOT: '•',
  LINE: '─'.repeat(28),
  CHECK: '✅',
  CROSS: '❌',
  WARN: '⚠️',
  FIRE: '🔥',
  SHIELD: '🛡️',
  ROCKET: '🚀',
  SWORD: '⚔️',
  PICKAXE: '⛏️'
};

/**
 * Crea una barra de progreso visual con caracteres Unicode
 * @param {number} current Valor actual
 * @param {number} max Valor máximo
 * @param {number} size Longitud de la barra (por defecto 10)
 * @returns {string} Barra formateada ej: [▰▰▰▰▱▱▱▱▱▱] 40%
 */
function createProgressBar(current, max, size = 10) {
  if (!max || max <= 0) return '`[▱▱▱▱▱▱▱▱▱▱] 0%`';
  const percentage = Math.min(Math.max(current / max, 0), 1);
  const filled = Math.round(size * percentage);
  const empty = size - filled;
  const bar = '▰'.repeat(filled) + '▱'.repeat(empty);
  return `\`[${bar}] ${Math.round(percentage * 100)}%\``;
}

/**
 * Construye un Embed con el branding oficial cósmico de Nebula
 * @param {object} client Instancia del cliente Discord
 * @param {object} options Opciones del embed
 * @returns {EmbedBuilder}
 */
function createNebulaEmbed(client, options = {}) {
  const embed = new EmbedBuilder()
    .setColor(options.color || COLORS.PRIMARY)
    .setFooter({
      text: options.footerText || 'Nebula Dev Studios • nebuladevstudios.com',
      iconURL: client.user.displayAvatarURL()
    })
    .setTimestamp();

  if (options.author !== false) {
    embed.setAuthor({
      name: options.authorName || 'NEBULA DEV STUDIOS',
      iconURL: client.user.displayAvatarURL(),
      url: 'https://nebuladevstudios.com'
    });
  }

  if (options.title) embed.setTitle(options.title);
  if (options.url) embed.setURL(options.url);
  if (options.description) embed.setDescription(options.description);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.fields) embed.addFields(options.fields);

  return embed;
}

/**
 * Botones estándar de navegación y enlaces oficiales
 */
function createOfficialButtonsRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Invitar Bot')
      .setStyle(ButtonStyle.Link)
      .setEmoji('➕')
      .setURL('https://discord.com/oauth2/authorize?client_id=1565335954284224622&permissions=8&integration_type=0&scope=bot+applications.commands'),
    new ButtonBuilder()
      .setLabel('Web Oficial')
      .setStyle(ButtonStyle.Link)
      .setEmoji('🌐')
      .setURL('https://nebuladevstudios.com'),
    new ButtonBuilder()
      .setLabel('Nebula Launcher')
      .setStyle(ButtonStyle.Link)
      .setEmoji('🚀')
      .setURL('https://nebuladevstudios.com/launcher.html'),
    new ButtonBuilder()
      .setLabel('Discord')
      .setStyle(ButtonStyle.Link)
      .setEmoji('💬')
      .setURL('https://discord.gg/cfE254mQHZ'),
    new ButtonBuilder()
      .setLabel('GitHub')
      .setStyle(ButtonStyle.Link)
      .setEmoji('🐙')
      .setURL('https://github.com/fonduev/Nebula-Bot')
  );
}

module.exports = {
  COLORS,
  SYMBOLS,
  createProgressBar,
  createNebulaEmbed,
  createOfficialButtonsRow
};
