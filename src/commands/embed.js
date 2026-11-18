// ============================================================
// Comando /embed - Embed Studio V2 & Creador de Embeds
// Nebula Dev Studios • nebuladevstudios.com
// Soporte de Componentes V2 Interactivos & Modales en Vivo
// ============================================================

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { COLORS } = require('../utils/theme');
const { getDraft, buildStudioPayload, buildEmbedFromDraft, buildCustomButtonsRow } = require('../utils/embedStudio');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Embed Studio V2: Creador visual interactivo de embeds con modales y envío rápido')
    .addSubcommand(sub =>
      sub
        .setName('builder')
        .setDescription('Abre el Estudio Visual Interactivo V2 con vista previa en vivo y modales')
    )
    .addSubcommand(sub =>
      sub
        .setName('rapido')
        .setDescription('Publicación rápida de un embed con parámetros tradicionales')
        .addStringOption(opt => opt.setName('titulo').setDescription('Título principal del embed').setRequired(true))
        .addStringOption(opt => opt.setName('descripcion').setDescription('Contenido del mensaje (acepta \\n)').setRequired(true))
        .addChannelOption(opt =>
          opt
            .setName('canal')
            .setDescription('Canal de destino (opcional, por defecto el canal actual)')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(false)
        )
        .addStringOption(opt =>
          opt
            .setName('color')
            .setDescription('Color o tema del embed')
            .setRequired(false)
            .addChoices(
              { name: '💜 Púrpura Cósmico (#8b5cf6)', value: '#8b5cf6' },
              { name: '💙 Cian Espacial (#38bdf8)', value: '#38bdf8' },
              { name: '💚 Esmeralda (#10b981)', value: '#10b981' },
              { name: '🧡 Ámbar (#f59e0b)', value: '#f59e0b' },
              { name: '❤️ Rojo Carmesí (#ef4444)', value: '#ef4444' },
              { name: '🖤 Espacio Oscuro (#06070c)', value: '#06070c' },
              { name: '✨ Rosa Neón (#ec4899)', value: '#ec4899' }
            )
        )
        .addStringOption(opt => opt.setName('imagen').setDescription('URL de imagen o banner grande').setRequired(false))
        .addStringOption(opt => opt.setName('miniatura').setDescription('URL de icono o miniatura').setRequired(false))
        .addStringOption(opt => opt.setName('footer').setDescription('Texto al pie del embed').setRequired(false))
    )
    .addSubcommand(sub =>
      sub
        .setName('json')
        .setDescription('Publica directamente un embed desde código JSON (compatible con Discohook / Web Dashboard)')
        .addStringOption(opt => opt.setName('codigo_json').setDescription('Pega el código JSON del embed').setRequired(true))
        .addChannelOption(opt =>
          opt
            .setName('canal')
            .setDescription('Canal de destino (opcional, por defecto el canal actual)')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(false)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)) {
      return await interaction.reply({
        content: '❌ No tienes permisos de `Gestionar Mensajes` para usar el creador de embeds.',
        ephemeral: true
      });
    }

    const subcommand = interaction.options.getSubcommand(false) || 'builder';

    // 1. Subcomando: BUILDER INTERACTIVO V2 (Por Defecto)
    if (subcommand === 'builder') {
      const draft = getDraft(interaction.user.id, interaction.guildId, interaction.guild);
      const payload = buildStudioPayload(draft);
      return await interaction.reply(payload);
    }

    // 2. Subcomando: RAPIDO
    if (subcommand === 'rapido') {
      const title = interaction.options.getString('titulo');
      let description = interaction.options.getString('descripcion');
      description = description.replace(/\\n/g, '\n');

      const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
      const color = interaction.options.getString('color') || COLORS.PRIMARY;
      const imageUrl = interaction.options.getString('imagen');
      const thumbnailUrl = interaction.options.getString('miniatura');
      const footerText = interaction.options.getString('footer');

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setTimestamp();

      if (thumbnailUrl && thumbnailUrl.startsWith('http')) embed.setThumbnail(thumbnailUrl);
      if (imageUrl && imageUrl.startsWith('http')) embed.setImage(imageUrl);

      embed.setFooter({
        text: footerText || interaction.guild.name,
        iconURL: interaction.guild.iconURL() || interaction.client.user.displayAvatarURL()
      });

      try {
        await targetChannel.send({ embeds: [embed] });
        return await interaction.reply({
          content: `✅ Embed publicado exitosamente en ${targetChannel}.`,
          ephemeral: true
        });
      } catch (err) {
        console.error('Error al enviar embed rápido:', err);
        return await interaction.reply({
          content: `❌ No se pudo enviar el embed en ${targetChannel}. Verifica los permisos del bot.`,
          ephemeral: true
        });
      }
    }

    // 3. Subcomando: JSON
    if (subcommand === 'json') {
      const jsonRaw = interaction.options.getString('codigo_json');
      const targetChannel = interaction.options.getChannel('canal') || interaction.channel;

      let parsed;
      try {
        parsed = JSON.parse(jsonRaw);
      } catch (e) {
        return await interaction.reply({
          content: '❌ El texto proporcionado no es un JSON válido. Verifica la sintaxis.',
          ephemeral: true
        });
      }

      try {
        const payload = {};
        if (parsed.content) payload.content = parsed.content;

        if (Array.isArray(parsed.embeds) && parsed.embeds.length > 0) {
          payload.embeds = parsed.embeds.map(e => EmbedBuilder.from(e));
        } else if (parsed.title || parsed.description) {
          payload.embeds = [EmbedBuilder.from(parsed)];
        }

        // Si tiene botones de enlace
        if (Array.isArray(parsed.buttons) && parsed.buttons.length > 0) {
          const row = new ActionRowBuilder();
          for (const b of parsed.buttons.slice(0, 5)) {
            if (b.label && b.url) {
              row.addComponents(
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Link)
                  .setLabel(b.label)
                  .setURL(b.url)
              );
            }
          }
          if (row.components.length > 0) payload.components = [row];
        }

        await targetChannel.send(payload);
        return await interaction.reply({
          content: `✅ Embed desde JSON publicado con éxito en ${targetChannel}.`,
          ephemeral: true
        });
      } catch (err) {
        console.error('Error al procesar JSON:', err);
        return await interaction.reply({
          content: `❌ Error al publicar embed desde JSON: \`${err.message}\``,
          ephemeral: true
        });
      }
    }
  }
};
