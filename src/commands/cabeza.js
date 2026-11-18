// ============================================================
// Comando /cabeza - Cabeza 3D & Comandos /give
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cabeza')
    .setDescription('Obtén la cabeza 3D de un jugador de Minecraft y los comandos /give exactos para colocarla')
    .addStringOption(option =>
      option
        .setName('usuario')
        .setDescription('Nombre de usuario de Minecraft')
        .setRequired(true)
    ),

  async execute(interaction) {
    const user = interaction.options.getString('usuario').trim();
    const head3dUrl = `https://mc-heads.net/head/${encodeURIComponent(user)}/160`;
    const avatarUrl = `https://mc-heads.net/avatar/${encodeURIComponent(user)}/128`;
    const downloadUrl = `https://mc-heads.net/download/${encodeURIComponent(user)}`;
    const nameMcUrl = `https://namemc.com/profile/${encodeURIComponent(user)}`;

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.GOLD,
      title: `🗿 Cabeza 3D Decorativa | ${user}`,
      thumbnail: avatarUrl,
      image: head3dUrl,
      description:
        `>>> **Modelo tridimensional de la cabeza del jugador \`${user}\`.**\n` +
        `Usa los comandos a continuación en el chat o en bloques de comandos dentro del juego para obtener el bloque decorativo:`,
      fields: [
        {
          name: '📦 Minecraft Moderno (1.20.5+)',
          value: `\`\`\`mcfunction\n/give @p player_head[profile="${user}"] 1\n\`\`\``,
          inline: false
        },
        {
          name: '🏷️ Minecraft Clásico (1.8 a 1.20.4)',
          value: `\`\`\`mcfunction\n/give @p minecraft:player_head{SkullOwner:"${user}"} 1\n\`\`\``,
          inline: false
        }
      ],
      footerText: `Nebula Heads • Jugador: ${user}`
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Descargar Textura .PNG')
        .setStyle(ButtonStyle.Link)
        .setEmoji('📥')
        .setURL(downloadUrl),
      new ButtonBuilder()
        .setLabel('Ver en NameMC')
        .setStyle(ButtonStyle.Link)
        .setEmoji('🌐')
        .setURL(nameMcUrl)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
