const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fs = require('fs');
const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');

const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error('❌ Error: DISCORD_TOKEN no está definido en el archivo .env');
  process.exit(1);
}

// Inicializar cliente con los intents necesarios
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Channel, Partials.Message]
});

// Colección de comandos
client.commands = new Collection();

// Cargar Comandos
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`[Advertencia] El archivo ${file} no exporta un comando válido.`);
  }
}

// Cargar Eventos
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Manejo de errores globales para que el bot nunca se caiga
process.on('unhandledRejection', error => {
  if (error && error.message && error.message.includes('Cannot perform IP discovery')) {
    console.warn('[Voz] ⚠️ Error de UDP en el servidor: El firewall iptables de Ubuntu está bloqueando los paquetes de audio de Discord.');
    return;
  }
  console.error('[Unhandled Rejection]', error);
});

process.on('uncaughtException', error => {
  if (error && error.message && error.message.includes('429')) {
    console.warn('[Voz] ⚠️ Rate-limit 429 temporal recibido de Discord por reintentos de conexión. Se estabilizará en unos segundos.');
    return;
  }
  console.error('[Uncaught Exception]', error);
});

// Iniciar sesión
client.login(token).catch(err => {
  console.error('❌ Error al iniciar sesión en Discord:', err);
});
