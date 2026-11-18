// ============================================================
// Comando /kick - Expulsión de Miembro
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsa a un usuario del servidor con registro de motivo (Moderación)')
    .addUserOption(option =>
      option.setName('usuario').setDescription('El miembro que deseas expulsar').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('razon').setDescription('Motivo de la expulsión').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.KickMembers)) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Permiso Denegado',
            description: '> No posees la facultad (`Expulsar Miembros`) para ejecutar este comando.'
          })
        ],
        ephemeral: true
      });
    }

    const targetUser = interaction.options.getUser('usuario');
    const reason = interaction.options.getString('razon') || 'Infracción al reglamento de la comunidad';
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Miembro Inaccesible',
            description: '> El usuario especificado no pertenece a este servidor.'
          })
        ],
        ephemeral: true
      });
    }

    if (!member.kickable) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Jerarquía Insuficiente',
            description: '> No puedo expulsar a este usuario porque su rol más alto es superior o equivalente al rol del bot.'
          })
        ],
        ephemeral: true
      });
    }

    await member.kick(reason);

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.WARNING,
      title: '👢 Miembro Expulsado del Servidor',
      thumbnail: targetUser.displayAvatarURL({ dynamic: true }),
      description:
        `>>> **El usuario ha sido expulsado exitosamente.**\n\n` +
        `${SYMBOLS.ARROW} **Usuario:** ${targetUser.tag} (\`${targetUser.id}\`)\n` +
        `${SYMBOLS.ARROW} **Moderador:** ${interaction.user.tag}\n` +
        `${SYMBOLS.ARROW} **Motivo:** ${reason}`,
      footerText: 'Nebula Moderation Core • Acción Registrada'
    });

    await interaction.reply({ embeds: [embed] });
  }
};
