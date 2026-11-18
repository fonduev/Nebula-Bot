// ============================================================
// Comando /ban - Sanción Permanente
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Banea permanentemente a un usuario del servidor (Moderación)')
    .addUserOption(option =>
      option.setName('usuario').setDescription('El usuario que deseas banear').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('razon').setDescription('Motivo de la sanción').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.BanMembers)) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Permiso Denegado',
            description: '> No posees la facultad (`Banear Miembros`) para ejecutar este comando.'
          })
        ],
        ephemeral: true
      });
    }

    const targetUser = interaction.options.getUser('usuario');
    const reason = interaction.options.getString('razon') || 'Infracción grave de las normas';
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (member && !member.bannable) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Jerarquía Insuficiente',
            description: '> No puedo banear a este usuario porque su rol es igual o superior al rol del bot.'
          })
        ],
        ephemeral: true
      });
    }

    await interaction.guild.bans.create(targetUser.id, { reason });

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.ERROR,
      title: '🔨 Usuario Baneado Permanentemente',
      thumbnail: targetUser.displayAvatarURL({ dynamic: true }),
      description:
        `>>> **La sanción de ban permanente ha sido aplicada.**\n\n` +
        `${SYMBOLS.ARROW} **Usuario:** ${targetUser.tag} (\`${targetUser.id}\`)\n` +
        `${SYMBOLS.ARROW} **Moderador:** ${interaction.user.tag}\n` +
        `${SYMBOLS.ARROW} **Motivo:** ${reason}`,
      footerText: 'Nebula Moderation Core • Ban Definitivo'
    });

    await interaction.reply({ embeds: [embed] });
  }
};
