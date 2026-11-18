<div align="center">
  <h1>🌌 Nebula Bot</h1>
  <p><strong>El bot oficial de Discord para Nebula Dev Studios & Nebula Launcher</strong></p>
  <p>Ecosistema integral de Minecraft, música de alta fidelidad, tickets interactivos, niveles, moderación y soporte comunitario.</p>
</div>

---

## 🚀 Características Principales

- ⛏️ **Herramientas de Minecraft en Tiempo Real:**
  - `/servidor`: Monitor en vivo de servidores Java y Bedrock con latencia, ping, MOTD ANSI y lista de jugadores.
  - `/modsearch`: Buscador de mods, shaders, modpacks y resource packs en la API oficial de Modrinth con filtros de cargadores (*Fabric, Forge, NeoForge, Quilt*).
  - `/mcuser`: Perfil completo de jugador con UUID Mojang/Microsoft, render 3D de skins y comandos `/give` decorativos.
  - `/skin` & `/cabeza`: Renders tridimensionales en múltiples ángulos y descarga de texturas.
  - `/crafteo`: Base de datos de más de 735 recetas integrales de Minecraft en memoria con buscador interactivo.
- 🚀 **Ecosistema Nebula Launcher:**
  - `/launcher`: Descargas directas oficiales de Nebula Launcher v5.0.8 (Instaladores Windows, Portable .zip y Linux).
  - `/benchmark`: Sneak peek técnico y telemetría de la próxima edición nativa en Rust en desarrollo.
  - `/vincular`: Sistema de vinculación de cuentas de Minecraft con Discord.
- 🎵 **Música & Canales de Voz:**
  - `/play` & `/buscar`: Reproductor universal con selector inteligente de opciones en YouTube y Spotify.
  - Controles táctiles integrados (Play/Pausa, Skip, Cola, Volumen).
  - Salas de Auto-Voz temporales (*Join to Create*) con personalización de nombres, límites y candado.
- 🎫 **Soporte & Embed Studio V2:**
  - Sistema de tickets con categorías, transcripciones `.txt` automatizadas y permisos dinámicos.
  - Diseñador visual interactivo de Embeds con modales y vista previa en tiempo real.
- 🛡️ **Moderación y Seguridad:**
  - `/ban`, `/kick`, `/timeout`, `/limpiar`, `/slowmode` y sistema de advertencias (`/warn`, `/warns`, `/unwarn`).
  - Registro de auditoría (logs) y bienvenidas configurables.
- 🎲 **Comunidad & Casino Cósmico:**
  - Economía, racha diaria (`/daily`), niveles con XP en chat (`/rank`, `/top`, `/perfil`).
  - Minijuegos: Slots, Ruleta, Piedra-Papel-Tijera, Dados, Encuestas en vivo y Oráculo 8ball.

---

## 📦 Instalación y Puesta en Marcha

### Prerrequisitos
- [Node.js](https://nodejs.org/) v18 o superior (recomendado v20+ o v24).
- Cuenta de desarrollador de Discord y un Bot creado en el [Discord Developer Portal](https://discord.com/developers/applications).

### 1. Clonar el repositorio
```bash
git clone https://github.com/fonduev/Nebula-Bot.git
cd Nebula-Bot
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Copia la plantilla de ejemplo y configura tu archivo `.env`:
```bash
cp .env.example .env
```
Edita `.env` con tus credenciales:
```env
DISCORD_TOKEN=tu_token_de_bot_aqui
CLIENT_ID=tu_client_id_aqui
GUILD_ID=tu_guild_id_opcional
```

### 4. Registrar Comandos Slash (/)
```bash
npm run deploy
```

### 5. Iniciar el Bot
```bash
npm start
```
*O en Windows, ejecuta directamente `Iniciar_Bot.bat`.*

---

## 🛠️ Tecnologías Utilizadas

- **Runtime:** Node.js
- **Librería Discord:** [Discord.js v14](https://discord.js.org/)
- **Audio & Voz:** `@discordjs/voice`, `ffmpeg-static`, `play-dl` y `yt-dlp`
- **APIs Externas:** Mojang API, PlayerDB, Modrinth API, McSrvStat API, Mc-Heads

---

## 📄 Licencia y Créditos

Desarrollado con ❤️ por **Nebula Dev Studios**.
Sitio web oficial: [nebuladevstudios.com](https://nebuladevstudios.com)
Discord de la comunidad: [discord.gg/cfE254mQHZ](https://discord.gg/cfE254mQHZ)
