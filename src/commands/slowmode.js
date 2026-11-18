// ============================================================
// Comando /slowmode - Control de Velocidad de Chat
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Establece el tiempo de espera obligatorio entre mensajes en el canal actual (Modo Lento)')
    .addIntegerOption(option =>
      option
        .setName('segundos')
        .setDescription('Segundos de espera (0 para desactivar, hasta 21600 para 6h)')
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Permiso Denegado',
            description: '> Necesitas permisos de `Gestionar Canales` para modificar la velocidad de envío.'
          })
        ],
        ephemeral: true
      });
    }

    const seconds = interaction.options.getInteger('segundos');
    await interaction.channel.setRateLimitPerUser(seconds);

    const isDisable = seconds === 0;

    const embed = createNebulaEmbed(interaction.client, {
      color: isDisable ? COLORS.SUCCESS : COLORS.PRIMARY,
      title: isDisable ? '⚡ Modo Lento Desactivado' : '⏱️ Modo Lento Configurado',
      description: isDisable
        ? `>>> **El chat ahora es fluido.** Se ha retirado el tiempo de espera por mensaje en este canal.`
        : `>>> **El canal ahora tiene restricción de velocidad.**\nLos miembros deben aguardar **\`${seconds} segundos\`** entre cada mensaje enviado.`,
      fields: [
        {
          name: '🛡️ Moderador Responsable',
          value: `${interaction.user.tag}`,
          inline: true
        },
        {
          name: '💬 Canal Afectado',
          value: `<#${interaction.channel.id}>`,
          inline: true
        }
      ],
      footerText: 'Nebula Moderation Core • Rate Limit'
    });

    await interaction.reply({ embeds: [embed] });
  }
};
