// ============================================================
// Comando /skip - Saltar a la Siguiente Canción
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');
const { skipTrack, getSession } = require('../utils/musicManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Salta la canción que está sonando actualmente y reproduce la siguiente en la cola'),

  async execute(interaction) {
    const session = getSession(interaction.guildId);

    if (!session || !session.currentTrack) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.WARNING,
            title: '🔇 Nada en Reproducción',
            description: '> No hay ninguna canción reproduciéndose para saltar.'
          })
        ],
        ephemeral: true
      });
    }

    const skippedTitle = session.currentTrack.title;
    const hasNext = session.queue.length > 0;
    skipTrack(interaction.guildId);

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.SUCCESS,
      title: '⏭️ Canción Saltada',
      description:
        `>>> **Se ha omitido:** \`${skippedTitle}\`\n\n` +
        (hasNext ? `▶️ Reproduciendo ahora la siguiente canción en la cola...` : `⚪ La cola ha finalizado. No hay más canciones pendientes.`),
      footerText: `Saltado por ${interaction.user.tag}`
    });

    await interaction.reply({ embeds: [embed] });
  }
};
