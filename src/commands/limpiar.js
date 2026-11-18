// ============================================================
// Comando /limpiar - Purgado de Mensajes
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('limpiar')
    .setDescription('Elimina una cantidad determinada de mensajes del canal actual (Moderación)')
    .addIntegerOption(option =>
      option
        .setName('cantidad')
        .setDescription('Número de mensajes a eliminar (entre 1 y 100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger('cantidad');

    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Permiso Denegado',
            description: '> No posees los permisos requeridos (`Gestionar Mensajes`) para ejecutar esta acción.'
          })
        ],
        ephemeral: true
      });
    }

    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);

      const embed = createNebulaEmbed(interaction.client, {
        color: COLORS.SUCCESS,
        title: '🧹 Limpieza de Chat Completada',
        description:
          `>>> **Se han eliminado exitosamente \`${deleted.size}\` mensajes del canal.**\n\n` +
          `${SYMBOLS.ARROW} **Moderador:** ${interaction.user.tag}\n` +
          `${SYMBOLS.ARROW} **Canal:** <#${interaction.channel.id}>\n` +
          `${SYMBOLS.ARROW} **Mensajes Solicitados:** \`${amount}\` • **Borrados:** \`${deleted.size}\``,
        footerText: 'Nebula Moderation Core • Registro Automático'
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Inconveniente en la Purga',
            description: '> No se pudieron borrar algunos mensajes. Recuerda que la API de Discord restringe la eliminación en lote de mensajes con más de **14 días de antigüedad**.'
          })
        ],
        ephemeral: true
      });
    }
  }
};
