// ============================================================
// Comando /traducir - Traductor Universal Multilenguaje
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

const LANGUAGES = [
  { name: 'Español (ES)', value: 'es' },
  { name: 'Inglés (EN)', value: 'en' },
  { name: 'Portugués (PT)', value: 'pt' },
  { name: 'Francés (FR)', value: 'fr' },
  { name: 'Alemán (DE)', value: 'de' },
  { name: 'Italiano (IT)', value: 'it' },
  { name: 'Japonés (JA)', value: 'ja' },
  { name: 'Ruso (RU)', value: 'ru' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('traducir')
    .setDescription('Traduce texto entre diferentes idiomas instantáneamente')
    .addStringOption(opt =>
      opt.setName('texto')
        .setDescription('Texto o frase a traducir')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('destino')
        .setDescription('Idioma al que deseas traducir')
        .setRequired(true)
        .addChoices(
          { name: 'Español (ES)', value: 'es' },
          { name: 'Inglés (EN)', value: 'en' },
          { name: 'Portugués (PT)', value: 'pt' },
          { name: 'Francés (FR)', value: 'fr' },
          { name: 'Alemán (DE)', value: 'de' },
          { name: 'Italiano (IT)', value: 'it' },
          { name: 'Japonés (JA)', value: 'ja' },
          { name: 'Ruso (RU)', value: 'ru' }
        )
    )
    .addStringOption(opt =>
      opt.setName('origen')
        .setDescription('Idioma original del texto (opcional, detectado auto por defecto)')
        .setRequired(false)
        .addChoices(
          { name: 'Autodetectar', value: 'auto' },
          { name: 'Español (ES)', value: 'es' },
          { name: 'Inglés (EN)', value: 'en' },
          { name: 'Portugués (PT)', value: 'pt' },
          { name: 'Francés (FR)', value: 'fr' }
        )
    ),

  async execute(interaction) {
    const text = interaction.options.getString('texto');
    const targetLang = interaction.options.getString('destino');
    const sourceLang = interaction.options.getString('origen') || 'auto';

    await interaction.deferReply();

    try {
      const langpair = sourceLang === 'auto' ? `autodetect|${targetLang}` : `${sourceLang}|${targetLang}`;
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Servicio de traducción no disponible');
      const data = await res.json();

      const translatedText = data?.responseData?.translatedText;
      if (!translatedText) throw new Error('Respuesta de traducción vacía');

      const embed = createNebulaEmbed(interaction.client, {
        color: COLORS.PRIMARY,
        title: '🌐 Traducción Universal Nebula',
        description:
          `### 📝 Texto Original (\`${sourceLang.toUpperCase()}\`):\n` +
          `\`\`\`text\n${text}\n\`\`\`\n` +
          `### 🎯 Traducción (\`${targetLang.toUpperCase()}\`):\n` +
          `\`\`\`text\n${translatedText}\n\`\`\`\n` +
          `${SYMBOLS.ARROW} **Calidad de coincidencia:** \`${Math.round((data.responseData.match || 1) * 100)}%\``,
        footerText: 'Nebula Language Bridge • Traducción en Tiempo Real'
      });

      return await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[Traducir Error]', err.message);
      return await interaction.editReply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Error de Traducción',
            description: '> No se pudo completar la traducción en este momento. Inténtalo de nuevo más tarde.'
          })
        ]
      });
    }
  }
};
