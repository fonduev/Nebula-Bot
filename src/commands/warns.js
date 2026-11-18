// ============================================================
// Comando /warns - Historial de Advertencias
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');
const { getGuildWarns } = require('../utils/database');

function buildWarnsPayload(client, guild, targetUser, isMod) {
  const guildWarns = getGuildWarns(guild.id);
  const userWarns = guildWarns[targetUser.id] || [];

  if (userWarns.length === 0) {
    const embed = createNebulaEmbed(client, {
      color: COLORS.SUCCESS,
      title: '🛡️ Historial Impecable',
      description: `**${targetUser.tag || targetUser.username}** no tiene ninguna advertencia activa en este servidor.`
    });

    const row = new ActionRowBuilder();
    if (isMod) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`btn_warn_add_${targetUser.id}`)
          .setLabel('Aplicar Advertencia')
          .setEmoji('⚠️')
          .setStyle(ButtonStyle.Danger)
      );
    }

    return { embeds: [embed], components: row.components.length > 0 ? [row] : [] };
  }

  const listText = userWarns.map((w, i) => {
    return `\`#${w.id}\` • <t:${Math.floor(w.timestamp / 1000)}:d> • **Motivo:** ${w.reason} *(Mod: <@${w.moderatorId}>)*`;
  }).join('\n');

  const embed = createNebulaEmbed(client, {
    color: COLORS.WARNING,
    title: `⚠️ Historial de Advertencias (${userWarns.length})`,
    thumbnail: targetUser.displayAvatarURL({ dynamic: true }),
    description:
      `>>> Mostrando advertencias registradas para ${targetUser}:\n\n` +
      listText + '\n\n' +
      `*Para remover una sanción, un moderador puede pulsar el botón inferior o usar \`/unwarn\`.*`,
    footerText: `Nebula Moderation • Total: ${userWarns.length} advertencia(s)`
  });

  const row = new ActionRowBuilder();
  if (isMod) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`btn_unwarn_last_${targetUser.id}`)
        .setLabel('Perdonar Último Warn')
        .setEmoji('🛡️')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`btn_warn_add_${targetUser.id}`)
        .setLabel('Nueva Advertencia')
        .setEmoji('⚠️')
        .setStyle(ButtonStyle.Danger)
    );
  }

  return { embeds: [embed], components: row.components.length > 0 ? [row] : [] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warns')
    .setDescription('Consulta el historial de advertencias de un usuario con botones de moderación')
    .addUserOption(opt =>
      opt.setName('usuario')
        .setDescription('El miembro a consultar (opcional, por defecto tú)')
        .setRequired(false)
    ),

  buildWarnsPayload,

  async execute(interaction) {
    const targetUser = interaction.options.getUser('usuario') || interaction.user;
    const isMod = interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers);

    // Solo moderadores pueden ver las advertencias de otros usuarios
    if (targetUser.id !== interaction.user.id && !isMod) {
      return await interaction.reply({
        content: '❌ Solo los moderadores pueden consultar las advertencias de otros miembros.',
        ephemeral: true
      });
    }

    const payload = buildWarnsPayload(interaction.client, interaction.guild, targetUser, isMod);
    await interaction.reply(payload);
  }
};
