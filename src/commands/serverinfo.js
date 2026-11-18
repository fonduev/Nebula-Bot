// ============================================================
// Comando /serverinfo - Estadísticas Avanzadas del Servidor
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Muestra información detallada, estadísticas y métricas del servidor con controles interactivos'),

  async execute(interaction) {
    const { guild } = interaction;
    if (!guild) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Ámbito Inválido',
            description: '> Este comando solo puede ser ejecutado dentro de un servidor de Discord.'
          })
        ],
        ephemeral: true
      });
    }

    await interaction.deferReply();

    const owner = await guild.fetchOwner();
    const totalMembers = guild.memberCount;
    const channels = guild.channels.cache;
    const textChannels = channels.filter(c => c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement).size;
    const voiceChannels = channels.filter(c => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice).size;
    const categoriesCount = channels.filter(c => c.type === ChannelType.GuildCategory).size;
    const rolesCount = guild.roles.cache.size;

    const verificationLevels = {
      0: 'Ninguno (Sin barreras)',
      1: 'Bajo (Email verificado)',
      2: 'Medio (Registrado +5 min)',
      3: 'Alto (Miembro +10 min)',
      4: 'Muy Alto (Teléfono verificado)'
    };

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.PRIMARY,
      title: `🏰 Estadísticas del Servidor | ${guild.name}`,
      thumbnail: guild.iconURL({ dynamic: true, size: 256 }) || interaction.client.user.displayAvatarURL(),
      description:
        `>>> **Resumen oficial de actividad, miembros y estructura de ${guild.name}.**\n` +
        `Servidor vinculado con el ecosistema de utilidades y bots de Nebula.`,
      fields: [
        {
          name: '👑 Propietario',
          value: `${owner.user.tag} (\`${owner.id}\`)`,
          inline: true
        },
        {
          name: '📅 Fecha de Creación',
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>\n(<t:${Math.floor(guild.createdTimestamp / 1000)}:R>)`,
          inline: true
        },
        {
          name: '🆔 Identificador (ID)',
          value: `\`${guild.id}\``,
          inline: true
        },
        {
          name: '👥 Comunidad',
          value: `**${totalMembers.toLocaleString()}** Miembros Totales`,
          inline: true
        },
        {
          name: '💬 Canales & Estructura',
          value: `📝 **${textChannels}** Texto • 🔊 **${voiceChannels}** Voz\n📁 **${categoriesCount}** Categorías`,
          inline: true
        },
        {
          name: '🛡️ Seguridad & Roles',
          value: `**${rolesCount}** Roles creados\n🔒 \`${verificationLevels[guild.verificationLevel] || 'Estándar'}\``,
          inline: true
        },
        {
          name: '💎 Mejoras de Servidor (Nitro Boosts)',
          value: `Nivel **${guild.premiumTier}** • **${guild.premiumSubscriptionCount || 0}** Mejoras activas`,
          inline: false
        }
      ],
      footerText: `Nebula Analytics • Servidor: ${guild.name}`
    });

    if (guild.bannerURL()) {
      embed.setImage(guild.bannerURL({ size: 1024 }));
    }

    const row = new ActionRowBuilder();
    if (guild.iconURL()) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel('Icono del Servidor')
          .setEmoji('🖼️')
          .setStyle(ButtonStyle.Link)
          .setURL(guild.iconURL({ dynamic: true, size: 1024 }))
      );
    }
    if (guild.bannerURL()) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel('Banner del Servidor')
          .setEmoji('🎨')
          .setStyle(ButtonStyle.Link)
          .setURL(guild.bannerURL({ size: 1024 }))
      );
    }
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('btn_view_top')
        .setLabel('Top Miembros')
        .setEmoji('🏆')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [embed], components: row.components.length > 0 ? [row] : [] });
  }
};
