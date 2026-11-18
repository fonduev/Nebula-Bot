// ============================================================
// Comando /launcher - Información & Descargas Oficiales
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('launcher')
    .setDescription('Obtén descargas oficiales verificadas de Nebula Launcher v5.0.8 y un adelanto de novedades'),

  async execute(interaction) {
    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.SECONDARY,
      title: '🚀 Nebula Launcher v5.0.8 | El Cosmos de Minecraft',
      url: 'https://nebuladevstudios.com/launcher.html',
      description:
        `>>> **El cliente definitivo de alto rendimiento para Minecraft.**\n` +
        `Diseñado para ofrecer máxima compatibilidad con modpacks, aislamiento de mundos y una experiencia fluida.\n\n` +
        `${SYMBOLS.STAR} **Arranque Rápido:** Carga instancias complejas y modpacks en segundos.\n` +
        `${SYMBOLS.STAR} **Discord Rich Presence:** Presencia enriquecida en tiempo real que muestra tu servidor y bioma.\n` +
        `${SYMBOLS.STAR} **Gestor de Java Automático:** Detección de Java 8, 17 y 21 LTS sin complicaciones.\n` +
        `${SYMBOLS.STAR} **Aislamiento Total:** Evita corrupción de mundos y mods entre versiones de Minecraft.`,
      fields: [
        {
          name: '📦 Versión Pública Actual',
          value: '`v5.0.8 (Estable Oficial)`',
          inline: true
        },
        {
          name: '💻 Compatibilidad',
          value: '`Windows 10/11 & Linux`',
          inline: true
        },
        {
          name: '🛡️ Seguridad',
          value: '`100% Limpio (0% Bloatware)`',
          inline: true
        },
        {
          name: '🎮 Motores Soportados',
          value: '`Fabric` • `Forge` • `NeoForge` • `Vanilla` • `Quilt`',
          inline: false
        },
        {
          name: '🦀 Próxima Gran Actualización (En Desarrollo)',
          value:
            'Estamos construyendo la nueva arquitectura nativa en **Rust** (4.5 MB, ~37 MB RAM y arranque en <0.2s).\n' +
            '*Usa `/benchmark` o pulsa el botón inferior para ver el adelanto técnico.*',
          inline: false
        }
      ],
      footerText: 'Nebula Dev Studios • Descargas Oficiales Verificadas'
    });

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Instalador Windows (.exe)')
        .setStyle(ButtonStyle.Link)
        .setEmoji('🪟')
        .setURL('https://github.com/fonduev/astral-nebula-launcher/releases/download/v5.0.8/Nebula.Launcher.Setup.5.0.8.exe'),
      new ButtonBuilder()
        .setLabel('Versión Portable (.zip)')
        .setStyle(ButtonStyle.Link)
        .setEmoji('📦')
        .setURL('https://github.com/fonduev/astral-nebula-launcher/releases/download/v5.0.8/Nebula-Launcher-v5.0.8-Portable.zip'),
      new ButtonBuilder()
        .setLabel('Linux (.tar.gz)')
        .setStyle(ButtonStyle.Link)
        .setEmoji('🐧')
        .setURL('https://github.com/fonduev/astral-nebula-launcher/releases/download/v5.0.8/Nebula-Launcher-v5.0.8-Linux-x64.tar.gz')
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_launcher_specs')
        .setLabel('Sneak Peek: Próxima Edición Rust')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🦀'),
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

    await interaction.reply({ embeds: [embed], components: [row1, row2] });
  }
};
