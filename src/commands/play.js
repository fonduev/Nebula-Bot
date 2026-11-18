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
const { resolveTrack, searchTracks, enqueueTrack } = require('../utils/musicManager');

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
              title: '❌ Sin Resultados',
              description: `> No se pudo encontrar ninguna pista de audio para: **\`${query}\`**.\nVerifica que el título o enlace sea accesible públicamente.`
            })
          ]
        });
      }

      try {
        const result = await enqueueTrack(
          interaction.guild,
          memberVoice,
          interaction.channel,
          track,
          interaction.user.tag
        );

        const embed = createPlayerEmbed(
          interaction.client,
          track,
          memberVoice,
          interaction.user.tag,
          result.isPlayingNow,
          result.position
        );

        return await interaction.editReply({
          embeds: [embed],
          components: createPlayerControlsRow(interaction.guildId)
        });
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

    // 2. Búsqueda por título en YouTube y Spotify
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

    // Helper interno para reproducir pista directamente
    async function playSelectedTrack(track) {
      try {
        const result = await enqueueTrack(
          interaction.guild,
          memberVoice,
          interaction.channel,
          track,
          interaction.user.tag
        );

        const embed = createPlayerEmbed(
          interaction.client,
          track,
          memberVoice,
          interaction.user.tag,
          result.isPlayingNow,
          result.position
        );

        return await interaction.editReply({
          embeds: [embed],
          components: createPlayerControlsRow(interaction.guildId)
        });
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

    // Si solo hay 1 resultado, reproducir de inmediato
    if (results.length === 1) {
      return await playSelectedTrack(results[0]);
    }

    // Verificar si el primer resultado tiene título idéntico al buscado
    const norm = s => s.toLowerCase().replace(/[^a-z0-9áéíóúñ]/gi, '').trim();
    const isExactMatch = norm(results[0].title) === norm(query);

    if (isExactMatch) {
      return await playSelectedTrack(results[0]);
    }

    // 3. No es coincidencia 100% exacta: Mostrar lista interactiva de las opciones más cercanas
    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

    const optionsText = results.map((r, i) => {
      return `${emojis[i]} **${r.title}**\n${SYMBOLS.ARROW} \`⏱️ ${r.duration}\` • \`👤 ${r.channel}\` • \`🎧 ${r.source}\``;
    }).join('\n\n');

    const searchEmbed = createNebulaEmbed(interaction.client, {
      color: COLORS.ACCENT,
      title: `🔍 Opciones más cercanas para: "${query.length > 40 ? query.slice(0, 37) + '...' : query}"`,
      thumbnail: results[0].thumbnail,
      description:
        `No se encontró un título idéntico exacto. Aquí tienes las **${results.length} opciones más cercanas** encontradas en **YouTube & Spotify**:\n\n` +
        optionsText + '\n\n' +
        `> ⏳ *Tienes **15 segundos** para elegir una opción o se reproducirá automáticamente la opción 1:*`,
      footerText: 'Nebula Music Engine • Búsqueda inteligente Spotify & YouTube'
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`music_search_select_${interaction.id}`)
      .setPlaceholder('🎵 Selecciona una canción de la lista...')
      .addOptions(
        results.map((r, i) => ({
          label: r.title.length > 95 ? r.title.slice(0, 92) + '...' : r.title,
          description: `⏱️ ${r.duration} | 👤 ${r.channel}`.slice(0, 95),
          value: `${i}`,
          emoji: emojis[i]
        }))
      );

    const rowSelect = new ActionRowBuilder().addComponents(selectMenu);

    const rowButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`music_search_pick_0_${interaction.id}`)
        .setLabel('Reproducir Opción 1')
        .setEmoji('1️⃣')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`music_search_cancel_${interaction.id}`)
        .setLabel('Cancelar')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Secondary)
    );

    const replyMsg = await interaction.editReply({
      embeds: [searchEmbed],
      components: [rowSelect, rowButtons]
    });

    // Crear colector de componentes exclusivo para este usuario (15 segundos)
    const collector = replyMsg.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 15_000,
      max: 1
    });

    collector.on('collect', async i => {
      if (i.customId.startsWith('music_search_cancel_')) {
        return await i.update({
          embeds: [
            createNebulaEmbed(interaction.client, {
              color: COLORS.WARNING,
              title: '⏹️ Búsqueda Cancelada',
              description: '> Has cancelado la selección de canciones.'
            })
          ],
          components: []
        });
      }

      let chosenIndex = 0;
      if (i.isStringSelectMenu()) {
        chosenIndex = parseInt(i.values[0], 10);
      } else if (i.customId.startsWith('music_search_pick_0_')) {
        chosenIndex = 0;
      }

      const chosenTrack = results[chosenIndex] || results[0];

      // Acuse de recibo instantáneo a Discord (<50ms): retira botones y muestra estado de carga
      await i.update({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.PRIMARY,
            title: '⏳ Cargando Pista Seleccionada...',
            thumbnail: chosenTrack.thumbnail,
            description:
              `# **${chosenTrack.title}**\n\n` +
              `> ${SYMBOLS.ARROW} Conectando a <#${memberVoice.id}>...\n` +
              `> ${SYMBOLS.ARROW} Obteniendo transmisión de audio sin latencia...`,
            footerText: 'Nebula Music Engine • Conexión en curso'
          })
        ],
        components: []
      }).catch(() => {});

      try {
        const result = await enqueueTrack(
          interaction.guild,
          memberVoice,
          interaction.channel,
          chosenTrack,
          interaction.user.tag
        );

        const playerEmbed = createPlayerEmbed(
          interaction.client,
          chosenTrack,
          memberVoice,
          interaction.user.tag,
          result.isPlayingNow,
          result.position
        );

        await interaction.editReply({
          embeds: [playerEmbed],
          components: createPlayerControlsRow(interaction.guildId)
        });
      } catch (err) {
        console.error('Error al reproducir pista seleccionada:', err);
        await interaction.editReply({
          embeds: [
            createNebulaEmbed(interaction.client, {
              color: COLORS.ERROR,
              title: '❌ Error al Reproducir',
              description: '> No se pudo iniciar la transmisión de la pista seleccionada.'
            })
          ],
          components: []
        });
      }
    });

    collector.on('end', async (collected, reason) => {
      if (collected.size === 0 && reason === 'time') {
        try {
          const autoTrack = results[0];
          const result = await enqueueTrack(
            interaction.guild,
            memberVoice,
            interaction.channel,
            autoTrack,
            interaction.user.tag
          );

          const autoEmbed = createPlayerEmbed(
            interaction.client,
            autoTrack,
            memberVoice,
            interaction.user.tag,
            result.isPlayingNow,
            result.position
          );

          await interaction.editReply({
            embeds: [autoEmbed],
            components: createPlayerControlsRow(interaction.guildId)
          });
        } catch (e) {
          console.warn('Error en selección automática de timeout:', e.message);
        }
      }
    });
  }
};
