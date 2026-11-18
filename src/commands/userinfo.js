// ============================================================
// Comando /userinfo - Perfil de Usuario
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Consulta información y detalles del perfil de un usuario con botones de navegación rápida')
    .addUserOption(option =>
      option
        .setName('usuario')
        .setDescription('El usuario que deseas inspeccionar (opcional, por defecto tú)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('usuario') || interaction.user;
    const member = interaction.guild ? await interaction.guild.members.fetch(targetUser.id).catch(() => null) : null;

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.SECONDARY,
      title: `👤 Perfil de Usuario | ${targetUser.username}`,
      thumbnail: targetUser.displayAvatarURL({ dynamic: true, size: 256 }),
      description:
        `>>> **Inspección de identidad de Discord.**\n` +
        `Consulta los detalles de registro, permisos y permanencia en la comunidad.`,
      fields: [
        {
          name: '🏷️ Nombre de Usuario',
          value: `\`${targetUser.tag}\``,
          inline: true
        },
        {
          name: '🆔 Identificador (ID)',
          value: `\`${targetUser.id}\``,
          inline: true
        },
        {
          name: '🤖 Naturaleza de Cuenta',
          value: targetUser.bot ? '`Bot Automatizado`' : '`Usuario Humano`',
          inline: true
        },
        {
          name: '📅 Creación de la Cuenta',
          value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:D> (<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>)`,
          inline: false
        }
      ],
      footerText: `Nebula Identity • Usuario: ${targetUser.username}`
    });

    if (member) {
      const roles = member.roles.cache
        .filter(r => r.name !== '@everyone')
        .sort((a, b) => b.position - a.position)
        .map(r => r.toString());

      embed.addFields(
        {
          name: '📥 Fecha de Ingreso al Servidor',
          value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`,
          inline: false
        },
        {
          name: `🛡️ Roles Asignados (${roles.length})`,
          value: roles.length > 0 ? roles.slice(0, 8).join(' ') + (roles.length > 8 ? ` y ${roles.length - 8} más...` : '') : 'Sin roles personalizados',
          inline: false
        }
      );
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Avatar HD')
        .setEmoji('🖼️')
        .setStyle(ButtonStyle.Link)
        .setURL(targetUser.displayAvatarURL({ dynamic: true, size: 1024 })),
      new ButtonBuilder()
        .setCustomId(`btn_view_perfil_${targetUser.id}`)
        .setLabel('Perfil Cósmico')
        .setEmoji('🪐')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`btn_view_rank_${targetUser.id}`)
        .setLabel('Nivel')
        .setEmoji('📊')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`btn_view_warns_${targetUser.id}`)
        .setLabel('Warns')
        .setEmoji('⚠️')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
