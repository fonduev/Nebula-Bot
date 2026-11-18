// ============================================================
// Comando /roles - Jerarquía de Roles
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roles')
    .setDescription('Muestra la lista de roles del servidor y la cantidad de miembros en cada uno'),

  async execute(interaction) {
    if (!interaction.guild) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Ámbito Inválido',
            description: '> Este comando solo puede ser ejecutado dentro de un servidor.'
          })
        ],
        ephemeral: true
      });
    }

    const roles = interaction.guild.roles.cache
      .filter(r => r.name !== '@everyone')
      .sort((a, b) => b.position - a.position);

    const rolesList = roles.map(r => `${r.toString()} • \`${r.members.size} miembro(s)\``).slice(0, 20).join('\n');

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.SECONDARY,
      title: `🛡️ Jerarquía de Roles del Servidor (${roles.size})`,
      thumbnail: interaction.guild.iconURL({ dynamic: true }) || interaction.client.user.displayAvatarURL(),
      description:
        `>>> **Estructura de permisos y rangos de ${interaction.guild.name}.**\n\n` +
        (rolesList || '*No hay roles personalizados configurados en este servidor.*'),
      footerText: `Nebula Core • Servidor: ${interaction.guild.name}`
    });

    if (roles.size > 20) {
      embed.addFields({
        name: '📌 Visualización Parcial',
        value: `Se muestran los 20 roles principales de un total de **${roles.size}** configurados.`
      });
    }

    await interaction.reply({ embeds: [embed] });
  }
};
