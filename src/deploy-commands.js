const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { REST, Routes } = require('discord.js');
const fs = require('fs');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error('Error: DISCORD_TOKEN o CLIENT_ID faltan en el archivo .env');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
    console.log(`[Cargado] Comando: /${command.data.name}`);
  } else {
    console.warn(`[Advertencia] El comando en ${filePath} no tiene las propiedades 'data' o 'execute'.`);
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`\nIniciando sincronización limpia de ${commands.length} comandos slash...`);

    // Si había comandos registrados a nivel servidor local, los eliminamos para evitar duplicados en la lista de Discord
    if (guildId && guildId.trim() !== '') {
      console.log(`🧹 Limpiando comandos locales del servidor (${guildId}) para evitar duplicaciones...`);
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: [] }
      );
      console.log('✅ Servidor limpio de duplicados.');
    }

    // Registramos todos los comandos de manera global (1 única vez por comando en todos los servidores)
    console.log('🌐 Registrando comandos globalmente en Discord...');
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );
    console.log('✨ ¡Éxito! Todos los comandos están registrados globalmente sin duplicados.');
  } catch (error) {
    console.error('❌ Error al registrar comandos:', error);
  }
})();
