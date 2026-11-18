// ============================================================
// Comando /avatar - Visor de Avatares HD
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Obtén el avatar en máxima definición de cualquier usuario del servidor')
    .addUserOption(option =>
      option
        .setName('usuario')
        .setDescription('El usuario del que quieres ver el avatar (opcional, por defecto tú)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('usuario') || interaction.user;
    const member = interaction.guild ? await interaction.guild.members.fetch(targetUser.id).catch(() => null) : null;

    const globalAvatar = targetUser.displayAvatarURL({ dynamic: true, size: 1024 });
    const pngUrl = targetUser.displayAvatarURL({ extension: 'png', size: 1024 });
    const webpUrl = targetUser.displayAvatarURL({ extension: 'webp', size: 1024 });

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.PRIMARY,
      title: `🖼️ Avatar de ${targetUser.username}`,
      image: globalAvatar,
      description:
        `>>> **Avatar oficial de ${targetUser.tag} en alta resolución.**\n` +
        `Usa los botones directos a continuación para descargarlo en tu formato preferido.`,
      footerText: `Nebula Avatar Studio • ${targetUser.username}`
    });

    if (member && member.avatar) {
      const serverAvatar = member.avatarURL({ dynamic: true, size: 1024 });
      embed.addFields({
        name: '🌟 Avatar Personalizado del Servidor',
        value: `Este usuario tiene configurado un avatar específico para **${interaction.guild.name}**.`
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Descargar PNG')
        .setStyle(ButtonStyle.Link)
        .setEmoji('📷')
        .setURL(pngUrl),
      new ButtonBuilder()
        .setLabel('Descargar WEBP')
        .setStyle(ButtonStyle.Link)
        .setEmoji('🎨')
        .setURL(webpUrl)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
