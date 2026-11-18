// ============================================================
// Comando /unwarn - Remover Advertencias de un Miembro
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');
const { removeWarn, getGuildWarns } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Elimina una o todas las advertencias de un miembro')
    .addUserOption(opt =>
      opt.setName('usuario')
        .setDescription('El miembro al que se le removerá la advertencia')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('id')
        .setDescription('ID de la advertencia (ej: #LX8J o escribe "todas")')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Permiso Denegado',
            description: '> No posees permisos de moderación (`Moderar Miembros`) para remover advertencias.'
          })
        ],
        ephemeral: true
      });
    }

    const targetUser = interaction.options.getUser('usuario');
    const warnId = interaction.options.getString('id');

    const cleanId = warnId ? warnId.replace('#', '').trim() : null;
    const removed = removeWarn(interaction.guildId, targetUser.id, cleanId);

    if (!removed) {
      return await interaction.reply({
        content: `❌ No se encontró ninguna advertencia con el ID \`${warnId || 'especificado'}\` para ${targetUser}.`,
        ephemeral: true
      });
    }

    const remainingWarns = (getGuildWarns(interaction.guildId)[targetUser.id] || []).length;

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.SUCCESS,
      title: '✅ Advertencia Removida',
      thumbnail: targetUser.displayAvatarURL({ dynamic: true }),
      description:
        `>>> Se ha limpiado el historial disciplinario de ${targetUser}.\n\n` +
        `${SYMBOLS.ARROW} **Usuario:** ${targetUser} (\`${targetUser.tag}\`)\n` +
        `${SYMBOLS.ARROW} **Moderador:** ${interaction.user}\n` +
        `${SYMBOLS.ARROW} **Advertencias restantes:** \`${remainingWarns}\``,
      footerText: 'Nebula Moderation Core • Registro Actualizado'
    });

    await interaction.reply({ embeds: [embed] });
  }
};
