// ============================================================
// Comando /snipe - Recupera el Último Mensaje Borrado del Canal
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');
const { getSnipe } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('snipe')
    .setDescription('Muestra el último mensaje que fue eliminado recientemente en este canal'),

  async execute(interaction) {
    const snipeData = getSnipe(interaction.channelId);

    if (!snipeData || (!snipeData.content && !snipeData.image)) {
      return await interaction.reply({
        content: '🔍 No hay ningún mensaje borrado recientemente en este canal.',
        ephemeral: true
      });
    }

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.SECONDARY,
      title: '🎯 Mensaje Eliminado Recuperado',
      thumbnail: snipeData.authorAvatar,
      description:
        `>>> **Autor:** \`${snipeData.author}\`\n` +
        `**Borrado:** <t:${Math.floor(snipeData.timestamp / 1000)}:R>\n\n` +
        `**Contenido del Mensaje:**\n` +
        (snipeData.content ? `\`\`\`text\n${snipeData.content}\n\`\`\`` : '*El mensaje no contenía texto (posible imagen o sticker).*'),
      footerText: 'Nebula Snipe Engine • Registro Temporal de Canal'
    });

    if (snipeData.image) {
      embed.setImage(snipeData.image);
    }

    await interaction.reply({ embeds: [embed] });
  }
};
