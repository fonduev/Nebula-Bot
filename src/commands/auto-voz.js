// ============================================================
// Comando /auto-voz - Configurador de Salas de Voz Temporales
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');
const { setGuildConfig, getGuildConfig } = require('../utils/database');

function createAutoVoiceButtons(isActive) {
  const row = new ActionRowBuilder();
  if (isActive) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('voice_btn_disable_autovoz')
        .setLabel('Desactivar Auto-Voz')
        .setEmoji('🔴')
        .setStyle(ButtonStyle.Danger)
    );
  }
  return row.components.length > 0 ? [row] : [];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('auto-voz')
    .setDescription('Configura o desactiva el canal para la creación automática de salas de voz temporales')
    .addChannelOption(opt =>
      opt
        .setName('canal')
        .setDescription('El canal de voz que actuará como disparador (ej: ➕ Crear Sala)')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(false)
    )
    .addBooleanOption(opt =>
      opt
        .setName('desactivar')
        .setDescription('Desactiva inmediatamente el sistema de salas de voz temporales')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  createAutoVoiceButtons,

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Permiso Denegado',
            description: '> No posees la facultad (`Gestionar Canales`) para configurar las salas automáticas de voz.'
          })
        ],
        ephemeral: true
      });
    }

    const disable = interaction.options.getBoolean('desactivar');
    const channel = interaction.options.getChannel('canal');
    const currentConfig = getGuildConfig(interaction.guildId);

    // 1. Desactivación explícita mediante parámetro
    if (disable) {
      setGuildConfig(interaction.guildId, {
        autoVoiceChannelId: null
      });

      const embed = createNebulaEmbed(interaction.client, {
        color: COLORS.WARNING,
        title: '🔇 Sistema de Auto-Voz Desactivado',
        description:
          `>>> El sistema de salas temporales (*Join to Create*) ha sido **desactivado** con éxito en este servidor.\n\n` +
          `${SYMBOLS.ARROW} Ya no se crearán canales temporales automáticos al unirse al canal anterior.\n` +
          `${SYMBOLS.ARROW} Para reactivarlo cuando quieras, usa \`/auto-voz canal:#canal\`.`,
        footerText: 'Nebula Auto-Voice Engine • Desactivado'
      });

      return await interaction.reply({ embeds: [embed] });
    }

    // 2. Activación o actualización de canal disparador
    if (channel) {
      setGuildConfig(interaction.guildId, {
        autoVoiceChannelId: channel.id
      });

      const embed = createNebulaEmbed(interaction.client, {
        color: COLORS.SUCCESS,
        title: '🔊 Sistema de Auto-Voz Activado',
        description:
          `>>> El sistema de salas de voz temporales (*Join to Create*) ha sido configurado con éxito.\n\n` +
          `${SYMBOLS.ARROW} **Canal disparador:** ${channel} (\`${channel.id}\`)\n` +
          `${SYMBOLS.ARROW} **Funcionamiento:** Cuando un miembro entre a este canal, Nebula Bot le creará una sala privada al instante y la borrará automáticamente al quedar vacía.\n` +
          `${SYMBOLS.ARROW} **Panel Táctil:** Al crearse la sala, el usuario recibirá botones táctiles interactivos dentro del chat de la sala.\n` +
          `${SYMBOLS.ARROW} **Comandos de sala:** Los miembros pueden usar \`/sala\` (bloquear, límite, bitrate, etc.).\n\n` +
          `*Puedes desactivarlo en cualquier momento pulsando el botón rojo inferior o con \`/auto-voz desactivar:True\`.*`,
        footerText: 'Nebula Auto-Voice Engine • Canales Dinámicos'
      });

      return await interaction.reply({
        embeds: [embed],
        components: createAutoVoiceButtons(true)
      });
    }

    // 3. Consulta de estado si no se pasaron opciones
    const activeChannelId = currentConfig.autoVoiceChannelId;
    if (activeChannelId) {
      const activeChannel = interaction.guild.channels.cache.get(activeChannelId);
      const embed = createNebulaEmbed(interaction.client, {
        color: COLORS.PRIMARY,
        title: '🔊 Estado del Sistema de Auto-Voz',
        description:
          `>>> El sistema de salas de voz temporales se encuentra actualmente **ACTIVO**.\n\n` +
          `${SYMBOLS.ARROW} **Canal disparador actual:** ${activeChannel ? activeChannel : `<#${activeChannelId}>`} (\`${activeChannelId}\`)\n` +
          `${SYMBOLS.ARROW} **Para cambiar de canal:** Usa \`/auto-voz canal:#nuevo-canal\`\n` +
          `${SYMBOLS.ARROW} **Para apagarlo:** Pulsa el botón inferior o usa \`/auto-voz desactivar:True\`.`,
        footerText: 'Nebula Auto-Voice Engine • Gestión'
      });

      return await interaction.reply({
        embeds: [embed],
        components: createAutoVoiceButtons(true)
      });
    } else {
      const embed = createNebulaEmbed(interaction.client, {
        color: COLORS.SECONDARY,
        title: '🔇 Sistema de Auto-Voz Inactivo',
        description:
          `>>> Actualmente no hay ningún canal configurado para salas de voz temporales.\n\n` +
          `${SYMBOLS.ARROW} **Para activarlo:** Ejecuta \`/auto-voz canal:#canal-de-voz\` indicando el canal disparador (ej. *➕ Crear Sala*).`,
        footerText: 'Nebula Auto-Voice Engine • Inactivo'
      });

      return await interaction.reply({ embeds: [embed] });
    }
  }
};
