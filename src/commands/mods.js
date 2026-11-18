// ============================================================
// Comando /mods - Guía de Optimización y Modding
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mods')
    .setDescription('Guía de mods esenciales de rendimiento y shaders recomendados para Nebula Launcher')
    .addStringOption(option =>
      option
        .setName('categoria')
        .setDescription('Elige qué tipo de mods deseas consultar')
        .setRequired(false)
        .addChoices(
          { name: '⚡ Máximo Rendimiento (FPS)', value: 'fps' },
          { name: '✨ Shaders & Gráficos HD', value: 'shaders' },
          { name: '🛠️ Calidad de Vida (QoL)', value: 'qol' }
        )
    ),

  async execute(interaction) {
    const category = interaction.options.getString('categoria') || 'fps';

    let embedData = {};

    if (category === 'fps') {
      embedData = {
        color: COLORS.SUCCESS,
        title: '⚡ Mods de Rendimiento Extremo (Recomendados)',
        description:
          `>>> **La pila de optimización moderna para Fabric / NeoForge.**\n` +
          `Multiplica tus FPS hasta por 4x y reduce la latencia de renderizado drásticamente en **Nebula Launcher**.`,
        fields: [
          {
            name: '1. Sodium / Embeddium',
            value: `${SYMBOLS.ARROW} Motor de renderizado moderno con OpenGL multicore. Aumento de hasta 400% FPS.`,
            inline: false
          },
          {
            name: '2. Lithium / Radium',
            value: `${SYMBOLS.ARROW} Optimización integral de la física del mundo, IA de criaturas y cálculo de chunks.`,
            inline: false
          },
          {
            name: '3. FerriteCore',
            value: `${SYMBOLS.ARROW} Disminuye el consumo de memoria RAM de Minecraft hasta un 50% sin pérdida de datos.`,
            inline: false
          },
          {
            name: '4. Entity Culling',
            value: `${SYMBOLS.ARROW} Omite el renderizado de mobs, cofres y bloques de entidades ocultos tras paredes.`,
            inline: false
          },
          {
            name: '5. ImmediatelyFast',
            value: `${SYMBOLS.ARROW} Acelera el dibujo de HUD, fuentes, inventarios y pantallas de interfaz gráfica.`,
            inline: false
          }
        ]
      };
    } else if (category === 'shaders') {
      embedData = {
        color: COLORS.ACCENT,
        title: '✨ Shaders & Mejoras Gráficas Cinemáticas',
        description:
          `>>> **Iluminación realista y agua dinámica sin sacrificar tu rendimiento.**\n` +
          `Compatibles al 100% con la aceleración gráfica de Nebula Launcher.`,
        fields: [
          {
            name: '1. Iris Shaders / Oculus',
            value: `${SYMBOLS.ARROW} El cargador de shaders de mayor velocidad del mundo, compatible nativamente con Sodium.`,
            inline: false
          },
          {
            name: '2. Complementary Reimagined',
            value: `${SYMBOLS.ARROW} Balance sublime: iluminación atmosférica de estilo Minecraft, agua con olas y sombras HD.`,
            inline: false
          },
          {
            name: '3. BSL Shaders',
            value: `${SYMBOLS.ARROW} Aspecto cinematográfico con niebla volumétrica, reflejos especulares y cielos estelares.`,
            inline: false
          },
          {
            name: '4. Solas Shader',
            value: `${SYMBOLS.ARROW} Iluminación volumétrica 3D optimizada para GPUs de gama media y laptops.`,
            inline: false
          }
        ]
      };
    } else {
      embedData = {
        color: COLORS.SECONDARY,
        title: '🛠️ Mods de Calidad de Vida (QoL)',
        description:
          `>>> **Comodidades imprescindibles para mejorar tu experiencia de juego diaria.**`,
        fields: [
          {
            name: '1. Zoomify',
            value: `${SYMBOLS.ARROW} Zoom cinemático fluido con rueda del mouse y transiciones suaves.`,
            inline: false
          },
          {
            name: '2. Simple Voice Chat',
            value: `${SYMBOLS.ARROW} Chat de voz posicional 3D en el juego con supresión de ruido y radio.`,
            inline: false
          },
          {
            name: '3. AppleSkin',
            value: `${SYMBOLS.ARROW} Muestra el nivel exacto de saturación y curación de cada alimento en tu inventario.`,
            inline: false
          },
          {
            name: '4. Mod Menu',
            value: `${SYMBOLS.ARROW} Añade un panel gráfico completo en el menú de pausa para configurar tus mods.`,
            inline: false
          }
        ]
      };
    }

    const embed = createNebulaEmbed(interaction.client, {
      ...embedData,
      footerText: 'Nebula Launcher v5.0.8 • Modding Guide'
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Descargar Nebula Launcher')
        .setStyle(ButtonStyle.Link)
        .setEmoji('🚀')
        .setURL('https://nebuladevstudios.com/launcher.html'),
      new ButtonBuilder()
        .setLabel('Explorar Modrinth')
        .setStyle(ButtonStyle.Link)
        .setEmoji('🌐')
        .setURL('https://modrinth.com/mods')
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
