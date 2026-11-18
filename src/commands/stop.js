// ============================================================
// Comando /stop - Detener Música y Desconectar
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');
const { stopTrack, getSession } = require('../utils/musicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Detiene la reproducción de música y desconecta al bot del canal de voz'),

  async execute(interaction) {
    const session = getSession(interaction.guildId);

    if (!session) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.WARNING,
            title: '⏹️ Nada en Reproducción',
            description: '> Actualmente no hay ninguna transmisión de audio activa en este servidor.'
          })
        ],
        ephemeral: true
      });
    }

    stopTrack(interaction.guildId);

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.SUCCESS,
      title: '⏹️ Música Detenida',
      description:
        `>>> **La transmisión ha finalizado y el bot se ha desconectado del canal de voz.**\n\n` +
        `${SYMBOLS.ARROW} **Moderado por:** ${interaction.user.tag}\n` +
        `¡Gracias por escuchar con **Nebula Music**!`,
      footerText: 'Nebula Music Engine • Sesión Finalizada'
    });

    await interaction.reply({ embeds: [embed] });
  }
};
