// ============================================================
// Comando /clima - Reporte Meteorológico Mundial en Tiempo Real
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clima')
    .setDescription('Consulta el clima en vivo, temperatura y pronóstico de cualquier ciudad o país')
    .addStringOption(opt =>
      opt.setName('ciudad')
        .setDescription('Nombre de la ciudad o localidad (ej: Madrid, Buenos Aires, Ciudad de México, Lima)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const city = interaction.options.getString('ciudad').trim();
    await interaction.deferReply();

    try {
      const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'NebulaBot/1.0' } });
      if (!res.ok) throw new Error('Servicio de clima no disponible');

      const data = await res.json();
      const current = data?.current_condition?.[0];
      const area = data?.nearest_area?.[0];

      if (!current || !area) throw new Error('Datos de clima no encontrados');

      const locationName = `${area.areaName?.[0]?.value || city}, ${area.country?.[0]?.value || ''}`;
      const tempC = current.temp_C;
      const tempF = current.temp_F;
      const feelsC = current.FeelsLikeC;
      const feelsF = current.FeelsLikeF;
      const humidity = current.humidity;
      const windKmph = current.windspeedKmph;
      const conditionDesc = current.lang_es?.[0]?.value || current.weatherDesc?.[0]?.value || 'Despejado';
      const uvIndex = current.uvIndex;

      const embed = createNebulaEmbed(interaction.client, {
        color: COLORS.PRIMARY,
        title: `🌤️ Clima Actual en ${locationName}`,
        description:
          `# **${tempC}°C / ${tempF}°F**\n` +
          `**${conditionDesc}** (Sensación térmica: \`${feelsC}°C\`)\n\n` +
          `${SYMBOLS.ARROW} **Humedad:** \`${humidity}%\`\n` +
          `${SYMBOLS.ARROW} **Viento:** \`${windKmph} km/h\`\n` +
          `${SYMBOLS.ARROW} **Índice UV:** \`${uvIndex}\`\n` +
          `${SYMBOLS.ARROW} **Presión:** \`${current.pressure} hPa\`\n` +
          `${SYMBOLS.ARROW} **Visibilidad:** \`${current.visibility} km\``,
        footerText: `Nebula Weather Engine • Datos meteorológicos en vivo`
      });

      return await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[Clima Error]', err.message);
      return await interaction.editReply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Ciudad No Encontrada',
            description: `> No se pudo obtener información del clima para: **\`${city}\`**.\nVerifica que el nombre de la ciudad esté escrito correctamente.`
          })
        ]
      });
    }
  }
};
