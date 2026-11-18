// ============================================================
// Comando /bienvenida - Sistema Cósmico de Bienvenida & Auto-Rol
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
const { setGuildConfig } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bienvenida')
    .setDescription('Configura el canal de bienvenida para nuevos miembros y asignación automática de rol')
    .addChannelOption(opt =>
      opt
        .setName('canal')
        .setDescription('Canal público donde se saludarán a los nuevos miembros (ej: #bienvenida)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addRoleOption(opt =>
      opt
        .setName('rol')
        .setDescription('Rol que se entregará automáticamente al ingresar (opcional, ej: Miembro)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Permiso Denegado',
            description: '> No posees la facultad (`Gestionar Servidor`) para configurar las bienvenidas.'
          })
        ],
        ephemeral: true
      });
    }

    const channel = interaction.options.getChannel('canal');
    const role = interaction.options.getRole('rol');

    if (role) {
      const myHighest = interaction.guild.members.me.roles.highest.position;
      if (role.position >= myHighest) {
        return await interaction.reply({
          content: `❌ El rol ${role} está por encima o igual a mi rol más alto. Sube mi rol en los Ajustes del Servidor.`,
          ephemeral: true
        });
      }
    }

    setGuildConfig(interaction.guildId, {
      welcomeChannelId: channel.id,
      welcomeRoleId: role ? role.id : null
    });

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.SUCCESS,
      title: '🌌 Sistema de Bienvenida Activado',
      description:
        `>>> ¡Las nuevas llegadas al cosmos de **${interaction.guild.name}** serán recibidas oficialmente!\n\n` +
        `${SYMBOLS.ARROW} **Canal asignado:** ${channel}\n` +
        `${SYMBOLS.ARROW} **Auto-Rol inicial:** ${role ? role : '*Ninguno asignado*'}\n` +
        `${SYMBOLS.ARROW} **Contenido:** Tarjeta estética con avatar del usuario, normas del servidor y recuento de miembros.`,
      footerText: 'Nebula Welcome Engine • Integración Comunitaria'
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_welcome_test')
        .setLabel('Probar Bienvenida')
        .setEmoji('👁️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('btn_welcome_disable')
        .setLabel('Desactivar')
        .setEmoji('🔴')
        .setStyle(ButtonStyle.Danger)
    );

    return await interaction.reply({ embeds: [embed], components: [row] });
  }
};
