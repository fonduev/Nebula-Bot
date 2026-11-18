// ============================================================
// Comando /timeout - Aislamiento Temporal
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Aísla / silencia temporalmente a un usuario para que no pueda interactuar (Moderación)')
    .addUserOption(option =>
      option.setName('usuario').setDescription('El usuario que deseas silenciar').setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('duracion')
        .setDescription('Tiempo del aislamiento')
        .setRequired(true)
        .addChoices(
          { name: '⏱️ 1 minuto', value: 60 },
          { name: '⏱️ 5 minutos', value: 300 },
          { name: '⏱️ 10 minutos', value: 600 },
          { name: '⏱️ 1 hora', value: 3600 },
          { name: '⏱️ 1 día (24 horas)', value: 86400 },
          { name: '⏱️ 1 semana', value: 604800 }
        )
    )
    .addStringOption(option =>
      option.setName('razon').setDescription('Motivo de la medida correctiva').setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ModerateMembers)) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Permiso Denegado',
            description: '> Necesitas permisos para `Moderar Miembros` para silenciar usuarios.'
          })
        ],
        ephemeral: true
      });
    }

    const targetUser = interaction.options.getUser('usuario');
    const seconds = interaction.options.getInteger('duracion');
    const reason = interaction.options.getString('razon') || 'Conducta no permitida en el servidor';
    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (!member) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Usuario No Encontrado',
            description: '> El miembro indicado no se encuentra en el servidor actual.'
          })
        ],
        ephemeral: true
      });
    }

    if (!member.moderatable) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Jerarquía Insuficiente',
            description: '> No puedo aislar a este usuario debido a que su rol es igual o superior al rol del bot.'
          })
        ],
        ephemeral: true
      });
    }

    await member.timeout(seconds * 1000, reason);

    const durationLabel = seconds >= 86400 ? `${seconds / 86400} día(s)` : seconds >= 3600 ? `${seconds / 3600} hora(s)` : `${seconds / 60} minuto(s)`;
    const expiresTimestamp = Math.floor((Date.now() + seconds * 1000) / 1000);

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.WARNING,
      title: '🔇 Usuario Aislado Temporalmente',
      thumbnail: targetUser.displayAvatarURL({ dynamic: true }),
      description:
        `>>> **La restricción de interacción ha sido aplicada.**\n\n` +
        `${SYMBOLS.ARROW} **Usuario:** ${targetUser.tag} (\`${targetUser.id}\`)\n` +
        `${SYMBOLS.ARROW} **Duración:** \`${durationLabel}\` (Termina <t:${expiresTimestamp}:R>)\n` +
        `${SYMBOLS.ARROW} **Moderador:** ${interaction.user.tag}\n` +
        `${SYMBOLS.ARROW} **Motivo:** ${reason}`,
      footerText: 'Nebula Moderation Core • Timeout Activo'
    });

    await interaction.reply({ embeds: [embed] });
  }
};
