// ============================================================
// Comando /crafteo - Diccionario Integral de Recetas de Minecraft
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');
const {
  CATEGORIES,
  ALL_RECIPES,
  getRecipe,
  searchRecipes,
  getRecipesByCategory
} = require('../utils/recipes');

function buildCrafteoPayload(client, recipeKey = 'piston', activeCategory = null, page = 0) {
  const recipe = getRecipe(recipeKey);
  const categoryId = activeCategory || recipe.category || 'redstone';
  const categoryMeta = CATEGORIES[categoryId] || CATEGORIES.redstone;
  const { items: categoryRecipes, page: curPage, totalPages, totalItems } = getRecipesByCategory(categoryId, page, 24);

  const embed = createNebulaEmbed(client, {
    color: COLORS.MINECRAFT,
    title: `🛠️ Crafteo: ${recipe.name}`,
    description:
      `>>> **Categoría:** ${categoryMeta.emoji} \`${categoryMeta.name}\`\n\n` +
      `### 📐 Cuadrícula de Trabajo 3x3:\n` +
      `\`\`\`text\n${recipe.gridAscii}\n\`\`\`\n` +
      `### 📦 Ingredientes Necesarios:\n` +
      `${SYMBOLS.ARROW} ${recipe.ingredients}\n\n` +
      `### 📖 Información:\n` +
      `*${recipe.description}*`,
    footerText: `Nebula Minecraft Database • ${ALL_RECIPES.size} recetas oficiales disponibles`
  });

  // Selector 1: Categorías
  const categorySelect = new StringSelectMenuBuilder()
    .setCustomId('select_crafteo_category')
    .setPlaceholder('📂 Cambiar categoría de recetas...')
    .addOptions(
      Object.entries(CATEGORIES).map(([catKey, cat]) => ({
        label: cat.name,
        value: catKey,
        description: cat.description.slice(0, 50),
        emoji: cat.emoji,
        default: catKey === categoryId
      }))
    );

  // Selector 2: Recetas dentro de la categoría activa
  const recipeSelect = new StringSelectMenuBuilder()
    .setCustomId('select_crafteo_item')
    .setPlaceholder(`📦 Selecciona un crafteo (${curPage + 1}/${totalPages})...`)
    .addOptions(
      categoryRecipes.map(r => ({
        label: r.name.slice(0, 50),
        value: r.key,
        description: r.ingredients.slice(0, 50),
        default: r.key === recipe.key
      }))
    );

  const components = [
    new ActionRowBuilder().addComponents(categorySelect),
    new ActionRowBuilder().addComponents(recipeSelect)
  ];

  if (totalPages > 1) {
    const pageRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`btn_crafteo_page_${categoryId}_${curPage - 1}_${recipe.key}`)
        .setLabel('Anterior')
        .setEmoji('⬅️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(curPage <= 0),
      new ButtonBuilder()
        .setCustomId('btn_crafteo_page_indicator')
        .setLabel(`Página ${curPage + 1}/${totalPages} (${totalItems} ítems)`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`btn_crafteo_page_${categoryId}_${curPage + 1}_${recipe.key}`)
        .setLabel('Siguiente')
        .setEmoji('➡️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(curPage >= totalPages - 1)
    );
    components.push(pageRow);
  }

  return { embeds: [embed], components };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('crafteo')
    .setDescription('Consulta todas las 729+ recetas oficiales de Minecraft con autocompletado en vivo y menús')
    .addStringOption(opt =>
      opt
        .setName('item')
        .setDescription('Escribe cualquier ítem de Minecraft para buscar su crafteo al instante')
        .setAutocomplete(true)
        .setRequired(false)
    ),

  ALL_RECIPES,
  CATEGORIES,
  buildCrafteoPayload,

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const matches = searchRecipes(focusedValue, 25);

    await interaction.respond(
      matches.map(r => ({
        name: `${r.name.slice(0, 60)} (${CATEGORIES[r.category]?.name || 'Minecraft'})`,
        value: r.key
      }))
    );
  },

  async execute(interaction) {
    const key = interaction.options.getString('item') || 'piston';
    const payload = buildCrafteoPayload(interaction.client, key);
    await interaction.reply(payload);
  }
};
