// ============================================================
// Comando /pocion - Alquimia y Soporte de Pociones de Minecraft
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

const POTIONS = {
  fuerza: {
    name: 'Poción de Fuerza',
    color: 0x991b1b,
    base: 'Botella con Agua + Verruga del Nether ➔ Poción Rara',
    primary: 'Polvo de Blaze',
    effectI: '+3 de daño de ataque (3:00 min)',
    extended: 'Polvo de Redstone ➔ 8:00 min',
    potencyII: 'Polvo de Glowstone ➔ Fuerza II (+6 de daño, 1:30 min)',
    tip: 'Ideal para raids, bosses (Ender Dragon / Wither) y combates PvP.'
  },
  velocidad: {
    name: 'Poción de Velocidad (Speed)',
    color: 0x38bdf8,
    base: 'Botella con Agua + Verruga del Nether ➔ Poción Rara',
    primary: 'Azúcar',
    effectI: '+20% velocidad de movimiento y mayor campo visual (3:00 min)',
    extended: 'Polvo de Redstone ➔ 8:00 min',
    potencyII: 'Polvo de Glowstone ➔ Velocidad II (+40% velocidad, 1:30 min)',
    tip: 'Si le agregas un Ojo de Araña Fermentado, se corrompe en Poción de Lentitud.'
  },
  invisibilidad: {
    name: 'Poción de Invisibilidad',
    color: 0x7dd3fc,
    base: 'Poción de Visión Nocturna + Ojo de Araña Fermentado',
    primary: 'Ojo de Araña Fermentado (sobre Visión Nocturna)',
    effectI: 'Vuelve tu cuerpo invisible a mobs y jugadores (3:00 min)',
    extended: 'Polvo de Redstone ➔ 8:00 min',
    potencyII: 'No aplicable (no existe nivel II)',
    tip: 'Quítate la armadura y el objeto en mano; la armadura puesta sigue siendo visible.'
  },
  regeneracion: {
    name: 'Poción de Regeneración',
    color: 0xf43f5e,
    base: 'Botella con Agua + Verruga del Nether ➔ Poción Rara',
    primary: 'Lágrima de Ghast',
    effectI: 'Restaura medio corazón cada 2.5 segundos (0:45 min)',
    extended: 'Polvo de Redstone ➔ 1:30 min',
    potencyII: 'Polvo de Glowstone ➔ Regeneración II (restaura corazón por segundo, 0:22 min)',
    tip: 'En situaciones críticas de combate, combinada con Manzanas Doradas te hace casi inmortal.'
  },
  resistencia_fuego: {
    name: 'Poción de Resistencia al Fuego',
    color: 0xf97316,
    base: 'Botella con Agua + Verruga del Nether ➔ Poción Rara',
    primary: 'Crema de Magma',
    effectI: 'Inmunidad 100% al fuego, lava y bolas de fuego de Ghast (3:00 min)',
    extended: 'Polvo de Redstone ➔ 8:00 min',
    potencyII: 'No aplicable',
    tip: 'Indispensable para explorar el Nether y minar Netherite en capas bajas de lava sin peligro.'
  },
  vision_nocturna: {
    name: 'Poción de Visión Nocturna',
    color: 0x1e3a8a,
    base: 'Botella con Agua + Verruga del Nether ➔ Poción Rara',
    primary: 'Zanahoria Dorada',
    effectI: 'Brillo máximo del entorno (luz 15 en cuevas y agua) (3:00 min)',
    extended: 'Polvo de Redstone ➔ 8:00 min',
    potencyII: 'No aplicable',
    tip: 'Excelente para minería subterránea profunda y monumentos submarinos.'
  },
  curacion: {
    name: 'Poción de Curación Instantánea',
    color: 0xef4444,
    base: 'Botella con Agua + Verruga del Nether ➔ Poción Rara',
    primary: 'Sandía Reluciente',
    effectI: 'Restaura 4 puntos de salud (2 corazones) instantáneamente',
    extended: 'No aplicable (efecto instantáneo)',
    potencyII: 'Polvo de Glowstone ➔ Curación II (restaura 4 corazones de golpe)',
    tip: 'Daña a los no-muertos (zombis, esqueletos, Withers).'
  },
  caida_lenta: {
    name: 'Poción de Caída Lenta (Slow Falling)',
    color: 0xfef08a,
    base: 'Botella con Agua + Verruga del Nether ➔ Poción Rara',
    primary: 'Membrana de Phantom',
    effectI: 'Descenso suave por el aire e inmunidad total a daño de caída (1:30 min)',
    extended: 'Polvo de Redstone ➔ 4:00 min',
    potencyII: 'No aplicable',
    tip: 'Imprescindible para el combate contra el Dragón del End y volar con Élitros con seguridad.'
  }
};

function buildPocionPayload(client, potionKey) {
  const potion = POTIONS[potionKey] || POTIONS.fuerza;

  const embed = createNebulaEmbed(client, {
    color: potion.color,
    title: `🧪 Alquimia de Pociones: ${potion.name}`,
    description:
      `>>> **Base Alquímica Inicial:**\n${SYMBOLS.ARROW} \`${potion.base}\`\n\n` +
      `### 🍃 Ingrediente Clave Primario:\n` +
      `${SYMBOLS.ARROW} **${potion.primary}**\n\n` +
      `### ⚡ Efectos y Variantes:\n` +
      `• **Nivel Base (I):** \`${potion.effectI}\`\n` +
      `• **Tiempo Extendido:** \`${potion.extended}\`\n` +
      `• **Mayor Potencia (II):** \`${potion.potencyII}\`\n\n` +
      `### 💡 Recomendación Pro:\n` +
      `*${potion.tip}*`,
    footerText: 'Nebula Alchemy Guide • Selecciona una poción abajo'
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_pocion_item')
    .setPlaceholder('🧪 Selecciona una poción para ver su receta de alquimia...')
    .addOptions(
      Object.entries(POTIONS).map(([k, p]) => ({
        label: p.name,
        value: k,
        default: k === potionKey
      }))
    );

  const row = new ActionRowBuilder().addComponents(select);
  return { embeds: [embed], components: [row] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pocion')
    .setDescription('Guía de alquimia de Minecraft con menú desplegable interactivo')
    .addStringOption(opt =>
      opt.setName('pocion')
        .setDescription('La poción que deseas elaborar (opcional)')
        .addChoices(
          { name: 'Poción de Fuerza', value: 'fuerza' },
          { name: 'Poción de Velocidad', value: 'velocidad' },
          { name: 'Poción de Invisibilidad', value: 'invisibilidad' },
          { name: 'Poción de Regeneración', value: 'regeneracion' },
          { name: 'Poción de Resistencia al Fuego', value: 'resistencia_fuego' },
          { name: 'Poción de Visión Nocturna', value: 'vision_nocturna' },
          { name: 'Poción de Curación Instantánea', value: 'curacion' },
          { name: 'Poción de Caída Lenta', value: 'caida_lenta' }
        )
        .setRequired(false)
    ),

  POTIONS,
  buildPocionPayload,

  async execute(interaction) {
    const key = interaction.options.getString('pocion') || 'fuerza';
    const payload = buildPocionPayload(interaction.client, key);
    await interaction.reply(payload);
  }
};
