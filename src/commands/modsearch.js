// ============================================================
// Comando /modsearch - Buscador de Mods, Shaders & Modpacks
// Búsqueda en vivo en Modrinth API
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

// Almacén en memoria de resultados para interacción con el select menu (id de mensaje -> hits)
const searchCache = new Map();

function buildModEmbed(client, hit) {
  const title = hit.title || 'Mod de Minecraft';
  const description = hit.description || 'Sin descripción disponible.';
  const author = hit.author || 'Autor desconocido';
  const downloads = (hit.downloads || 0).toLocaleString();
  const follows = (hit.follows || 0).toLocaleString();
  const projectType = (hit.project_type || 'mod').toUpperCase();
  const iconUrl = hit.icon_url || 'https://cdn.modrinth.com/modrinth.png';
  const slug = hit.slug || hit.project_id;
  const projectUrl = `https://modrinth.com/${hit.project_type || 'mod'}/${slug}`;
  const loaders = (hit.loaders || []).slice(0, 5).join(' • ') || 'Universal';
  const versions = (hit.game_versions || []).slice(-3).reverse().join(', ') || 'Reciente';

  return createNebulaEmbed(client, {
    color: COLORS.MINECRAFT,
    title: `📦 ${title} [${projectType}]`,
    url: projectUrl,
    thumbnail: iconUrl,
    description:
      `>>> ${description.length > 250 ? description.slice(0, 247) + '...' : description}\n\n` +
      `${SYMBOLS.ARROW} **Autor:** \`${author}\`\n` +
      `${SYMBOLS.ARROW} **Descargas:** \`${downloads}\` 📥 • **Seguidores:** \`${follows}\` ⭐\n` +
      `${SYMBOLS.ARROW} **Cargadores:** \`${loaders}\`\n` +
      `${SYMBOLS.ARROW} **Versiones:** \`${versions}\``,
    fields: [
      {
        name: '🚀 Compatible con Nebula Launcher',
        value: `Instala este ${hit.project_type || 'mod'} directamente añadiéndolo a la carpeta \`/mods\` de tu instancia en Nebula Launcher.`,
        inline: false
      }
    ],
    footerText: `Modrinth Live API • ID: ${slug}`
  });
}

function buildModButtons(hit) {
  const slug = hit.slug || hit.project_id;
  const projectUrl = `https://modrinth.com/${hit.project_type || 'mod'}/${slug}`;

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Ver en Modrinth')
      .setStyle(ButtonStyle.Link)
      .setEmoji('🌐')
      .setURL(projectUrl),
    new ButtonBuilder()
      .setLabel('Descargar con Nebula Launcher')
      .setStyle(ButtonStyle.Link)
      .setEmoji('🚀')
      .setURL('https://nebuladevstudios.com/launcher.html')
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modsearch')
    .setDescription('Busca mods, shaders, modpacks y resource packs en tiempo real en Modrinth')
    .addStringOption(option =>
      option
        .setName('termino')
        .setDescription('Nombre o palabra clave a buscar (ej: Sodium, Iris, Create, Distant Horizons)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('tipo')
        .setDescription('Tipo de contenido a buscar')
        .setRequired(false)
        .addChoices(
          { name: '📦 Mods (Predeterminado)', value: 'mod' },
          { name: '✨ Shaders Gráficos', value: 'shader' },
          { name: '📚 Modpacks Completos', value: 'modpack' },
          { name: '🎨 Paquetes de Texturas (Resource Packs)', value: 'resourcepack' }
        )
    )
    .addStringOption(option =>
      option
        .setName('cargador')
        .setDescription('Filtrar por cargador de mods')
        .setRequired(false)
        .addChoices(
          { name: 'Fabric', value: 'fabric' },
          { name: 'Forge', value: 'forge' },
          { name: 'NeoForge', value: 'neoforge' },
          { name: 'Quilt', value: 'quilt' }
        )
    ),

  buildModEmbed,
  buildModButtons,
  searchCache,

  async execute(interaction) {
    const query = interaction.options.getString('termino').trim();
    const type = interaction.options.getString('tipo') || 'mod';
    const loader = interaction.options.getString('cargador');

    await interaction.deferReply();

    try {
      let facets = `[["project_type:${type}"]]`;
      if (loader) {
        facets = `[["project_type:${type}"],["categories:${loader}"]]`;
      }

      const apiUrl = `https://api.modrinth.com/v2/search?query=${encodeURIComponent(query)}&limit=5&facets=${encodeURIComponent(facets)}`;

      const res = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Nebula-Discord-Bot/1.0 (contact@nebuladevstudios.com)'
        }
      });

      if (!res.ok) {
        throw new Error(`Modrinth API respondió con código ${res.status}`);
      }

      const data = await res.json();
      const hits = data.hits || [];

      if (hits.length === 0) {
        return await interaction.editReply({
          embeds: [
            createNebulaEmbed(interaction.client, {
              color: COLORS.WARNING,
              title: '🔍 Sin Resultados en Modrinth',
              description:
                `> No se encontraron resultados para **"${query}"** en la categoría \`${type}\`.\n\n` +
                `${SYMBOLS.ARROW} Verifica la ortografía del mod o shader.\n` +
                `${SYMBOLS.ARROW} Prueba buscar por el nombre en inglés (ej: \`Sodium\` en vez de \`Sodio\`).`,
              footerText: 'Nebula Modrinth Search'
            })
          ]
        });
      }

      const topHit = hits[0];
      const embed = buildModEmbed(interaction.client, topHit);
      const buttonsRow = buildModButtons(topHit);

      const components = [buttonsRow];

      // Si hay más de un resultado, añadir menú desplegable interactivo para explorar los demás
      if (hits.length > 1) {
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(`modsearch_select_${interaction.id}`)
          .setPlaceholder('📂 Ver otros resultados encontrados...')
          .addOptions(
            hits.map((h, idx) => ({
              label: (h.title || 'Mod').slice(0, 50),
              description: `Descargas: ${(h.downloads || 0).toLocaleString()} | Autor: ${h.author || 'Desc'}`.slice(0, 50),
              value: String(idx),
              emoji: idx === 0 ? '🥇' : '📦'
            }))
          );

        components.unshift(new ActionRowBuilder().addComponents(selectMenu));
      }

      const replyMsg = await interaction.editReply({
        embeds: [embed],
        components: components
      });

      // Guardar en caché para que interactionCreate o el collector puedan intercambiar resultados
      searchCache.set(replyMsg.id, hits);

      // Limpiar caché a los 5 minutos para evitar fugas de memoria
      setTimeout(() => searchCache.delete(replyMsg.id), 5 * 60 * 1000);

    } catch (err) {
      console.error('Error en /modsearch:', err);
      return await interaction.editReply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Error al Consultar Modrinth',
            description: `> Ocurrió un inconveniente al comunicarse con los servidores de Modrinth.\nInténtalo nuevamente en unos instantes.`
          })
        ]
      });
    }
  }
};
