// ============================================================
// Comando /warn - Advertencia Formal de Moderación
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');
const { addWarn, getGuildWarns } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Aplica una advertencia formal a un miembro por incumplir las normas')
    .addUserOption(opt =>
      opt.setName('usuario')
        .setDescription('El miembro que recibirá la advertencia')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('motivo')
        .setDescription('Razón de la sanción')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Permiso Denegado',
            description: '> No posees permisos de moderación (`Moderar Miembros`) para ejecutar este comando.'
          })
        ],
        ephemeral: true
      });
    }

    const targetUser = interaction.options.getUser('usuario');
    const reason = interaction.options.getString('motivo');

    if (targetUser.id === interaction.user.id) {
      return await interaction.reply({ content: '❌ No puedes advertirte a ti mismo.', ephemeral: true });
    }
    if (targetUser.bot) {
      return await interaction.reply({ content: '❌ No puedes advertir a un bot.', ephemeral: true });
    }

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (targetMember) {
      if (targetMember.id === interaction.guild.ownerId) {
        return await interaction.reply({ content: '❌ No puedes sancionar al propietario del servidor.', ephemeral: true });
      }
      if (targetMember.roles.highest.position >= interaction.member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
        return await interaction.reply({ content: '❌ No puedes sancionar a un miembro con un rol igual o superior al tuyo en la jerarquía.', ephemeral: true });
      }
    }

    const warnItem = addWarn(interaction.guildId, targetUser.id, interaction.user.id, reason);
    const allGuildWarns = getGuildWarns(interaction.guildId);
    const userTotal = (allGuildWarns[targetUser.id] || []).length;

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.WARNING,
      title: '⚠️ Advertencia Registrada',
      thumbnail: targetUser.displayAvatarURL({ dynamic: true }),
      description:
        `>>> Se ha registrado una advertencia disciplinaria contra ${targetUser}.\n\n` +
        `${SYMBOLS.ARROW} **Usuario:** ${targetUser} (\`${targetUser.tag}\`)\n` +
        `${SYMBOLS.ARROW} **Moderador:** ${interaction.user} (\`${interaction.user.tag}\`)\n` +
        `${SYMBOLS.ARROW} **ID de Advertencia:** \`#${warnItem.id}\`\n` +
        `${SYMBOLS.ARROW} **Motivo:** ${reason}\n` +
        `${SYMBOLS.ARROW} **Historial:** El usuario acumula **${userTotal} advertencia(s)**.`,
      footerText: 'Nebula Moderation Core • Registro Oficial'
    });

    // Intentar notificar al usuario por mensaje privado
    try {
      await targetUser.send({
        content: `⚠️ Has recibido una advertencia en **${interaction.guild.name}**:\n**Motivo:** ${reason}\n**ID:** \`#${warnItem.id}\``
      });
    } catch (e) {}

    await interaction.reply({ embeds: [embed] });
  }
};
