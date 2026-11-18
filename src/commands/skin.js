// ============================================================
// Comando /skin - Renderizador de Skins 3D
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skin')
    .setDescription('Visualiza la skin 3D completa, avatar y descarga la textura de cualquier jugador de Minecraft')
    .addStringOption(option =>
      option
        .setName('usuario')
        .setDescription('Nombre de usuario de Minecraft (ej: Steve, Alex, Notch)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('vista')
        .setDescription('Ángulo de visualización de la skin')
        .setRequired(false)
        .addChoices(
          { name: '🧍 Frontal 3D (Predeterminada)', value: 'right' },
          { name: '🚶 Frontal Izquierda', value: 'left' },
          { name: '🔄 Busto / Torso', value: 'bust' }
        )
    ),

  async execute(interaction) {
    const username = interaction.options.getString('usuario').trim();
    const view = interaction.options.getString('vista') || 'right';
    await interaction.deferReply();

    const skinBodyUrl = view === 'bust'
      ? `https://mc-heads.net/bust/${encodeURIComponent(username)}/160`
      : `https://mc-heads.net/body/${encodeURIComponent(username)}/${view}`;
    const skinAvatarUrl = `https://mc-heads.net/avatar/${encodeURIComponent(username)}/128`;
    const downloadSkinUrl = `https://mc-heads.net/download/${encodeURIComponent(username)}`;
    const nameMcUrl = `https://namemc.com/profile/${encodeURIComponent(username)}`;

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.SECONDARY,
      title: `👤 Skin de Minecraft | ${username}`,
      thumbnail: skinAvatarUrl,
      image: skinBodyUrl,
      description:
        `>>> **Modelo Tridimensional de \`${username}\`**\n` +
        `Renderizado de alta definición compatible con modelos clásicos (Steve) y estilizados (Alex).\n` +
        `Sincronizado directamente con los servidores de pieles de Mojang.`,
      fields: [
        {
          name: '🎮 Jugador',
          value: `\`${username}\``,
          inline: true
        },
        {
          name: '📐 Resolución',
          value: '`64x64 HD`',
          inline: true
        },
        {
          name: '🏷️ Tipo de Render',
          value: `\`${view.toUpperCase()}\``,
          inline: true
        }
      ],
      footerText: `Nebula Bot • Minecraft Skin Engine • Jugador: ${username}`
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Descargar Textura .PNG')
        .setStyle(ButtonStyle.Link)
        .setEmoji('👕')
        .setURL(downloadSkinUrl),
      new ButtonBuilder()
        .setLabel('Ver en NameMC')
        .setStyle(ButtonStyle.Link)
        .setEmoji('🌐')
        .setURL(nameMcUrl),
      new ButtonBuilder()
        .setCustomId(`btn_mcuser_head_${username}`)
        .setLabel('Comando Cabeza')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🗿')
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  }
};
