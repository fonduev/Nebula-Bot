// ============================================================
// Embed Studio V2 - Diseñador Interactivo de Embeds
// Componentes V2 Interactivos & Modales en Vivo de Discord
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelSelectMenuBuilder,
  ChannelType
} = require('discord.js');
const { COLORS } = require('./theme');

// Almacén en memoria de borradores de embeds por usuario y servidor: key = `${userId}_${guildId}`
const drafts = new Map();

function getDefaultDraft(guild) {
  return {
    content: '',
    color: '#8b5cf6',
    title: '🌌 Nuevo Comunicado | Nebula Dev Studios',
    titleUrl: 'https://nebuladevstudios.com',
    description:
      '¡Bienvenido al **Embed Studio V2** de Nebula Bot!\n\n' +
      'Diseña anuncios, comunicados y paneles interactivos con **modales en tiempo real**.\n\n' +
      '• **Texto:** Modifica título, enlace y descripción con Markdown.\n' +
      '• **Color:** Personaliza el código HEX o paleta cósmica.\n' +
      '• **Campos:** Añade bloques dinámicos organizados.\n' +
      '• **Botones V2:** Agrega botones interactivos con enlaces directos.',
    author: {
      name: 'Nebula Dev Studios',
      iconURL: 'https://nebuladevstudios.com/assets/img/logo.svg',
      url: 'https://nebuladevstudios.com'
    },
    thumbnail: '',
    image: '',
    footer: {
      text: guild?.name ? `${guild.name} • Soporte Oficial` : 'Nebula Bot Official',
      iconURL: guild?.iconURL() || 'https://nebuladevstudios.com/assets/img/logo.svg'
    },
    timestamp: true,
    fields: [
      {
        name: '🚀 Ecosistema',
        value: 'Nebula Launcher v5.0.8',
        inline: true
      },
      {
        name: '🛡️ Seguridad',
        value: 'Verificado por Nebula Core',
        inline: true
      }
    ],
    buttons: [
      {
        label: '🚀 Portal Web',
        url: 'https://nebuladevstudios.com',
        emoji: '🌐'
      }
    ]
  };
}

function getDraft(userId, guildId, guild) {
  const key = `${userId}_${guildId}`;
  if (!drafts.has(key)) {
    drafts.set(key, getDefaultDraft(guild));
  }
  return drafts.get(key);
}

function setDraft(userId, guildId, data) {
  const key = `${userId}_${guildId}`;
  drafts.set(key, data);
}

function resetDraft(userId, guildId, guild) {
  const key = `${userId}_${guildId}`;
  const def = getDefaultDraft(guild);
  drafts.set(key, def);
  return def;
}

function buildEmbedFromDraft(draft) {
  const embed = new EmbedBuilder();

  // Color
  if (draft.color) {
    try {
      embed.setColor(draft.color);
    } catch {
      embed.setColor(COLORS.PRIMARY);
    }
  } else {
    embed.setColor(COLORS.PRIMARY);
  }

  // Author
  if (draft.author && draft.author.name && draft.author.name.trim() !== '') {
    const authorData = { name: draft.author.name.slice(0, 256) };
    if (draft.author.iconURL && draft.author.iconURL.startsWith('http')) {
      authorData.iconURL = draft.author.iconURL;
    }
    if (draft.author.url && draft.author.url.startsWith('http')) {
      authorData.url = draft.author.url;
    }
    embed.setAuthor(authorData);
  }

  // Title
  if (draft.title && draft.title.trim() !== '') {
    embed.setTitle(draft.title.slice(0, 256));
    if (draft.titleUrl && draft.titleUrl.startsWith('http')) {
      embed.setURL(draft.titleUrl);
    }
  }

  // Description
  if (draft.description && draft.description.trim() !== '') {
    embed.setDescription(draft.description.slice(0, 4096));
  }

  // Fields
  if (Array.isArray(draft.fields) && draft.fields.length > 0) {
    for (const f of draft.fields.slice(0, 25)) {
      if (f.name && f.value) {
        embed.addFields({
          name: f.name.slice(0, 256),
          value: f.value.slice(0, 1024),
          inline: Boolean(f.inline)
        });
      }
    }
  }

  // Thumbnail
  if (draft.thumbnail && draft.thumbnail.startsWith('http')) {
    embed.setThumbnail(draft.thumbnail);
  }

  // Image
  if (draft.image && draft.image.startsWith('http')) {
    embed.setImage(draft.image);
  }

  // Footer
  if (draft.footer && draft.footer.text && draft.footer.text.trim() !== '') {
    const footerData = { text: draft.footer.text.slice(0, 2048) };
    if (draft.footer.iconURL && draft.footer.iconURL.startsWith('http')) {
      footerData.iconURL = draft.footer.iconURL;
    }
    embed.setFooter(footerData);
  }

  // Timestamp
  if (draft.timestamp) {
    embed.setTimestamp();
  }

  return embed;
}

function buildCustomButtonsRow(draft, isPreview = false) {
  if (!Array.isArray(draft.buttons) || draft.buttons.length === 0) return null;

  const validButtons = draft.buttons.filter(b => b.label && b.url && b.url.startsWith('http')).slice(0, 5);
  if (validButtons.length === 0) return null;

  const row = new ActionRowBuilder();
  for (const b of validButtons) {
    const btn = new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel(b.label.slice(0, 80))
      .setURL(b.url);

    if (b.emoji) {
      try {
        btn.setEmoji(b.emoji);
      } catch {
        // ignore emoji error
      }
    }
    row.addComponents(btn);
  }
  return row;
}

function buildStudioActionRows(draft) {
  // Fila 1: Textos & Estilos Principales
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('embed_btn_text')
      .setLabel('Texto y Título')
      .setEmoji('✏️')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('embed_btn_color')
      .setLabel('Color HEX')
      .setEmoji('🎨')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('embed_btn_author')
      .setLabel('Autor')
      .setEmoji('👤')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('embed_btn_images')
      .setLabel('Imágenes')
      .setEmoji('🖼️')
      .setStyle(ButtonStyle.Secondary)
  );

  // Fila 2: Campos & Componentes V2
  const fieldCount = draft.fields?.length || 0;
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('embed_btn_add_field')
      .setLabel(`Añadir Campo (${fieldCount}/25)`)
      .setEmoji('➕')
      .setStyle(ButtonStyle.Success)
      .setDisabled(fieldCount >= 25),
    new ButtonBuilder()
      .setCustomId('embed_btn_del_field')
      .setLabel('Quitar Último')
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(fieldCount === 0),
    new ButtonBuilder()
      .setCustomId('embed_btn_footer')
      .setLabel('Pie y Fecha')
      .setEmoji('📄')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('embed_btn_buttons')
      .setLabel(`Botones V2 (${draft.buttons?.length || 0})`)
      .setEmoji('🔘')
      .setStyle(ButtonStyle.Primary)
  );

  // Fila 3: Herramientas & JSON
  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('embed_btn_msg')
      .setLabel('Mensaje Exterior')
      .setEmoji('💬')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('embed_btn_json')
      .setLabel('Importar / Exportar JSON')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('embed_btn_reset')
      .setLabel('Reiniciar')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Danger)
  );

  // Fila 4: Selector de Canal de Destino
  const row4 = new ActionRowBuilder().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId('embed_select_channel')
      .setPlaceholder('🚀 Selecciona el canal donde publicar este Embed...')
      .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
  );

  const rows = [row1, row2, row3, row4];

  // Si tiene botones personalizados, mostramos la fila de botones en la previsualización
  const customButtonsRow = buildCustomButtonsRow(draft, true);
  if (customButtonsRow && rows.length < 5) {
    // Inserta antes del select menu
    return [row1, row2, row3, customButtonsRow, row4];
  }

  return rows;
}

function buildStudioPayload(draft, notice = null) {
  const embed = buildEmbedFromDraft(draft);
  const rows = buildStudioActionRows(draft);

  let contentText = '🪐 **Embed Studio V2 (Componentes Interactivos & Modales)**\n*Diseña tu mensaje y pulsa cualquier botón para editarlo en tiempo real.*';
  if (draft.content && draft.content.trim() !== '') {
    contentText += `\n\n📌 **Mensaje exterior:** ${draft.content}`;
  }
  if (notice) {
    contentText += `\n> ${notice}`;
  }

  return {
    content: contentText,
    embeds: [embed],
    components: rows,
    ephemeral: true
  };
}

// ------------------------------------------------------------
// Generadores de Modales Interactivos
// ------------------------------------------------------------

function createTextModal(draft) {
  const modal = new ModalBuilder()
    .setCustomId('embed_modal_text')
    .setTitle('📝 Título y Descripción del Embed');

  const titleInput = new TextInputBuilder()
    .setCustomId('title')
    .setLabel('Título del Embed (Opcional)')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(256)
    .setRequired(false)
    .setValue(draft.title || '');

  const urlInput = new TextInputBuilder()
    .setCustomId('title_url')
    .setLabel('Enlace URL del Título (Opcional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://nebuladevstudios.com')
    .setRequired(false)
    .setValue(draft.titleUrl || '');

  const descInput = new TextInputBuilder()
    .setCustomId('description')
    .setLabel('Descripción (Soporta Markdown y saltos)')
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(4000)
    .setRequired(false)
    .setValue(draft.description || '');

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(urlInput),
    new ActionRowBuilder().addComponents(descInput)
  );
  return modal;
}

function createColorModal(draft) {
  const modal = new ModalBuilder()
    .setCustomId('embed_modal_color')
    .setTitle('🎨 Color del Embed (HEX)');

  const colorInput = new TextInputBuilder()
    .setCustomId('color')
    .setLabel('Código HEX (#8b5cf6, #38bdf8, #10b981, #ef4444)')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(9)
    .setRequired(true)
    .setValue(draft.color || '#8b5cf6');

  modal.addComponents(new ActionRowBuilder().addComponents(colorInput));
  return modal;
}

function createAuthorModal(draft) {
  const modal = new ModalBuilder()
    .setCustomId('embed_modal_author')
    .setTitle('👤 Configuración del Autor');

  const nameInput = new TextInputBuilder()
    .setCustomId('author_name')
    .setLabel('Nombre del Autor (Opcional)')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(256)
    .setRequired(false)
    .setValue(draft.author?.name || '');

  const iconInput = new TextInputBuilder()
    .setCustomId('author_icon')
    .setLabel('URL del Avatar / Icono del Autor')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://...')
    .setRequired(false)
    .setValue(draft.author?.iconURL || '');

  const urlInput = new TextInputBuilder()
    .setCustomId('author_url')
    .setLabel('URL de Enlace del Autor')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://...')
    .setRequired(false)
    .setValue(draft.author?.url || '');

  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(iconInput),
    new ActionRowBuilder().addComponents(urlInput)
  );
  return modal;
}

function createImagesModal(draft) {
  const modal = new ModalBuilder()
    .setCustomId('embed_modal_images')
    .setTitle('🖼️ Miniatura y Banner Principal');

  const thumbInput = new TextInputBuilder()
    .setCustomId('thumbnail')
    .setLabel('URL de Miniatura (Esquina superior derecha)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://...')
    .setRequired(false)
    .setValue(draft.thumbnail || '');

  const imageInput = new TextInputBuilder()
    .setCustomId('image')
    .setLabel('URL de Imagen Principal / Banner grande')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://...')
    .setRequired(false)
    .setValue(draft.image || '');

  modal.addComponents(
    new ActionRowBuilder().addComponents(thumbInput),
    new ActionRowBuilder().addComponents(imageInput)
  );
  return modal;
}

function createFieldModal() {
  const modal = new ModalBuilder()
    .setCustomId('embed_modal_field')
    .setTitle('➕ Añadir Campo Dinámico');

  const nameInput = new TextInputBuilder()
    .setCustomId('field_name')
    .setLabel('Título del Campo')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(256)
    .setRequired(true)
    .setPlaceholder('Ej: Requisitos, Estado, Enlaces...');

  const valueInput = new TextInputBuilder()
    .setCustomId('field_value')
    .setLabel('Contenido del Campo (Soporta Markdown)')
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(1024)
    .setRequired(true);

  const inlineInput = new TextInputBuilder()
    .setCustomId('field_inline')
    .setLabel('¿En la misma línea? (Escribe "si" o "no")')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(5)
    .setRequired(false)
    .setValue('si');

  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(valueInput),
    new ActionRowBuilder().addComponents(inlineInput)
  );
  return modal;
}

function createFooterModal(draft) {
  const modal = new ModalBuilder()
    .setCustomId('embed_modal_footer')
    .setTitle('📄 Pie de Página y Fecha');

  const textInput = new TextInputBuilder()
    .setCustomId('footer_text')
    .setLabel('Texto al Pie')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(2048)
    .setRequired(false)
    .setValue(draft.footer?.text || '');

  const iconInput = new TextInputBuilder()
    .setCustomId('footer_icon')
    .setLabel('URL del Icono al Pie (Opcional)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://...')
    .setRequired(false)
    .setValue(draft.footer?.iconURL || '');

  const timeInput = new TextInputBuilder()
    .setCustomId('show_timestamp')
    .setLabel('¿Mostrar Fecha y Hora Actual? ("si" o "no")')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(5)
    .setRequired(false)
    .setValue(draft.timestamp ? 'si' : 'no');

  modal.addComponents(
    new ActionRowBuilder().addComponents(textInput),
    new ActionRowBuilder().addComponents(iconInput),
    new ActionRowBuilder().addComponents(timeInput)
  );
  return modal;
}

function createButtonsModal(draft) {
  const modal = new ModalBuilder()
    .setCustomId('embed_modal_buttons')
    .setTitle('🔘 Botones de Enlace (Componentes V2)');

  const b1 = draft.buttons?.[0] || {};
  const b2 = draft.buttons?.[1] || {};

  const b1Label = new TextInputBuilder()
    .setCustomId('btn1_label')
    .setLabel('Botón 1 - Texto (ej: Descargar Launcher)')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(80)
    .setRequired(false)
    .setValue(b1.label || '');

  const b1Url = new TextInputBuilder()
    .setCustomId('btn1_url')
    .setLabel('Botón 1 - URL (https://...)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://...')
    .setRequired(false)
    .setValue(b1.url || '');

  const b2Label = new TextInputBuilder()
    .setCustomId('btn2_label')
    .setLabel('Botón 2 - Texto (Opcional)')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(80)
    .setRequired(false)
    .setValue(b2.label || '');

  const b2Url = new TextInputBuilder()
    .setCustomId('btn2_url')
    .setLabel('Botón 2 - URL (Opcional, https://...)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('https://...')
    .setRequired(false)
    .setValue(b2.url || '');

  modal.addComponents(
    new ActionRowBuilder().addComponents(b1Label),
    new ActionRowBuilder().addComponents(b1Url),
    new ActionRowBuilder().addComponents(b2Label),
    new ActionRowBuilder().addComponents(b2Url)
  );
  return modal;
}

function createMessageModal(draft) {
  const modal = new ModalBuilder()
    .setCustomId('embed_modal_msg')
    .setTitle('💬 Mensaje Exterior (Texto Fuera del Embed)');

  const msgInput = new TextInputBuilder()
    .setCustomId('content')
    .setLabel('Texto o Menciones (ej: @everyone, alertas)')
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(2000)
    .setRequired(false)
    .setValue(draft.content || '');

  modal.addComponents(new ActionRowBuilder().addComponents(msgInput));
  return modal;
}

function createJsonModal(draft) {
  const modal = new ModalBuilder()
    .setCustomId('embed_modal_json')
    .setTitle('📋 Importar o Exportar JSON');

  const exportObj = {
    content: draft.content || '',
    embeds: [buildEmbedFromDraft(draft).toJSON()],
    buttons: draft.buttons || []
  };

  const jsonStr = JSON.stringify(exportObj, null, 2).slice(0, 3950);

  const jsonInput = new TextInputBuilder()
    .setCustomId('json_data')
    .setLabel('Pega o Copia el JSON compatible con Discord')
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(4000)
    .setRequired(true)
    .setValue(jsonStr);

  modal.addComponents(new ActionRowBuilder().addComponents(jsonInput));
  return modal;
}

module.exports = {
  getDraft,
  setDraft,
  resetDraft,
  buildEmbedFromDraft,
  buildCustomButtonsRow,
  buildStudioActionRows,
  buildStudioPayload,
  createTextModal,
  createColorModal,
  createAuthorModal,
  createImagesModal,
  createFieldModal,
  createFooterModal,
  createButtonsModal,
  createMessageModal,
  createJsonModal
};
