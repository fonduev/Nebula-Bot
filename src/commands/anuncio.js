// ============================================================
// Comando /anuncio - Publicación de Comunicados Oficiales
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anuncio')
    .setDescription('Publica un comunicado oficial con estética cósmica en un canal (Administración)')
    .addStringOption(option =>
      option.setName('titulo').setDescription('Título principal del comunicado').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('mensaje').setDescription('Contenido y cuerpo del comunicado').setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Canal de destino (opcional, por defecto el canal actual)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('color')
        .setDescription('Estilo de color del anuncio')
        .setRequired(false)
        .addChoices(
          { name: '💜 Púrpura Cósmico (Predeterminado)', value: 'primary' },
          { name: '💙 Cian Estelar', value: 'secondary' },
          { name: '💚 Verde Éxito', value: 'success' },
          { name: '🧡 Ámbar Noticia Importante', value: 'warning' },
          { name: '❤️ Rojo Alerta Crítica', value: 'error' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Permiso Denegado',
            description: '> Necesitas permisos de `Administrar Servidor` para publicar comunicados oficiales.'
          })
        ],
        ephemeral: true
      });
    }

    const title = interaction.options.getString('titulo');
    const message = interaction.options.getString('mensaje');
    const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
    const colorChoice = interaction.options.getString('color') || 'primary';

    const colorMap = {
      primary: COLORS.PRIMARY,
      secondary: COLORS.SECONDARY,
      success: COLORS.SUCCESS,
      warning: COLORS.WARNING,
      error: COLORS.ERROR
    };

    const announcementEmbed = createNebulaEmbed(interaction.client, {
      color: colorMap[colorChoice] || COLORS.PRIMARY,
      title: `📢 ${title}`,
      description: `>>> ${message}`,
      footerText: `Publicado por ${interaction.user.tag} • Nebula Dev Studios`
    });

    try {
      await targetChannel.send({ embeds: [announcementEmbed] });
      await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.SUCCESS,
            title: '✅ Anuncio Difundido con Éxito',
            description: `> El comunicado ha sido publicado correctamente en el canal ${targetChannel}.`
          })
        ],
        ephemeral: true
      });
    } catch (err) {
      console.error(err);
      await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Error al Enviar Anuncio',
            description: `> No se pudo enviar el mensaje a ${targetChannel}. Comprueba que el bot tenga permisos para ver y escribir en ese canal.`
          })
        ],
        ephemeral: true
      });
    }
  }
};
