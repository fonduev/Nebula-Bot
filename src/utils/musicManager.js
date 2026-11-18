// ============================================================
// Nebula Bot - Gestor Avanzado de Música y Canales de Voz
// Motor Directo FFmpeg + yt-dlp (YouTube & Spotify)
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType
} = require('@discordjs/voice');
const { spawn } = require('child_process');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const play = require('play-dl');
const ytdlPath = path.join(__dirname, '..', '..', 'bin', 'yt-dlp.exe');

// Almacén de sesiones activas (guildId -> Session)
const activeSessions = new Map();

/**
 * Extrae la URL directa de audio mediante yt-dlp
 */
function getDirectAudioUrl(targetQuery) {
  return new Promise(resolve => {
    const proc = spawn(ytdlPath, [
      '--no-warnings',
      '-g',
      '-f', 'bestaudio/best',
      '--no-playlist',
      targetQuery
    ]);

    let url = '';
    proc.stdout.on('data', d => { url += d.toString(); });
    proc.on('close', code => {
      if (code === 0 && url.trim()) {
        resolve(url.trim().split('\n')[0]);
      } else {
        resolve(null);
      }
    });
    proc.on('error', () => resolve(null));
  });
}

/**
 * Resuelve la metadata de una búsqueda, link de YouTube o Spotify
 */
async function resolveTrack(query) {
  query = query.trim();

  // 1. Detectar si es un enlace de Spotify
  if (query.includes('spotify.com/track/')) {
    try {
      const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(query)}`);
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        const searchQuery = `ytsearch1:${data.title}`;
        const ytTrack = await extractWithYtdl(searchQuery);
        if (ytTrack) {
          ytTrack.source = 'Spotify (vía YouTube)';
          if (data.thumbnail_url) ytTrack.thumbnail = data.thumbnail_url;
          return ytTrack;
        }
      }
    } catch (e) {
      console.warn('Error resolviendo Spotify oEmbed:', e.message);
    }
  }

  // 3. Detectar si es un enlace de audio directo (.mp3, .ogg, etc.)
  if (/\.(mp3|ogg|wav|aac)($|\?)/i.test(query)) {
    return {
      title: query.split('/').pop().split('?')[0] || 'Archivo de Audio Web',
      url: query,
      duration: 'En Vivo',
      thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500',
      source: 'Enlace Directo',
      isDirectStream: true
    };
  }

  // 4. Si es un enlace de YouTube o búsqueda de texto
  let targetQuery = query;
  if (!query.startsWith('http://') && !query.startsWith('https://')) {
    targetQuery = `ytsearch1:${query}`;
  }

  const ytTrack = await extractWithYtdl(targetQuery);
  if (ytTrack) {
    ytTrack.source = 'YouTube';
    return ytTrack;
  }

  return null;
}

/**
 * Utiliza yt-dlp para extraer metadata rápida de YouTube
 */
function extractWithYtdl(query) {
  return new Promise(resolve => {
    const proc = spawn(ytdlPath, [
      '--no-warnings',
      '--print', '%(title)s|||%(duration_string)s|||%(thumbnail)s|||%(webpage_url)s',
      '--no-playlist',
      query
    ]);

    let output = '';
    proc.stdout.on('data', data => { output += data.toString(); });

    proc.on('close', code => {
      if (code === 0 && output.trim()) {
        const parts = output.trim().split('|||');
        resolve({
          title: parts[0] || 'Canción Desconocida',
          duration: parts[1] || 'En vivo',
          thumbnail: parts[2] || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
          webUrl: parts[3] || query,
          targetQuery: parts[3] || query,
          isDirectStream: false
        });
      } else {
        resolve(null);
      }
    });

    proc.on('error', err => {
      console.error('Error ejecutando yt-dlp:', err);
      resolve(null);
    });
  });
}

/**
 * Busca múltiples pistas coincidentes en YouTube y Spotify
 */
async function searchTracks(query, limit = 5) {
  query = query.trim();

  // 1. Detectar enlaces de Spotify (track, album, playlist)
  if (query.includes('spotify.com/')) {
    try {
      const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(query)}`);
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        const searchTitle = data.title;
        const ytResults = await play.search(searchTitle, { limit: 1 });
        if (ytResults && ytResults.length > 0) {
          const first = ytResults[0];
          return [{
            title: data.title,
            duration: first.durationRaw || 'Desconocida',
            thumbnail: data.thumbnail_url || first.thumbnails?.[0]?.url,
            webUrl: first.url,
            targetQuery: first.url,
            source: 'Spotify (vía YouTube)',
            channel: first.channel?.name || 'Spotify',
            isDirectStream: false
          }];
        }
      }
    } catch (e) {
      console.warn('[Música] Error resolviendo Spotify:', e.message);
    }
  }

  // 2. Si es link directo de YouTube o audio
  if (query.startsWith('http://') || query.startsWith('https://')) {
    const single = await resolveTrack(query);
    if (single) return [single];
    return [];
  }

  // 3. Búsqueda por texto en YouTube y Spotify
  try {
    const playResults = await play.search(query, { limit });
    if (playResults && playResults.length > 0) {
      return playResults.map(r => {
        const titleLower = r.title.toLowerCase();
        const isSpotifyTopic = r.channel?.name?.toLowerCase().includes('topic') || titleLower.includes('official audio');
        return {
          title: r.title,
          duration: r.durationRaw || 'En vivo',
          thumbnail: r.thumbnails?.[0]?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
          webUrl: r.url,
          targetQuery: r.url,
          source: isSpotifyTopic ? 'Spotify / YouTube Music' : 'YouTube',
          channel: r.channel?.name || 'Artista',
          isDirectStream: false
        };
      });
    }
  } catch (err) {
    console.warn('[Música] Error en play.search, ejecutando fallback yt-dlp:', err.message);
  }

  // 4. Fallback con yt-dlp si play.search falla
  try {
    const ytdlResults = await extractMultipleWithYtdl(`ytsearch${limit}:${query}`);
    return ytdlResults;
  } catch (e) {
    console.error('[Música] Error en fallback yt-dlp:', e);
    return [];
  }
}

/**
 * Utiliza yt-dlp para extraer múltiples resultados
 */
function extractMultipleWithYtdl(searchQuery) {
  return new Promise(resolve => {
    const proc = spawn(ytdlPath, [
      '--no-warnings',
      '--print', '%(title)s|||%(duration_string)s|||%(thumbnail)s|||%(webpage_url)s|||%(channel)s',
      '--no-playlist',
      searchQuery
    ]);

    let output = '';
    proc.stdout.on('data', data => { output += data.toString(); });

    proc.on('close', code => {
      if (code === 0 && output.trim()) {
        const lines = output.trim().split('\n').filter(l => l.trim().length > 0);
        const tracks = lines.map(line => {
          const parts = line.split('|||');
          return {
            title: parts[0] || 'Canción Desconocida',
            duration: parts[1] || 'En vivo',
            thumbnail: parts[2] || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
            webUrl: parts[3] || '',
            targetQuery: parts[3] || '',
            source: 'YouTube',
            channel: parts[4] || 'Artista',
            isDirectStream: false
          };
        });
        resolve(tracks);
      } else {
        resolve([]);
      }
    });

    proc.on('error', () => resolve([]));
  });
}

/**
 * Crea el pipeline de audio directo con FFmpeg
 */
function createAudioStream(directUrl, volume = 0.5) {
  const ffmpegProc = spawn(ffmpegPath, [
    '-reconnect', '1',
    '-reconnect_streamed', '1',
    '-reconnect_delay_max', '5',
    '-i', directUrl,
    '-analyzeduration', '0',
    '-loglevel', 'error',
    '-f', 's16le',
    '-ar', '48000',
    '-ac', '2',
    'pipe:1'
  ], { stdio: ['ignore', 'pipe', 'ignore'] });

  ffmpegProc.on('error', err => {
    console.error('[FFmpeg] Error en proceso:', err.message);
  });

  const resource = createAudioResource(ffmpegProc.stdout, {
    inputType: StreamType.Raw,
    inlineVolume: true
  });

  if (resource.volume) {
    resource.volume.setVolume(volume);
  }

  return { resource, process: ffmpegProc };
}

/**
 * Reproduce la siguiente pista de la cola
 */
async function playNext(guildId) {
  const session = activeSessions.get(guildId);
  if (!session) return;

  // Limpiar proceso anterior
  if (session.currentProcess) {
    try { session.currentProcess.kill('SIGTERM'); } catch (e) {}
    session.currentProcess = null;
  }

  // Si la cola está vacía, finalizar reproducción
  if (session.queue.length === 0) {
    session.currentTrack = null;
    return;
  }

  const track = session.queue.shift();
  session.currentTrack = track;
  session.lastTrack = track;

  // Registrar en historial de reproducción reciente
  if (track && track.title) {
    if (!session.history) session.history = [];
    if (!session.history.includes(track.title)) {
      session.history.push(track.title);
      if (session.history.length > 40) session.history.shift();
    }
  }

  try {
    let directUrl = track.url;
    if (!track.isDirectStream) {
      directUrl = await getDirectAudioUrl(track.targetQuery || track.webUrl);
      if (!directUrl) {
        console.error('[Música] No se pudo obtener la URL de transmisión para:', track.title);
        playNext(guildId);
        return;
      }
    }

    const { resource, process: proc } = createAudioStream(directUrl, session.volume);
    session.resource = resource;
    session.currentProcess = proc;

    session.player.play(resource);
    session.isPaused = false;
    console.log(`[Música] Reproduciendo en ${guildId}: ${track.title}`);
  } catch (error) {
    console.error(`[Música] Error al reproducir pista en ${guildId}:`, error);
    playNext(guildId);
  }
}

/**
 * Inicia o encola una pista en un servidor
 */
async function enqueueTrack(guild, voiceChannel, textChannel, track, requesterTag) {
  const guildId = guild.id;
  let session = activeSessions.get(guildId);

  track.requestedBy = requesterTag;

  if (!session) {
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true
    });

    try {
      // Esperar a que la conexión UDP esté lista con Discord
      await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
    } catch (e) {
      console.warn('[Música] Advertencia: Tiempo de espera de conexión de voz excedido');
    }

    const player = createAudioPlayer();
    connection.subscribe(player);

    session = {
      guildId,
      connection,
      player,
      queue: [track],
      currentTrack: null,
      lastTrack: null,
      history: [track.title],
      currentProcess: null,
      voiceChannel,
      textChannel,
      client: guild.client,
      volume: 0.5,
      isPaused: false
    };

    activeSessions.set(guildId, session);

    player.on('error', error => {
      console.error(`[Música] Error en reproductor:`, error.message);
      playNext(guildId);
    });

    player.on(AudioPlayerStatus.Idle, () => {
      playNext(guildId);
    });

    await playNext(guildId);
    return { session, isPlayingNow: true };
  } else {
    // Si la conexión se perdió, reconectar y esperar Ready
    if (session.connection.state.status === VoiceConnectionStatus.Destroyed) {
      session.connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfDeaf: true
      });
      try {
        await entersState(session.connection, VoiceConnectionStatus.Ready, 15_000);
      } catch (e) {}
      session.connection.subscribe(session.player);
    }

    session.textChannel = textChannel || session.textChannel;
    session.client = guild.client || session.client;
    if (!session.history) session.history = [];
    if (track.title && !session.history.includes(track.title)) {
      session.history.push(track.title);
    }

    if (!session.currentTrack) {
      session.queue.push(track);
      await playNext(guildId);
      return { session, isPlayingNow: true };
    } else {
      session.queue.push(track);
      return { session, isPlayingNow: false, position: session.queue.length };
    }
  }
}

/**
 * Salta la canción actual
 */
function skipTrack(guildId) {
  const session = activeSessions.get(guildId);
  if (!session || !session.currentTrack) return false;

  playNext(guildId);
  return true;
}

/**
 * Detiene y desconecta
 */
function stopTrack(guildId) {
  const session = activeSessions.get(guildId);
  if (!session) return false;

  session.queue = [];
  session.currentTrack = null;

  if (session.currentProcess) {
    try { session.currentProcess.kill('SIGTERM'); } catch (e) {}
    session.currentProcess = null;
  }

  try {
    session.player.stop();
    if (session.connection.state.status !== VoiceConnectionStatus.Destroyed) {
      session.connection.destroy();
    }
  } catch (err) {}

  activeSessions.delete(guildId);
  return true;
}

/**
 * Alterna pausa / reanudación
 */
function togglePause(guildId) {
  const session = activeSessions.get(guildId);
  if (!session || !session.player) return null;

  if (session.isPaused) {
    session.player.unpause();
    session.isPaused = false;
    return 'resumed';
  } else {
    session.player.pause();
    session.isPaused = true;
    return 'paused';
  }
}

/**
 * Ajusta volumen
 */
function setVolume(guildId, newVolume) {
  const session = activeSessions.get(guildId);
  if (!session || !session.resource || !session.resource.volume) return null;

  const clamped = Math.max(0, Math.min(newVolume, 1));
  session.volume = clamped;
  session.resource.volume.setVolume(clamped);
  return clamped;
}

function getSession(guildId) {
  return activeSessions.get(guildId);
}

module.exports = {
  resolveTrack,
  searchTracks,
  enqueueTrack,
  skipTrack,
  stopTrack,
  togglePause,
  setVolume,
  getSession
};
