// ============================================================
// Comando /play - Reproductor Universal (YouTube & Spotify)
// Búsqueda Inteligente de Títulos & Selector de Opciones Cercanas
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
const { resolveTrack, searchTracks, enqueueTrack, getSession } = require('../utils/musicManager');

function createPlayerEmbed(client, track, memberVoice, userTag, isPlayingNow, position) {
  return createNebulaEmbed(client, {
    color: COLORS.PRIMARY,
    title: isPlayingNow ? `🎶 Reproduciendo Ahora` : `⏳ Añadido a la Cola (#${position})`,
    thumbnail: track.thumbnail,
    description:
      `# **${track.title}**\n\n` +
      `${SYMBOLS.ARROW} **Origen:** \`${track.source}\`\n` +
      `${SYMBOLS.ARROW} **Duración:** \`${track.duration}\`\n` +
      `${SYMBOLS.ARROW} **Canal de Voz:** <#${memberVoice.id}>\n` +
      `${SYMBOLS.ARROW} **Solicitado por:** ${userTag}`,
    footerText: `Nebula Audio Player • ${track.source}`
  });
}

function createPlayerControlsRow(guildId) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('music_btn_toggle_pause')
      .setLabel('Pausar / Reanudar')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('⏯️'),
    new ButtonBuilder()
      .setCustomId('music_btn_skip')
      .setLabel('Saltar')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('⏭️'),
    new ButtonBuilder()
      .setCustomId('music_btn_queue')
      .setLabel('Ver Cola')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📜'),
    new ButtonBuilder()
      .setCustomId('music_btn_stop')
      .setLabel('Detener')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('⏹️')
  );

  return [row];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Busca y reproduce títulos en YouTube y Spotify con selector de opciones cercanas')
    .addStringOption(option =>
      option
        .setName('cancion')
        .setDescription('Título de la canción, link de YouTube o link de Spotify')
        .setRequired(true)
    ),

  async execute(interaction) {
    const memberVoice = interaction.member.voice.channel;
    if (!memberVoice) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '🔇 Canal de Voz Requerido',
            description: '> Debes estar conectado a un canal de voz para que **Nebula Bot** reproduzca música.'
          })
        ],
        ephemeral: true
      });
    }

    const query = interaction.options.getString('cancion').trim();

    await interaction.deferReply();

    // 1. Si es un enlace directo (YouTube o Spotify)
    const isUrl = query.startsWith('http://') || query.startsWith('https://');
    if (isUrl) {
      const track = await resolveTrack(query);
      if (!track) {
        return await interaction.editReply({
          embeds: [
            createNebulaEmbed(interaction.client, {
              color: COLORS.ERROR,
              title: '❌ Sin Resultados / Video No Disponible',
              description:
                `> No se pudo obtener la pista de audio para el enlace:\n> **\`${query}\`**\n\n` +
                `${SYMBOLS.ARROW} Verifica que el video o canción esté disponible públicamente y no tenga restricciones de edad ni esté eliminado.\n` +
                `${SYMBOLS.ARROW} También puedes buscar directamente por nombre (ej: \`/play pokito daddy yankee\`).`
            })
          ]
        });
      }

      try {
        const session = getSession(interaction.guildId);
        const isPlayingNow = !session || !session.currentTrack;
        const position = session ? session.queue.length + 1 : 1;

        const embed = createPlayerEmbed(
          interaction.client,
          track,
          memberVoice,
          interaction.user.tag,
          isPlayingNow,
          position
        );

        // Responder de inmediato en Discord (<300ms)
        await interaction.editReply({
          embeds: [embed],
          components: createPlayerControlsRow(interaction.guildId)
        });

        // Conectar e iniciar la transmisión en segundo plano
        enqueueTrack(
          interaction.guild,
          memberVoice,
          interaction.channel,
          track,
          interaction.user.tag
        ).catch(err => {
          console.error('Error al reproducir enlace directo:', err);
        });

        return;
      } catch (err) {
        console.error('Error al reproducir enlace directo:', err);
        return await interaction.editReply({
          embeds: [
            createNebulaEmbed(interaction.client, {
              color: COLORS.ERROR,
              title: '❌ Error de Transmisión',
              description: '> Ocurrió un error inesperado al conectar al canal de voz.'
            })
          ]
        });
      }
    }

    // 2. Búsqueda por título en YouTube y Spotify (<300ms)
    const results = await searchTracks(query, 5);

    if (!results || results.length === 0) {
      return await interaction.editReply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Sin Resultados Encontrados',
            description: `> No se encontraron canciones coincidentes en **Spotify** ni **YouTube** para: **\`${query}\`**.\n\nIntenta escribir el nombre del artista junto al título de la canción.`
          })
        ]
      });
    }

    // Reproducir de inmediato la mejor coincidencia encontrada
    const track = results[0];
    try {
      const session = getSession(interaction.guildId);
      const isPlayingNow = !session || !session.currentTrack;
      const position = session ? session.queue.length + 1 : 1;

      const embed = createPlayerEmbed(
        interaction.client,
        track,
        memberVoice,
        interaction.user.tag,
        isPlayingNow,
        position
      );

      // Responder a Discord de INMEDIATO (<500ms) para respuesta ultrarrápida
      await interaction.editReply({
        embeds: [embed],
        components: createPlayerControlsRow(interaction.guildId)
      });

      // Conectar e iniciar el audio en segundo plano
      enqueueTrack(
        interaction.guild,
        memberVoice,
        interaction.channel,
        track,
        interaction.user.tag
      ).catch(err => {
        console.error('Error al reproducir pista:', err);
      });

      return;
    } catch (err) {
      console.error('Error al reproducir pista:', err);
      return await interaction.editReply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Error de Transmisión',
            description: '> Ocurrió un error inesperado al conectar al canal de voz.'
          })
        ]
      });
    }
  }
};
