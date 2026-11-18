// ============================================================
// Biblioteca Maestra Integral de Recetas de Minecraft (729+ Ítems)
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const mcData = require('minecraft-data')('1.20.4');

const CATEGORIES = {
  redstone: {
    name: 'Mecanismos & Redstone',
    emoji: '🔴',
    description: 'Pistones, tolvas, repetidores, comparadores, dispensadores, TNT'
  },
  herramientas: {
    name: 'Herramientas & Minería',
    emoji: '⛏️',
    description: 'Picos, hachas, palas, azadas, tijeras, mecheros, brújulas, catalejos'
  },
  combate: {
    name: 'Armas, Combate & Caza',
    emoji: '⚔️',
    description: 'Espadas, escudos, arcos, ballestas, flechas y armas'
  },
  armaduras: {
    name: 'Armaduras & Protección',
    emoji: '🛡️',
    description: 'Cascos, pecheras, grebas, botas de todos los minerales'
  },
  trabajo: {
    name: 'Almacenamiento & Estaciones',
    emoji: '📦',
    description: 'Mesas de crafteo, hornos, altos hornos, barriles, yunques, cofres'
  },
  magia: {
    name: 'Magia, Nether & End',
    emoji: '✨',
    description: 'Mesas de encantamientos, faros, alambiques, ojos y cristales de end'
  },
  transporte: {
    name: 'Transporte & Movilidad',
    emoji: '🚂',
    description: 'Vías, vías propulsoras, vagonetas con cofres/tolvas y barcas'
  },
  comida: {
    name: 'Comida & Supervivencia',
    emoji: '🍖',
    description: 'Pan, pasteles, manzanas doradas, zanahorias doradas, estofados'
  },
  trials_121: {
    name: 'Minecraft 1.21 Tricky Trials',
    emoji: '⚡',
    description: 'Fabricador Automático (Crafter), Maza, Lámparas de cobre'
  },
  decoracion: {
    name: 'Bloques, Luz & Decoración',
    emoji: '🏠',
    description: 'Linternas, camas, cuadros, marcos, escaleras, losas, cristales'
  }
};

const SPANISH_NAMES = {
  // Herramientas & Armas
  diamond_pickaxe: 'Pico de Diamante',
  iron_pickaxe: 'Pico de Hierro',
  golden_pickaxe: 'Pico de Oro',
  stone_pickaxe: 'Pico de Piedra',
  wooden_pickaxe: 'Pico de Madera',
  netherite_pickaxe: 'Pico de Netherita',
  diamond_sword: 'Espada de Diamante',
  iron_sword: 'Espada de Hierro',
  golden_sword: 'Espada de Oro',
  stone_sword: 'Espada de Piedra',
  wooden_sword: 'Espada de Madera',
  netherite_sword: 'Espada de Netherita',
  diamond_axe: 'Hacha de Diamante',
  iron_axe: 'Hacha de Hierro',
  golden_axe: 'Hacha de Oro',
  stone_axe: 'Hacha de Piedra',
  wooden_axe: 'Hacha de Madera',
  diamond_shovel: 'Pala de Diamante',
  iron_shovel: 'Pala de Hierro',
  golden_shovel: 'Pala de Oro',
  stone_shovel: 'Pala de Piedra',
  wooden_shovel: 'Pala de Madera',
  diamond_hoe: 'Azada de Diamante',
  iron_hoe: 'Azada de Hierro',
  golden_hoe: 'Azada de Oro',
  stone_hoe: 'Azada de Piedra',
  wooden_hoe: 'Azada de Madera',
  shears: 'Tijeras',
  flint_and_steel: 'Mechero (Pedernal y Acero)',
  compass: 'Brújula',
  clock: 'Reloj de Bolsillo',
  spyglass: 'Catalejo (Spyglass)',
  fishing_rod: 'Caña de Pescar',
  bucket: 'Cubo (Balde)',
  lead: 'Correa',
  shield: 'Escudo',
  bow: 'Arco',
  crossbow: 'Ballesta',
  arrow: 'Flecha',
  spectral_arrow: 'Flecha Espectral',

  // Armaduras
  diamond_helmet: 'Casco de Diamante',
  diamond_chestplate: 'Pechera de Diamante',
  diamond_leggings: 'Pantalones de Diamante',
  diamond_boots: 'Botas de Diamante',
  iron_helmet: 'Casco de Hierro',
  iron_chestplate: 'Pechera de Hierro',
  iron_leggings: 'Pantalones de Hierro',
  iron_boots: 'Botas de Hierro',
  golden_helmet: 'Casco de Oro',
  golden_chestplate: 'Pechera de Oro',
  golden_leggings: 'Pantalones de Oro',
  golden_boots: 'Botas de Oro',
  chainmail_helmet: 'Casco de Mallas',
  chainmail_chestplate: 'Pechera de Mallas',
  chainmail_leggings: 'Pantalones de Mallas',
  chainmail_boots: 'Botas de Mallas',
  leather_helmet: 'Gorra de Cuero',
  leather_chestplate: 'Túnica de Cuero',
  leather_leggings: 'Pantalones de Cuero',
  leather_boots: 'Botas de Cuero',
  turtle_helmet: 'Caparazón de Tortuga (Casco)',

  // Redstone & Mecanismos
  piston: 'Pistón',
  sticky_piston: 'Pistón Pegajoso (Sticky)',
  hopper: 'Tolva (Hopper)',
  dispenser: 'Dispensador',
  dropper: 'Soltador (Dropper)',
  observer: 'Observador',
  repeater: 'Repetidor de Redstone',
  comparator: 'Comparador de Redstone',
  redstone_lamp: 'Lámpara de Redstone',
  daylight_detector: 'Sensor de Luz Solar',
  target: 'Diana (Target)',
  lever: 'Palanca',
  tripwire_hook: 'Gancho de Cuerda',
  iron_door: 'Puerta de Hierro',
  iron_trapdoor: 'Trampilla de Hierro',
  redstone_block: 'Bloque de Redstone',
  note_block: 'Bloque de Notas',
  tnt: 'Dinamita (TNT)',

  // Trabajo & Estaciones
  crafting_table: 'Mesa de Crafteo',
  furnace: 'Horno de Piedra',
  blast_furnace: 'Alto Horno (Blast Furnace)',
  smoker: 'Ahumador (Smoker)',
  barrel: 'Barril',
  chest: 'Cofre de Madera',
  trapped_chest: 'Cofre Trampa',
  ender_chest: 'Cofre de Ender',
  anvil: 'Yunque (Anvil)',
  chipped_anvil: 'Yunque Desgastado',
  damaged_anvil: 'Yunque Muy Dañado',
  smithing_table: 'Mesa de Herrería (Smithing Table)',
  stonecutter: 'Cortapiedras (Stonecutter)',
  loom: 'Telar (Loom)',
  lectern: 'Atril (Lectern)',
  composter: 'Compostador',
  cauldron: 'Caldero',
  campfire: 'Hoguera',
  soul_campfire: 'Hoguera de Almas',

  // Magia, Nether & End
  enchanting_table: 'Mesa de Encantamientos',
  brewing_stand: 'Alambique (Soporte de Pociones)',
  beacon: 'Faro Mágico (Beacon)',
  eye_of_ender: 'Ojo de Ender',
  end_crystal: 'Cristal del End',
  respawn_anchor: 'Ancla de Reaparición',
  lodestone: 'Magnetita (Lodestone)',

  // Transporte
  rail: 'Vías Normales',
  powered_rail: 'Vía Propulsora',
  detector_rail: 'Vía Detectora',
  activator_rail: 'Vía Activadora',
  minecart: 'Vagoneta',
  chest_minecart: 'Vagoneta con Cofre',
  furnace_minecart: 'Vagoneta con Horno',
  tnt_minecart: 'Vagoneta con TNT',
  hopper_minecart: 'Vagoneta con Tolva',
  oak_boat: 'Barca de Roble',
  birch_boat: 'Barca de Abedul',
  spruce_boat: 'Barca de Abeto',
  jungle_boat: 'Barca de Jungla',
  acacia_boat: 'Barca de Acacia',
  dark_oak_boat: 'Barca de Roble Oscuro',
  mangrove_boat: 'Barca de Mangle',
  cherry_boat: 'Barca de Cerezo',
  bamboo_raft: 'Balsa de Bambú',

  // Comida
  bread: 'Pan',
  cake: 'Pastel (Cake)',
  pumpkin_pie: 'Tarta de Calabaza',
  cookie: 'Galletas',
  golden_apple: 'Manzana Dorada',
  golden_carrot: 'Zanahoria Dorada',
  mushroom_stew: 'Estofado de Hongos',
  suspicious_stew: 'Guiso Sospechoso',
  rabbit_stew: 'Estofado de Conejo',
  honey_block: 'Bloque de Miel',

  // Decoración & Luz
  lantern: 'Linterna',
  soul_lantern: 'Linterna de Almas',
  sea_lantern: 'Linterna Marina',
  glowstone: 'Piedra Luminosa',
  torch: 'Antorcha',
  soul_torch: 'Antorcha de Almas',
  white_bed: 'Cama',
  painting: 'Cuadro',
  item_frame: 'Marco para Ítems',
  glow_item_frame: 'Marco Brillante',
  armor_stand: 'Soporte de Armaduras',
  bookshelf: 'Librería',
  chiseled_bookshelf: 'Estantería Cincelada',
  flower_pot: 'Maceta',
  chain: 'Cadena'
};

// Ítems y Crafteos Exclusivos de Minecraft 1.21 Tricky Trials
const RECIPES_121 = {
  crafter: {
    key: 'crafter',
    name: 'Fabricador Automático (Crafter 1.21)',
    category: 'trials_121',
    grid: [
      ['Lingote Hierro', 'Lingote Hierro', 'Lingote Hierro'],
      ['Lingote Hierro', 'Mesa de Crafteo', 'Lingote Hierro'],
      ['Polvo Redstone', 'Soltador (Drop)', 'Polvo Redstone']
    ],
    ingredients: '5x Lingotes de Hierro, 1x Mesa de Crafteo, 2x Polvo de Redstone, 1x Soltador (Dropper).',
    description: '¡La mayor revolución de Minecraft 1.21! Automatiza el crafteo de cualquier receta mediante pulsos de redstone y tolvas.'
  },
  mace: {
    key: 'mace',
    name: 'Maza de Combate (Mace 1.21)',
    category: 'trials_121',
    grid: [
      ['(Vacío)', 'Núcleo Pesado', '(Vacío)'],
      ['(Vacío)', 'Vara de Breeze', '(Vacío)'],
      ['(Vacío)', '(Vacío)', '(Vacío)']
    ],
    ingredients: '1x Núcleo Pesado (Heavy Core de Cámaras de Juicio), 1x Vara de Breeze (Breeze Rod).',
    description: 'Arma demoledora de la 1.21. Al caer desde gran altura multiplica su daño exponencialmente sin límite superior y anula el daño de caída si golpeas a tu objetivo.'
  },
  copper_bulb: {
    key: 'copper_bulb',
    name: 'Lámpara de Cobre (Copper Bulb 1.21)',
    category: 'trials_121',
    grid: [
      ['(Vacío)', 'Lingote de Cobre', '(Vacío)'],
      ['Lingote de Cobre', 'Piedra Luminosa', 'Lingote de Cobre'],
      ['(Vacío)', 'Polvo Redstone', '(Vacío)']
    ],
    ingredients: '3x Bloques de Cobre, 1x Piedra Luminosa (Glowstone), 1x Polvo de Redstone.',
    description: 'Lámpara con memoria biestable (T-Flip-Flop) integrada que cambia de estado encendido/apagado con cada pulso de redstone.'
  },
  chiseled_copper: {
    key: 'chiseled_copper',
    name: 'Cobre Cincelado (Chiseled Copper 1.21)',
    category: 'trials_121',
    grid: [
      ['Losa de Cobre', '(Vacío)', '(Vacío)'],
      ['Losa de Cobre', '(Vacío)', '(Vacío)'],
      ['(Vacío)', '(Vacío)', '(Vacío)']
    ],
    ingredients: '2x Losas de Cobre Cortadas apiladas.',
    description: 'Bloque decorativo geométrico con rejillas de cobre para cámaras de juicio y estructuras.'
  },
  copper_grate: {
    key: 'copper_grate',
    name: 'Rejilla de Cobre (Copper Grate 1.21)',
    category: 'trials_121',
    grid: [
      ['(Vacío)', 'Bloque de Cobre', '(Vacío)'],
      ['Bloque de Cobre', '(Vacío)', 'Bloque de Cobre'],
      ['(Vacío)', 'Bloque de Cobre', '(Vacío)']
    ],
    ingredients: '4x Bloques de Cobre en cruz.',
    description: 'Rejilla translúcida que permite pasar la luz pero bloquea a entidades y jugadores.'
  },
  wind_charge: {
    key: 'wind_charge',
    name: 'Carga de Viento (Wind Charge 1.21)',
    category: 'trials_121',
    grid: [
      ['(Vacío)', 'Vara de Breeze', '(Vacío)'],
      ['(Vacío)', '(Vacío)', '(Vacío)'],
      ['(Vacío)', '(Vacío)', '(Vacío)']
    ],
    ingredients: '1x Vara de Breeze (Breeze Rod). Produce 4 cargas.',
    description: 'Proyectil arrojadizo de ráfaga de aire que impulsa al jugador por los aires (Wind Jump) y activa mecanismos de redstone a distancia.'
  }
};

function formatGrid3x3(inShape, ingredients) {
  const grid = [
    ['(Vacío)', '(Vacío)', '(Vacío)'],
    ['(Vacío)', '(Vacío)', '(Vacío)'],
    ['(Vacío)', '(Vacío)', '(Vacío)']
  ];

  if (Array.isArray(inShape) && Array.isArray(inShape[0])) {
    for (let r = 0; r < inShape.length && r < 3; r++) {
      for (let c = 0; c < inShape[r].length && c < 3; c++) {
        const id = inShape[r][c];
        if (id && id > 0) {
          const item = mcData.items[id];
          const name = item ? (SPANISH_NAMES[item.name] || item.displayName) : `Ítem #${id}`;
          grid[r][c] = name.slice(0, 16);
        }
      }
    }
  } else if (Array.isArray(ingredients)) {
    let idx = 0;
    for (const id of ingredients) {
      if (idx >= 9) break;
      const r = Math.floor(idx / 3);
      const c = idx % 3;
      const item = mcData.items[id];
      const name = item ? (SPANISH_NAMES[item.name] || item.displayName) : `Ítem #${id}`;
      grid[r][c] = name.slice(0, 16);
      idx++;
    }
  }

  return grid.map(row => `[ ${row.map(c => c.padEnd(16, ' ')).join('| ')} ]`).join('\n');
}

function getIngredientList(recipe) {
  const counts = new Map();
  if (recipe.inShape) {
    for (const row of recipe.inShape) {
      for (const id of row) {
        if (id && id > 0) counts.set(id, (counts.get(id) || 0) + 1);
      }
    }
  } else if (recipe.ingredients) {
    for (const id of recipe.ingredients) {
      if (id && id > 0) counts.set(id, (counts.get(id) || 0) + 1);
    }
  }
  const parts = [];
  for (const [id, count] of counts.entries()) {
    const item = mcData.items[id];
    const name = item ? (SPANISH_NAMES[item.name] || item.displayName) : `Ítem #${id}`;
    parts.push(`${count}x ${name}`);
  }
  return parts.join(', ') || 'Sin ingredientes';
}

function classifyCategory(name) {
  if (/sword|bow|crossbow|arrow|shield|mace/i.test(name)) return 'combate';
  if (/helmet|chestplate|leggings|boots|turtle_helmet/i.test(name)) return 'armaduras';
  if (/pickaxe|axe|shovel|hoe|shears|flint_and_steel|compass|clock|spyglass|fishing_rod|bucket|lead/i.test(name)) return 'herramientas';
  if (/piston|hopper|dispenser|dropper|observer|repeater|comparator|redstone|daylight|target|lever|tripwire|button|pressure_plate|tnt|note_block/i.test(name)) return 'redstone';
  if (/rail|minecart|boat|raft/i.test(name)) return 'transporte';
  if (/furnace|smoker|blast_furnace|crafting_table|chest|barrel|shulker|anvil|grindstone|smithing_table|stonecutter|loom|cartography|fletching|cauldron|composter|lectern|bookshelf/i.test(name)) return 'trabajo';
  if (/enchanting|brewing|beacon|ender_chest|end_crystal|respawn_anchor|lodestone|eye_of_ender/i.test(name)) return 'magia';
  if (/bread|cake|pie|cookie|stew|soup|apple|carrot|honey|cooked_|meat/i.test(name)) return 'comida';
  return 'decoracion';
}

// Mapa unificado de TODAS las recetas de Minecraft (729+ ítems)
const ALL_RECIPES = new Map();

// 1. Cargar todas las recetas de minecraft-data
for (const [id, recs] of Object.entries(mcData.recipes)) {
  const item = mcData.items[id];
  if (!item || !recs || recs.length === 0) continue;

  const primaryRec = recs[0];
  const cat = classifyCategory(item.name);
  const esName = SPANISH_NAMES[item.name] || item.displayName;

  ALL_RECIPES.set(item.name, {
    id: item.id,
    key: item.name,
    name: esName,
    enName: item.displayName,
    category: cat,
    gridAscii: formatGrid3x3(primaryRec.inShape, primaryRec.ingredients),
    ingredients: getIngredientList(primaryRec),
    description: `Receta oficial de Minecraft para fabricar ${esName}.`
  });
}

// 2. Cargar las recetas de 1.21
for (const [k, r121] of Object.entries(RECIPES_121)) {
  ALL_RECIPES.set(k, {
    key: k,
    name: r121.name,
    enName: r121.name,
    category: r121.category,
    gridAscii: r121.grid.map(row => `[ ${row.map(c => c.padEnd(16, ' ')).join('| ')} ]`).join('\n'),
    ingredients: r121.ingredients,
    description: r121.description
  });
}

console.log(`[Minecraft Recipes] ${ALL_RECIPES.size} recetas integrales cargadas en memoria.`);

function getRecipe(key) {
  if (!key) return ALL_RECIPES.get('piston');
  const lower = key.toLowerCase().trim();
  if (ALL_RECIPES.has(lower)) return ALL_RECIPES.get(lower);

  // Búsqueda aproximada si no coincide exacto
  for (const [k, r] of ALL_RECIPES.entries()) {
    if (k.includes(lower) || r.name.toLowerCase().includes(lower) || r.enName.toLowerCase().includes(lower)) {
      return r;
    }
  }
  return ALL_RECIPES.get('piston');
}

function searchRecipes(query, limit = 25) {
  const q = (query || '').toLowerCase().trim();
  const allEntries = Array.from(ALL_RECIPES.values());
  if (!q) {
    return allEntries.slice(0, limit);
  }
  return allEntries
    .filter(r => {
      return (
        r.key.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.enName.toLowerCase().includes(q) ||
        r.ingredients.toLowerCase().includes(q)
      );
    })
    .slice(0, limit);
}

function getRecipesByCategory(categoryKey, page = 0, pageSize = 24) {
  const filtered = Array.from(ALL_RECIPES.values()).filter(r => r.category === categoryKey);
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const start = Math.max(0, Math.min(page, totalPages - 1)) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return {
    items,
    page: Math.min(page, totalPages - 1),
    totalPages,
    totalItems: filtered.length
  };
}

module.exports = {
  CATEGORIES,
  ALL_RECIPES,
  getRecipe,
  searchRecipes,
  getRecipesByCategory,
  formatGrid3x3
};
