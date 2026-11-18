// ============================================================
// Comando /benchmark - Sneak Peek Técnico Rust vs Electron
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed, createProgressBar } = require('../utils/theme');

function buildBenchmarkPayload(client) {
  // Mediciones internas de laboratorio Nebula
  const ramRust = 37;      // MB
  const ramElectron = 280; // MB
  const sizeRust = 4.5;    // MB
  const sizeElectron = 210;// MB
  const bootRust = 0.18;   // s
  const bootElectron = 2.85;// s

  const ramBarRust = createProgressBar(ramRust, ramElectron, 10);
  const ramBarElectron = createProgressBar(ramElectron, ramElectron, 10);

  const embed = createNebulaEmbed(client, {
    color: COLORS.PRIMARY,
    title: '📊 Sneak Peek Técnico | Próxima Edición de Nebula Launcher en Rust',
    url: 'https://nebuladevstudios.com/launcher.html',
    description:
      `>>> **Adelanto exclusivo de la próxima generación de Nebula Launcher (En Desarrollo Interno).**\n` +
      `Actualmente estamos trabajando en la reconstrucción completa del núcleo a **Rust nativo** (aún no publicada públicamente). Aquí tienes la comparativa técnica de nuestras pruebas internas frente a la versión actual:`,
    fields: [
      {
        name: '💾 Consumo de Memoria RAM (-86.8%)',
        value:
          `🦀 **Próxima Edición (Rust):** \`${ramRust} MB\`\n${ramBarRust}\n` +
          `⚛️ **Versión Actual (Electron):** \`${ramElectron} MB\`\n${ramBarElectron}`,
        inline: false
      },
      {
        name: '📦 Tamaño del Ejecutable (-97.8%)',
        value:
          `🦀 **Próxima Edición:** \`${sizeRust} MB\` *(binario compilado nativo)*\n` +
          `⚛️ **Versión Actual:** \`${sizeElectron} MB\` *(empaquetado Chromium + Node)*`,
        inline: false
      },
      {
        name: '⚡ Tiempo de Inicio en Frío (15.8x más veloz)',
        value:
          `🦀 **Rust:** \`~${bootRust}s\` *(arranque instantáneo)*\n` +
          `⚛️ **Actual:** \`~${bootElectron}s\` *(inicialización del motor V8)*`,
        inline: true
      },
      {
        name: '⚙️ Arquitectura & Base',
        value:
          `🦀 **Rust:** Win32 + WebView2 (WRY)\n` +
          `⚛️ **Actual:** Node.js + Blink Chromium`,
        inline: true
      },
      {
        name: '🛠️ Estado del Proyecto',
        value:
          `🧪 **Fase:** Desarrollo y pruebas internas\n` +
          `📢 **Lanzamiento:** Próximamente`,
        inline: true
      }
    ],
    footerText: 'Nebula Lab Telemetry • Vista previa interna • Próximamente público'
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Descargar Versión Actual (v5.0.8)')
      .setStyle(ButtonStyle.Link)
      .setEmoji('📦')
      .setURL('https://github.com/fonduev/astral-nebula-launcher/releases/download/v5.0.8/Nebula.Launcher.Setup.5.0.8.exe'),
    new ButtonBuilder()
      .setLabel('Web Oficial')
      .setStyle(ButtonStyle.Link)
      .setEmoji('🌐')
      .setURL('https://nebuladevstudios.com/launcher.html'),
    new ButtonBuilder()
      .setLabel('GitHub Oficial')
      .setStyle(ButtonStyle.Link)
      .setEmoji('🐙')
      .setURL('https://github.com/fonduev/astral-nebula-launcher')
  );

  return { embeds: [embed], components: [row] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('benchmark')
    .setDescription('Vista previa y comparativa técnica de la próxima versión en Rust (en desarrollo) vs la actual'),

  buildBenchmarkPayload,

  async execute(interaction) {
    const payload = buildBenchmarkPayload(interaction.client);
    await interaction.reply(payload);
  }
};
