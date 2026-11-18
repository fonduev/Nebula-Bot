// ============================================================
// Comando /mcuser - Perfil Integral de Jugador Minecraft
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mcuser')
    .setDescription('Consulta el perfil completo de un jugador de Minecraft: UUID, skin 3D, cabeza y textura')
    .addStringOption(option =>
      option
        .setName('usuario')
        .setDescription('Nombre de usuario de Minecraft o UUID')
        .setRequired(true)
    ),

  async execute(interaction) {
    const input = interaction.options.getString('usuario').trim();
    await interaction.deferReply();

    try {
      // 1. Consultar UUID y perfil oficial a través de la API de Mojang / PlayerDB
      const res = await fetch(`https://playerdb.co/api/player/minecraft/${encodeURIComponent(input)}`);
      const data = await res.json();

      if (!data.success || !data.data?.player) {
        return await interaction.editReply({
          embeds: [
            createNebulaEmbed(interaction.client, {
              color: COLORS.ERROR,
              title: `❌ Jugador No Encontrado | ${input}`,
              description:
                `> No se encontró ninguna cuenta oficial de Minecraft con el nombre o UUID **\`${input}\`**.\n\n` +
                `${SYMBOLS.ARROW} Verifica que el nombre esté bien escrito y corresponda a una cuenta oficial de Mojang / Microsoft.\n` +
                `${SYMBOLS.ARROW} Los nombres distinguen entre mayúsculas y minúsculas en servidores antiguos.`,
              footerText: 'Nebula PlayerDB Lookup'
            })
          ]
        });
      }

      const player = data.data.player;
      const username = player.username;
      const rawUuid = player.raw_id;
      const formattedUuid = player.id;
      const avatarUrl = player.avatar || `https://mc-heads.net/avatar/${username}/128`;
      const skinUrl = player.skin_texture;
      const body3dUrl = `https://mc-heads.net/body/${username}/right`;

      const embed = createNebulaEmbed(interaction.client, {
        color: COLORS.PRIMARY,
        title: `🎮 Perfil de Jugador | ${username}`,
        thumbnail: avatarUrl,
        image: body3dUrl,
        description:
          `>>> **Información oficial de Mojang / Microsoft.**\n` +
          `Datos de cuenta y modelo de renderizado tridimensional en tiempo real.`,
        fields: [
          {
            name: '👤 Nombre de Usuario',
            value: `\`${username}\``,
            inline: true
          },
          {
            name: '🛡️ Estado de Cuenta',
            value: '`Oficial (Premium)` ✅',
            inline: true
          },
          {
            name: '🎨 Textura de Skin',
            value: skinUrl ? `[Descargar Archivo](${skinUrl})` : `\`Por defecto\``,
            inline: true
          },
          {
            name: '🔑 UUID Formateado (Con Guiones)',
            value: `\`${formattedUuid}\``,
            inline: false
          },
          {
            name: '🧩 UUID en Bruto (Sin Guiones)',
            value: `\`${rawUuid}\``,
            inline: false
          }
        ],
        footerText: `Nebula Player Database • UUID: ${rawUuid}`
      });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Ver en NameMC')
          .setStyle(ButtonStyle.Link)
          .setEmoji('🌐')
          .setURL(`https://namemc.com/profile/${username}`),
        new ButtonBuilder()
          .setLabel('Descargar Textura .PNG')
          .setStyle(ButtonStyle.Link)
          .setEmoji('👕')
          .setURL(skinUrl || `https://mc-heads.net/download/${username}`),
        new ButtonBuilder()
          .setCustomId(`btn_mcuser_head_${username}`)
          .setLabel('Comando Cabeza /give')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🗿')
      );

      await interaction.editReply({ embeds: [embed], components: [row] });

    } catch (err) {
      console.error('Error en /mcuser:', err);
      return await interaction.editReply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: `❌ Error al Consultar Jugador`,
            description: `> Ocurrió un error inesperado al contactar con el servicio de perfiles de Minecraft.`
          })
        ]
      });
    }
  }
};
