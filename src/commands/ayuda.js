// ============================================================
// Comando /ayuda - Centro de Control Interactivo
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed, createOfficialButtonsRow } = require('../utils/theme');

function getMainHelpEmbed(client) {
  return createNebulaEmbed(client, {
    color: COLORS.PRIMARY,
    title: '🌌 Centro de Control & Ayuda | Nebula Bot',
    description:
      `>>> **¡Bienvenido a Nebula Bot!** El ecosistema integral de Minecraft, música, soporte y comunidad gamer de **Nebula Dev Studios**.\n\n` +
      `${SYMBOLS.STAR} Explora **76 comandos slash (/)** organizados por categorías en el menú desplegable inferior.\n` +
      `${SYMBOLS.STAR} Incluye integración con **Nebula Launcher**, **Buscador de Mods Modrinth**, **Auto-Voz**, **Casino**, **Tickets**, **Embed Studio V2** y **Música** sin cortes.`,
    fields: [
      {
        name: '🚀 Nebula Launcher & Ecosistema (5)',
        value: '`/launcher` • `/benchmark` • `/changelog` • `/vincular` • `/reporte`\n*Descargas v5.0.8 oficiales, sneak peek de la próxima versión en Rust, notas de parches y vinculación.*',
        inline: false
      },
      {
        name: '⛏️ Herramientas de Minecraft en Vivo (8)',
        value: '`/servidor` • `/modsearch` • `/mcuser` • `/skin` • `/cabeza` • `/uuid` • `/mods` • `/color`\n*Ping Java & Bedrock, buscador Modrinth en vivo, perfiles Mojang 3D y optimización.*',
        inline: false
      },
      {
        name: '🎫 Sistema de Tickets & Embed Studio V2 (3)',
        value: '`/ticket-panel` • `/ticket` • `/embed`\n*Paneles interactivos, canales privados automatizados y diseñador visual Embed Studio V2.*',
        inline: false
      },
      {
        name: '🎵 Música & Canales de Voz (8)',
        value: '`/play` • `/buscar` • `/skip` • `/queue` • `/stop` • `/volume` • `/voz-info` • `/voz-mute`\n*YouTube, Spotify, selector de opciones cercanas con IA, colas y volumen en tiempo real.*',
        inline: false
      },
      {
        name: '🛡️ Moderación & Seguridad (6)',
        value: '`/limpiar` • `/anuncio` • `/kick` • `/ban` • `/timeout` • `/slowmode`\n*Protección, purga de mensajes y sanciones estructuradas con auditoría.*',
        inline: false
      },
      {
        name: '📊 Comunidad, Invitación & Diagnóstico (8)',
        value: '`/invitar` • `/serverinfo` • `/userinfo` • `/avatar` • `/roles` • `/botinfo` • `/ping` • `/ip`\n*Enlaces de invitación oficial para otros servidores, estadísticas y perfiles.*',
        inline: false
      },
      {
        name: '🎲 Minijuegos & Diversión (5)',
        value: '`/encuesta` • `/ppt` • `/8ball` • `/dado` • `/moneda`\n*Votaciones interactivas en vivo con barras de progreso y entretenimiento.*',
        inline: false
      }
    ],
    footerText: 'Nebula Bot • Selecciona una categoría para ver los comandos en detalle'
  });
}

function getHelpSelectMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help_category_select')
      .setPlaceholder('🪐 Selecciona una categoría de comandos...')
      .addOptions([
        {
          label: 'Menú Principal',
          description: 'Vista general y resumen de todas las funciones',
          value: 'help_home',
          emoji: '🏠'
        },
        {
          label: 'Nebula Launcher & Ecosistema',
          description: 'Descargas oficiales v5.0.8, sneak peek técnico de Rust y vinculación',
          value: 'help_launcher',
          emoji: '🚀'
        },
        {
          label: 'Herramientas de Minecraft',
          description: 'Servidores Java/Bedrock, Modrinth, perfiles mcuser, skins y cabezas',
          value: 'help_minecraft',
          emoji: '⛏️'
        },
        {
          label: 'Tickets & Embed Studio V2',
          description: 'Paneles de tickets, canales privados y diseñador de embeds interactivo',
          value: 'help_tickets_embeds',
          emoji: '🎫'
        },
        {
          label: 'Música & Canales de Voz',
          description: 'Reproductor de música, YouTube, Spotify, volumen y salas temporales',
          value: 'help_music_voice',
          emoji: '🎵'
        },
        {
          label: 'Moderación & Seguridad',
          description: 'Limpiar chat, comunicados, sanciones y control de usuarios',
          value: 'help_moderation',
          emoji: '🛡️'
        },
        {
          label: 'Comunidad & Diagnóstico',
          description: 'Info del servidor, usuarios, avatares, roles y velocímetro ping',
          value: 'help_community',
          emoji: '📊'
        },
        {
          label: 'Minijuegos & Diversión',
          description: 'Encuestas en vivo, piedra-papel-tijera, dados y oráculo 8ball',
          value: 'help_games',
          emoji: '🎲'
        }
      ])
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ayuda')
    .setDescription('Despliega el centro de control interactivo y guía completa de Nebula Bot'),

  getMainHelpEmbed,
  getHelpSelectMenu,

  async execute(interaction) {
    const embed = getMainHelpEmbed(interaction.client);
    const selectRow = getHelpSelectMenu();
    const buttonsRow = createOfficialButtonsRow();

    await interaction.reply({
      embeds: [embed],
      components: [selectRow, buttonsRow],
      flags: MessageFlags.Ephemeral
    });
  }
};
