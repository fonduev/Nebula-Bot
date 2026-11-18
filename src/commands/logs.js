// ============================================================
// Comando /logs - Registro de Auditoría y Seguridad en Tiempo Real
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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Configura o desactiva el canal de registros de seguridad y auditoría en tiempo real')
    .addChannelOption(opt =>
      opt
        .setName('canal')
        .setDescription('El canal privado para recibir registros de auditoría (ej: #logs)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addBooleanOption(opt =>
      opt
        .setName('desactivar')
        .setDescription('Establece en verdadero si deseas apagar el sistema de logs')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog),

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ViewAuditLog)) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Permiso Denegado',
            description: '> No posees la facultad (`Ver Registro de Auditoría`) para configurar los logs del servidor.'
          })
        ],
        ephemeral: true
      });
    }

    const disable = interaction.options.getBoolean('desactivar');
    if (disable) {
      setGuildConfig(interaction.guildId, { logChannelId: null });
      return await interaction.reply({
        content: '📴 El canal de registros de auditoría ha sido desactivado.',
        ephemeral: true
      });
    }

    const channel = interaction.options.getChannel('canal') || interaction.channel;

    setGuildConfig(interaction.guildId, { logChannelId: channel.id });

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.SUCCESS,
      title: '🛡️ Canal de Auditoría Configurado',
      description:
        `>>> El canal de registros de seguridad ha sido establecido en ${channel}.\n\n` +
        `${SYMBOLS.ARROW} **Eventos monitorizados:**\n` +
        `• 🗑️ Mensajes eliminados *(con autor y contenido original)*\n` +
        `• ✏️ Mensajes editados *(con comparativa antes/después)*\n` +
        `• 📥 Nuevos miembros *(con detección de cuentas sospechosas y fecha de creación)*\n` +
        `• 📤 Salidas y abandonos de miembros\n` +
        `• 🔊 Conexiones y cambios de canales de voz`,
      footerText: 'Nebula Audit Core • Registro de Seguridad 24/7'
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_disable_logs')
        .setLabel('Desactivar Logs')
        .setEmoji('🔴')
        .setStyle(ButtonStyle.Danger)
    );

    return await interaction.reply({ embeds: [embed], components: [row] });
  }
};
