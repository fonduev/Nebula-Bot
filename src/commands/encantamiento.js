// ============================================================
// Comando /encantamiento - Guía de Encantamientos de Minecraft
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

const ENCHANTMENTS = {
  filo: {
    name: 'Filo (Sharpness)',
    maxLevel: 'V',
    items: 'Espada, Hacha',
    incompatible: 'Golpeo (Smite), Perdición de los Artrópodos (Bane of Arthropods)',
    effect: 'Aumenta el daño de ataque cuerpo a cuerpo: en Java Edition suma 0.5 * nivel + 0.5 de daño extra (hasta +3 de daño en Filo V).',
    tip: 'Es el encantamiento de daño general más versátil contra cualquier entidad.'
  },
  proteccion: {
    name: 'Protección (Protection)',
    maxLevel: 'IV',
    items: 'Casco, Pechera, Pantalones, Botas',
    incompatible: 'Protección contra el Fuego, Protección contra Proyectiles, Protección contra Explosiones',
    effect: 'Reduce un 4% de daño recibido por cada nivel de encantamiento (hasta 16% por pieza, máximo 64% total con 4 piezas Protección IV).',
    tip: 'Un set completo de Protección IV es el estándar definitivo en supervivencia y PvP.'
  },
  eficiencia: {
    name: 'Eficiencia (Efficiency)',
    maxLevel: 'V',
    items: 'Pico, Pala, Hacha, Azada, Tijeras',
    incompatible: 'Ninguno',
    effect: 'Aumenta drásticamente la velocidad al picar bloques válidos. Con Pico de Netherite Eficiencia V y Faro de Prisa II (Haste II) se logra minería instantánea (Insta-Mine) en piedra pura.',
    tip: 'Ideal para vaciar perímetros y minar túneles a toda velocidad.'
  },
  fortuna: {
    name: 'Fortuna (Fortune)',
    maxLevel: 'III',
    items: 'Pico, Pala, Hacha, Azada',
    incompatible: 'Toque de Seda (Silk Touch)',
    effect: 'Multiplica la cantidad de drops minerales: diamantes, esmeraldas, carbón, lapislázuli, redstone y cobre. En Fortuna III puedes obtener hasta 4 diamantes de una sola mena (promedio +120% de rendimiento).',
    tip: 'No funciona con hierro ni oro en bruto fundidos; sí funciona con sus menas crudas desde la 1.17+.'
  },
  toque_de_seda: {
    name: 'Toque de Seda (Silk Touch)',
    maxLevel: 'I',
    items: 'Pico, Pala, Hacha, Azada',
    incompatible: 'Fortuna (Fortune)',
    effect: 'Hace que los bloques soltados caigan exactamente como son en lugar de su drop usual: menas puras, cofres de ender, hielo azul, bloques de césped, colmenas de abejas llenas, etc.',
    tip: 'Indispensable para transportar hielo sin que se convierta en agua y para recoger Cofres de Ender intactos.'
  },
  reparacion: {
    name: 'Reparación (Mending)',
    maxLevel: 'I',
    items: 'Cualquier arma, armadura o herramienta con durabilidad',
    incompatible: 'Infinidad (en Arcos)',
    effect: 'Restaura 2 puntos de durabilidad por cada orbe de XP recogido mientras sostienes o llevas equipado el ítem.',
    tip: 'Permite que tus herramientas y armaduras de Netherite nunca se rompan mientras uses granjas de XP.'
  },
  infinidad: {
    name: 'Infinidad (Infinity)',
    maxLevel: 'I',
    items: 'Arco',
    incompatible: 'Reparación (Mending)',
    effect: 'Permite disparar flechas de forma ilimitada siempre y cuando tengas al menos una flecha regular en el inventario.',
    tip: 'No funciona con flechas espectrales ni flechas con efectos de pociones.'
  },
  caida_de_pluma: {
    name: 'Caída de Pluma (Feather Falling)',
    maxLevel: 'IV',
    items: 'Botas',
    incompatible: 'Ninguno',
    effect: 'Reduce el daño por caída en un 12% por nivel (hasta un 48% menos de daño en nivel IV) y amortigua el daño al teletransportarte con Perlas de Ender.',
    tip: 'Salva vidas constantemente en el Nether, cuevas profundas y volando con Élitros.'
  }
};

function buildEncantamientoPayload(client, enchantKey) {
  const enc = ENCHANTMENTS[enchantKey] || ENCHANTMENTS.filo;

  const embed = createNebulaEmbed(client, {
    color: 0x8b5cf6,
    title: `✨ Encantamiento: ${enc.name}`,
    description:
      `>>> **Equipo Compatible:**\n${SYMBOLS.ARROW} \`${enc.items}\`\n\n` +
      `### 📊 Datos y Niveles:\n` +
      `${SYMBOLS.ARROW} **Nivel Máximo:** \`${enc.maxLevel}\`\n` +
      `${SYMBOLS.ARROW} **Incompatible con:** \`${enc.incompatible}\`\n\n` +
      `### ⚡ Efecto:\n` +
      `${enc.effect}\n\n` +
      `### 💡 Consejo Táctico:\n` +
      `*${enc.tip}*`,
    footerText: 'Nebula Enchantment Guide • Selecciona un encantamiento abajo'
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId('select_encantamiento_item')
    .setPlaceholder('✨ Selecciona un encantamiento para ver sus detalles...')
    .addOptions(
      Object.entries(ENCHANTMENTS).map(([k, e]) => ({
        label: e.name,
        value: k,
        description: `Máximo: ${e.maxLevel} • ${e.items.slice(0, 30)}`,
        default: k === enchantKey
      }))
    );

  const row = new ActionRowBuilder().addComponents(select);
  return { embeds: [embed], components: [row] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('encantamiento')
    .setDescription('Consulta estadísticas y compatibilidad de encantamientos de Minecraft con menú interactivo')
    .addStringOption(opt =>
      opt.setName('encantamiento')
        .setDescription('El encantamiento que deseas consultar (opcional)')
        .addChoices(
          { name: 'Filo (Sharpness)', value: 'filo' },
          { name: 'Protección (Protection)', value: 'proteccion' },
          { name: 'Eficiencia (Efficiency)', value: 'eficiencia' },
          { name: 'Fortuna (Fortune)', value: 'fortuna' },
          { name: 'Toque de Seda (Silk Touch)', value: 'toque_de_seda' },
          { name: 'Reparación (Mending)', value: 'reparacion' },
          { name: 'Infinidad (Infinity)', value: 'infinidad' },
          { name: 'Caída de Pluma (Feather Falling)', value: 'caida_de_pluma' }
        )
        .setRequired(false)
    ),

  ENCHANTMENTS,
  buildEncantamientoPayload,

  async execute(interaction) {
    const key = interaction.options.getString('encantamiento') || 'filo';
    const payload = buildEncantamientoPayload(interaction.client, key);
    await interaction.reply(payload);
  }
};
