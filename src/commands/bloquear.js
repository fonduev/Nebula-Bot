// ============================================================
// Comando /bloquear - Bloqueo de Emergencia de Canal (Lockdown)
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bloquear')
    .setDescription('Bloquea un canal para impedir temporalmente que los miembros envíen mensajes')
    .addChannelOption(opt =>
      opt.setName('canal')
        .setDescription('El canal a bloquear (por defecto el actual)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('motivo')
        .setDescription('Motivo del bloqueo (ej: Mantenimiento, incursión, evento)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Permiso Denegado',
            description: '> No posees la facultad (`Gestionar Canales`) para bloquear canales del servidor.'
          })
        ],
        ephemeral: true
      });
    }

    const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
    const reason = interaction.options.getString('motivo') || 'Medida de seguridad o mantenimiento preventivo';

    try {
      await targetChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: false
      }, { reason: `Bloqueado por ${interaction.user.tag}: ${reason}` });

      const noticeEmbed = createNebulaEmbed(interaction.client, {
        color: COLORS.ERROR,
        title: '🔒 Canal Bloqueado Temporalmente',
        description:
          `>>> Este canal ha sido cerrado temporalmente por el equipo de moderación.\n\n` +
          `${SYMBOLS.ARROW} **Canal:** ${targetChannel}\n` +
          `${SYMBOLS.ARROW} **Moderador:** ${interaction.user}\n` +
          `${SYMBOLS.ARROW} **Motivo:** ${reason}\n\n` +
          `*Los miembros no pueden enviar mensajes hasta que un moderador use \`/desbloquear\`.*`,
        footerText: 'Nebula Security • Protocolo de Bloqueo'
      });

      if (targetChannel.id !== interaction.channelId) {
        await targetChannel.send({ embeds: [noticeEmbed] });
        await interaction.reply({
          content: `✅ El canal ${targetChannel} ha sido bloqueado exitosamente.`,
          ephemeral: true
        });
      } else {
        await interaction.reply({ embeds: [noticeEmbed] });
      }
    } catch (err) {
      console.error('[Bloquear Error]', err);
      await interaction.reply({
        content: `❌ No se pudo bloquear el canal. Verifica que el bot tenga el permiso de **Gestionar Canales** y que mi rol esté por encima en la jerarquía.`,
        ephemeral: true
      });
    }
  }
};
