// ============================================================
// Comando /desbloquear - Reabrir Canal Bloqueado (Unlock)
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('desbloquear')
    .setDescription('Reabre un canal bloqueado permitiendo que los miembros vuelvan a enviar mensajes')
    .addChannelOption(opt =>
      opt.setName('canal')
        .setDescription('El canal a desbloquear (por defecto el actual)')
        .addChannelTypes(ChannelType.GuildText)
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
            description: '> No posees la facultad (`Gestionar Canales`) para desbloquear canales del servidor.'
          })
        ],
        ephemeral: true
      });
    }

    const targetChannel = interaction.options.getChannel('canal') || interaction.channel;

    try {
      await targetChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: null
      }, { reason: `Desbloqueado por ${interaction.user.tag}` });

      const noticeEmbed = createNebulaEmbed(interaction.client, {
        color: COLORS.SUCCESS,
        title: '🔓 Canal Desbloqueado',
        description:
          `>>> El canal vuelve a estar activo y abierto para la comunidad.\n\n` +
          `${SYMBOLS.ARROW} **Canal:** ${targetChannel}\n` +
          `${SYMBOLS.ARROW} **Abierto por:** ${interaction.user}\n\n` +
          `*Por favor mantén una conversación cordial y respeta las normas del servidor.*`,
        footerText: 'Nebula Security • Canal Restablecido'
      });

      if (targetChannel.id !== interaction.channelId) {
        await targetChannel.send({ embeds: [noticeEmbed] });
        await interaction.reply({
          content: `✅ El canal ${targetChannel} ha sido desbloqueado exitosamente.`,
          ephemeral: true
        });
      } else {
        await interaction.reply({ embeds: [noticeEmbed] });
      }
    } catch (err) {
      console.error('[Desbloquear Error]', err);
      await interaction.reply({
        content: `❌ No se pudo desbloquear el canal: ${err.message}`,
        ephemeral: true
      });
    }
  }
};
