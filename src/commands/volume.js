// ============================================================
// Comando /volume - Control de Volumen de Audio
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed, createProgressBar } = require('../utils/theme');
const { setVolume, getSession } = require('../utils/musicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Ajusta el nivel de volumen de la música en el canal de voz')
    .addIntegerOption(option =>
      option
        .setName('nivel')
        .setDescription('Nivel de volumen del 1 al 100%')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    ),

  async execute(interaction) {
    const session = getSession(interaction.guildId);

    if (!session) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.WARNING,
            title: '🔇 Sin Sesión de Voz',
            description: '> No hay ninguna reproducción activa para ajustar el volumen.'
          })
        ],
        ephemeral: true
      });
    }

    const level = interaction.options.getInteger('nivel');
    const floatVolume = level / 100;
    setVolume(interaction.guildId, floatVolume);

    const volumeBar = createProgressBar(level, 100, 10);

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.SECONDARY,
      title: '🔊 Volumen Actualizado',
      description:
        `>>> **El nivel de salida ha sido ajustado a \`${level}%\`.**\n\n` +
        `${volumeBar}\n\n` +
        `${SYMBOLS.ARROW} **Pista:** ${session.track?.title || session.track?.name || 'Música'}\n` +
        `${SYMBOLS.ARROW} **Modificado por:** ${interaction.user.tag}`,
      footerText: 'Nebula Audio Engine • Control de Nivel'
    });

    await interaction.reply({ embeds: [embed] });
  }
};
