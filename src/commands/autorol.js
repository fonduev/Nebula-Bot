// ============================================================
// Comando /autorol - Roles por Botones (Reaction Roles Modernos)
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorol')
    .setDescription('Crea un botón para que los miembros se auto-asignen o quiten un rol con 1 clic')
    .addRoleOption(opt =>
      opt.setName('rol')
        .setDescription('El rol que otorgará este botón')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('titulo')
        .setDescription('Título del panel (ej: Rol de Notificaciones / Jugador)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('descripcion')
        .setDescription('Texto explicativo del rol')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Permiso Denegado',
            description: '> No posees la facultad (`Gestionar Roles`) para configurar paneles de auto-roles.'
          })
        ],
        ephemeral: true
      });
    }

    const role = interaction.options.getRole('rol');
    const title = interaction.options.getString('titulo') || `Auto-Rol: ${role.name}`;
    const desc = interaction.options.getString('descripcion') || `Haz clic en el botón inferior para obtener o quitarte el rol **${role.name}**.`;

    const myHighest = interaction.guild.members.me.roles.highest.position;
    if (role.position >= myHighest) {
      return await interaction.reply({
        content: `❌ No puedo gestionar el rol ${role} porque está por encima o igual a mi rol más alto en la jerarquía del servidor. Por favor sube mi rol en los Ajustes del Servidor.`,
        ephemeral: true
      });
    }

    const embed = createNebulaEmbed(interaction.client, {
      color: role.color || COLORS.PRIMARY,
      title: `🎭 ${title}`,
      description:
        `>>> ${desc}\n\n` +
        `${SYMBOLS.ARROW} **Rol Asignado:** ${role}\n` +
        `${SYMBOLS.ARROW} **Tipo:** Toggle automático (1 Clic)`,
      footerText: 'Nebula Auto-Roles • Haz clic para alternar'
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`btn_autorole_${role.id}`)
        .setLabel(`Obtener / Quitar ${role.name}`)
        .setEmoji('🎭')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};
