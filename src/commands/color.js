// ============================================================
// Comando /color - Tabla de Códigos de Formato y Color Minecraft
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('color')
    .setDescription('Consulta la tabla interactiva de códigos de colores ANSI y formato de Minecraft'),

  async execute(interaction) {
    const ansiPalette =
      "```ansi\n" +
      "\u001b[0;30m&0  Negro\u001b[0m           \u001b[1;34m&9  Azul Claro\u001b[0m\n" +
      "\u001b[0;34m&1  Azul Oscuro\u001b[0m     \u001b[1;32m&a  Verde Lima\u001b[0m\n" +
      "\u001b[0;32m&2  Verde Oscuro\u001b[0m    \u001b[1;36m&b  Aguamarina\u001b[0m\n" +
      "\u001b[0;36m&3  Cian Oscuro\u001b[0m     \u001b[1;31m&c  Rojo Claro\u001b[0m\n" +
      "\u001b[0;31m&4  Rojo Oscuro\u001b[0m     \u001b[1;35m&d  Magenta / Rosa\u001b[0m\n" +
      "\u001b[0;35m&5  Morado / Violeta\u001b[0m\u001b[1;33m&e  Amarillo\u001b[0m\n" +
      "\u001b[0;33m&6  Dorado / Oro\u001b[0m    \u001b[1;37m&f  Blanco Puro\u001b[0m\n" +
      "\u001b[0;37m&7  Gris Claro\u001b[0m      \u001b[1;30m&8  Gris Oscuro\u001b[0m\n" +
      "```";

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.ACCENT,
      title: '🎨 Paleta de Colores & Formato de Minecraft',
      description:
        `>>> Utiliza el prefijo \`&\` o \`§\` seguido de la letra o número en el chat, carteles, títulos y motd de servidores.\n` +
        `**Previsualización en tiempo real en Discord:**\n${ansiPalette}`,
      fields: [
        {
          name: '✨ Códigos de Efecto & Formato',
          value:
            '`&l` **Negrita (Bold)** • `&o` *Cursiva (Italic)*\n' +
            '`&n` __Subrayado__ • `&m` ~~Tachado~~\n' +
            '`&k` ▓▒░ Ofuscado / Mágico ░▒▓\n' +
            '`&r` Restablecer formato predeterminado',
          inline: false
        },
        {
          name: '🌈 Colores Hexadecimales RGB (1.16+)',
          value:
            'En servidores Spigot/Paper/Purpur modernos puedes emplear colores hex de 16 millones de tonos:\n' +
            '• Formato estándar: `&#8B5CF6` (Púrpura Nebula) o `&#38BDF8` (Cian Espacial)\n' +
            '• En minimessage / Adventure: `<#8b5cf6>Tu Texto Cósmico</#8b5cf6>`',
          inline: false
        }
      ],
      footerText: 'Nebula Bot • Minecraft Color Cheatsheet'
    });

    await interaction.reply({ embeds: [embed] });
  }
};
