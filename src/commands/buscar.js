// ============================================================
// Comando /buscar - Explorador Interactivo de Canciones
// YouTube & Spotify • Nebula Dev Studios
// ============================================================

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');
const { searchTracks, enqueueTrack } = require('../utils/musicManager');

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
    .setName('buscar')
    .setDescription('Explora opciones de canciones en YouTube y Spotify para elegir cuál reproducir')
    .addStringOption(option =>
      option
        .setName('termino')
        .setDescription('Nombre de la pista o artista a buscar')
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
            description: '> Debes estar conectado a un canal de voz para explorar y reproducir canciones.'
          })
        ],
        ephemeral: true
      });
    }

    const query = interaction.options.getString('termino').trim();
    await interaction.deferReply();

    const results = await searchTracks(query, 5);

    if (!results || results.length === 0) {
      return await interaction.editReply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Sin Resultados',
            description: `> No se encontraron coincidencias para: **\`${query}\`**.\nPrueba escribiendo el título completo o el nombre del artista.`
          })
        ]
      });
    }

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

    const optionsText = results.map((r, i) => {
      return `${emojis[i]} **${r.title}**\n${SYMBOLS.ARROW} \`⏱️ ${r.duration}\` • \`👤 ${r.channel}\` • \`🎧 ${r.source}\``;
    }).join('\n\n');

    const searchEmbed = createNebulaEmbed(interaction.client, {
      color: COLORS.ACCENT,
      title: `🔍 Resultados encontrados para: "${query.length > 40 ? query.slice(0, 37) + '...' : query}"`,
      thumbnail: results[0].thumbnail,
      description:
        `Aquí tienes las **${results.length} opciones más cercanas** en **YouTube & Spotify**:\n\n` +
        optionsText + '\n\n' +
        `> ⏳ *Tienes **15 segundos** para elegir una opción o se seleccionará la opción 1 automáticamente:*`,
      footerText: 'Nebula Music Engine • Explorador de audio'
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`buscar_select_${interaction.id}`)
      .setPlaceholder('🎵 Elige una de las canciones...')
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
        .setCustomId(`buscar_pick_0_${interaction.id}`)
        .setLabel('Opción 1')
        .setEmoji('1️⃣')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`buscar_cancel_${interaction.id}`)
        .setLabel('Cancelar')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Secondary)
    );

    const replyMsg = await interaction.editReply({
      embeds: [searchEmbed],
      components: [rowSelect, rowButtons]
    });

    // Colector con 15 segundos de espera
    const collector = replyMsg.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 15_000,
      max: 1
    });

    collector.on('collect', async i => {
      if (i.customId.startsWith('buscar_cancel_')) {
        return await i.update({
          embeds: [
            createNebulaEmbed(interaction.client, {
              color: COLORS.WARNING,
              title: '⏹️ Búsqueda Cancelada',
              description: '> Has cancelado la selección.'
            })
          ],
          components: []
        });
      }

      // Responder a Discord de inmediato (< 50ms) para evitar timeout de 3 segundos
      await i.deferUpdate().catch(() => {});

      let chosenIndex = 0;
      if (i.isStringSelectMenu()) {
        chosenIndex = parseInt(i.values[0], 10);
      } else if (i.customId.startsWith('buscar_pick_0_')) {
        chosenIndex = 0;
      }

      const chosenTrack = results[chosenIndex] || results[0];

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
        console.error('Error al reproducir desde /buscar:', err);
        await interaction.editReply({
          embeds: [
            createNebulaEmbed(interaction.client, {
              color: COLORS.ERROR,
              title: '❌ Error al Reproducir',
              description: '> No se pudo iniciar la transmisión.'
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
          console.warn('Timeout auto-play error:', e.message);
        }
      }
    });
  }
};
