// ============================================================
// Nebula Bot - Gestor Avanzado de Música y Canales de Voz
// Motor Triple Capa (Scraper Nativo + yt-search + yt-dlp + FFmpeg)
// 100% Compatible con Windows y Servidores Linux VM
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
const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');

let yts;
try { yts = require('yt-search'); } catch (e) {}

// Almacén de sesiones activas (guildId -> Session)
const activeSessions = new Map();

/**
 * Scraper nativo de YouTube vía HTTP Fetch (Cero dependencias externas)
 * Resuelve búsquedas en <300ms sin requerir paquetes npm ni binarios
 */
async function scrapeYouTubeDirect(query, limit = 5) {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      }
    });

    if (!res.ok) return [];

    const html = await res.text();
    const match = html.match(/ytInitialData\s*=\s*({.+?});(?:<\/script>|var)/s) || html.match(/var ytInitialData = ({.*?});<\/script>/s);
    if (!match) return [];

    const json = JSON.parse(match[1]);
    const contents = json.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

    const tracks = [];
    for (const item of contents) {
      if (item.videoRenderer) {
        const v = item.videoRenderer;
        const id = v.videoId;
        const title = v.title?.runs?.[0]?.text;
        const duration = v.lengthText?.simpleText || 'En vivo';
        const author = v.ownerText?.runs?.[0]?.text || 'Artista';
        const thumbnail = v.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

        if (id && title) {
          tracks.push({
            title,
            duration,
            thumbnail,
            webUrl: `https://www.youtube.com/watch?v=${id}`,
            targetQuery: `https://www.youtube.com/watch?v=${id}`,
            source: 'YouTube',
            channel: author,
            isDirectStream: false
          });
          if (tracks.length >= limit) break;
        }
      }
    }

    return tracks;
  } catch (err) {
    console.warn('[Música] Scraper directo arrojó advertencia:', err.message);
    return [];
  }
}

/**
 * Detecta la ruta del binario yt-dlp en el sistema o carpeta local
 */
function getYtDlpPath() {
  const isWin = process.platform === 'win32';
  const binDir = path.join(__dirname, '..', '..', 'bin');
  const localBinary = path.join(binDir, isWin ? 'yt-dlp.exe' : 'yt-dlp');

  if (fs.existsSync(localBinary)) {
    return localBinary;
  }

  // Verificar si yt-dlp está instalado globalmente en el PATH del sistema
  try {
    const check = spawnSync(isWin ? 'where' : 'which', ['yt-dlp']);
    if (check.status === 0 && check.stdout.toString().trim()) {
      return check.stdout.toString().trim().split('\n')[0].trim();
    }
  } catch (e) {}

  return localBinary;
}

/**
 * Garantiza que el binario de yt-dlp esté disponible y con permisos de ejecución
 */
async function ensureYtDlp() {
  const binPath = getYtDlpPath();
  if (fs.existsSync(binPath)) {
    if (process.platform !== 'win32') {
      try { fs.chmodSync(binPath, 0o755); } catch (e) {}
    }
    return binPath;
  }

  const isWin = process.platform === 'win32';
  const binDir = path.join(__dirname, '..', '..', 'bin');
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  const downloadUrl = isWin
    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
    : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

  console.log(`[Música] Descargando motor de audio yt-dlp para ${process.platform}...`);
  try {
    const res = await fetch(downloadUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(binPath, buffer);
    if (!isWin) {
      fs.chmodSync(binPath, 0o755);
    }
    console.log('[Música] Motor yt-dlp configurado exitosamente.');
    return binPath;
  } catch (err) {
    console.error('[Música] Error descargando yt-dlp:', err.message);
    return binPath;
  }
}

/**
 * Extrae la URL directa de audio mediante yt-dlp
 */
async function getDirectAudioUrl(targetQuery) {
  const ytdl = await ensureYtDlp();

  return new Promise(resolve => {
    const proc = spawn(ytdl, [
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
        // Fallback: intentar sin selector estricto de formato
        const procFallback = spawn(ytdl, [
          '--no-warnings',
          '-g',
          '--no-playlist',
          targetQuery
        ]);
        let urlFallback = '';
        procFallback.stdout.on('data', d => { urlFallback += d.toString(); });
        procFallback.on('close', c => {
          resolve(c === 0 && urlFallback.trim() ? urlFallback.trim().split('\n')[0] : null);
        });
        procFallback.on('error', () => resolve(null));
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

  // 1. Detectar si es un enlace de audio directo (.mp3, .ogg, etc.)
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

  // 2. Detectar si es un enlace de Spotify
  if (query.includes('spotify.com/')) {
    try {
      const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(query)}`);
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        const searchTitle = data.title;
        const searchResults = await searchTracks(searchTitle, 1);
        if (searchResults && searchResults.length > 0) {
          const first = searchResults[0];
          first.title = data.title;
          first.source = 'Spotify (vía YouTube)';
          if (data.thumbnail_url) first.thumbnail = data.thumbnail_url;
          return first;
        }
      }
    } catch (e) {
      console.warn('[Música] Error resolviendo Spotify:', e.message);
    }
  }

  // 3. Extraer ID si es un enlace de YouTube o YouTube Music
  const ytMatch = query.match(/(?:v=|\/|youtu\.be\/|vi\/|embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    const isYtMusic = query.includes('music.youtube.com');

    // Capa 1: oEmbed Oficial de YouTube (<50ms, ultra confiable)
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const oembedRes = await fetch(oembedUrl);
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        return {
          title: data.title,
          duration: 'En reproducción',
          thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          webUrl: `https://www.youtube.com/watch?v=${videoId}`,
          targetQuery: `https://www.youtube.com/watch?v=${videoId}`,
          source: isYtMusic ? 'YouTube Music' : 'YouTube',
          channel: data.author_name || 'Artista',
          isDirectStream: false
        };
      }
    } catch (e) {}

    // Capa 2: yt-search si está disponible
    if (yts) {
      try {
        const r = await yts({ videoId });
        if (r && r.title && r.title !== 'video unavailable') {
          return {
            title: r.title,
            duration: r.timestamp || 'En vivo',
            thumbnail: r.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            webUrl: r.url || `https://www.youtube.com/watch?v=${videoId}`,
            targetQuery: r.url || `https://www.youtube.com/watch?v=${videoId}`,
            source: isYtMusic ? 'YouTube Music' : 'YouTube',
            channel: r.author ? r.author.name : 'Artista',
            isDirectStream: false
          };
        }
      } catch (e) {}
    }
  }

  // 4. Búsqueda por texto directo
  const directSearch = await searchTracks(query, 1);
  if (directSearch && directSearch.length > 0) {
    return directSearch[0];
  }

  return null;
}

/**
 * Busca múltiples pistas coincidentes en YouTube y Spotify (Triple Cascada)
 */
async function searchTracks(query, limit = 5) {
  query = query.trim();

  // 1. Detectar enlaces de Spotify
  if (query.includes('spotify.com/')) {
    try {
      const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(query)}`);
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        const searchTitle = data.title;
        const results = await searchTracks(searchTitle, 1);
        if (results && results.length > 0) {
          const first = results[0];
          first.title = data.title;
          first.source = 'Spotify (vía YouTube)';
          if (data.thumbnail_url) first.thumbnail = data.thumbnail_url;
          return [first];
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

  // 3. CAPA 1: Scraper Nativo Directo de YouTube (Cero dependencias)
  try {
    const directResults = await scrapeYouTubeDirect(query, limit);
    if (directResults && directResults.length > 0) {
      return directResults;
    }
  } catch (e) {}

  // 4. CAPA 2: yt-search si está disponible
  if (yts) {
    try {
      const res = await yts(query);
      const videos = res.videos || [];
      if (videos.length > 0) {
        return videos.slice(0, limit).map(v => ({
          title: v.title,
          duration: v.timestamp || 'En vivo',
          thumbnail: v.thumbnail || v.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
          webUrl: v.url,
          targetQuery: v.url,
          source: 'YouTube',
          channel: v.author ? v.author.name : 'Artista',
          isDirectStream: false
        }));
      }
    } catch (e) {}
  }

  return [];
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
  getSession,
  ensureYtDlp
};
