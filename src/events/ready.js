const { Events, ActivityType } = require('discord.js');
const { getAllAutoStatus, addMessageXp } = require('../utils/database');
const { buildServerStatusEmbed, createAutoStatusButtons } = require('../commands/auto-status');
const { activeVoiceSessions } = require('./voiceStateUpdate');
const { createNebulaEmbed, COLORS, SYMBOLS } = require('../utils/theme');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`\n======================================================`);
    console.log(`  🌌 NEBULA BOT ESTÁ ONLINE Y CONECTADO`);
    console.log(`======================================================`);
    console.log(`  🤖 Tag:        ${client.user.tag}`);
    console.log(`  🆔 ID:         ${client.user.id}`);
    console.log(`  🌐 Servidores:  ${client.guilds.cache.size}`);
    console.log(`  ⚡ Comandos:   ${client.commands.size} registrados`);
    console.log(`======================================================\n`);

    // Rotación dinámica de presencia cada 15 segundos
    const activities = [
      { name: 'Nebula Launcher v5.0.8 | /launcher', type: ActivityType.Playing },
      { name: 'Servidores de Minecraft | /servidor', type: ActivityType.Watching },
      { name: 'Skins de Minecraft | /skin', type: ActivityType.Playing },
      { name: 'la comunidad | /ayuda', type: ActivityType.Listening },
      { name: 'nebuladevstudios.com', type: ActivityType.Competing }
    ];

    let currentIndex = 0;

    const updatePresence = () => {
      const current = activities[currentIndex];
      client.user.setPresence({
        activities: [current],
        status: 'online'
      });
      currentIndex = (currentIndex + 1) % activities.length;
    };

    updatePresence();
    setInterval(updatePresence, 15000);

    // -------------------------------------------------------------
    // LOOP 1: AUTO-STATUS DE MINECRAFT EN VIVO (CADA 2 MINUTOS)
    // -------------------------------------------------------------
    setInterval(async () => {
      try {
        const allStatus = getAllAutoStatus();
        for (const [guildId, config] of Object.entries(allStatus)) {
          if (!config || !config.channelId || !config.messageId || !config.ip) continue;
          try {
            const channel = await client.channels.fetch(config.channelId).catch(() => null);
            if (!channel) continue;
            const message = await channel.messages.fetch(config.messageId).catch(() => null);
            if (!message) continue;

            const updatedEmbed = await buildServerStatusEmbed(client, config.ip);
            await message.edit({
              embeds: [updatedEmbed],
              components: [createAutoStatusButtons(config.ip)]
            }).catch(() => {});
          } catch (e) {}
        }
      } catch (err) {
        console.error('[Auto-Status Loop Error]', err.message);
      }
    }, 120_000);

    // -------------------------------------------------------------
    // LOOP 2: VOICE XP & COINS POR HABLAR EN VOZ (CADA 5 MINUTOS)
    // -------------------------------------------------------------
    setInterval(async () => {
      try {
        if (!activeVoiceSessions || activeVoiceSessions.size === 0) return;

        for (const [sessionKey, startTime] of activeVoiceSessions.entries()) {
          const [guildId, userId] = sessionKey.split('_');
          const guild = client.guilds.cache.get(guildId);
          if (!guild) continue;

          const member = await guild.members.fetch(userId).catch(() => null);
          if (!member || !member.voice.channelId || member.voice.deaf) {
            activeVoiceSessions.delete(sessionKey);
            continue;
          }

          // Solo otorga XP si el canal tiene al menos 2 personas (evita farmeo AFK en soledad)
          const voiceChannel = member.voice.channel;
          if (voiceChannel && voiceChannel.members.size >= 2) {
            addMessageXp(guildId, userId, 25); // Otorga 25 XP y monedas silenciosamente
          }
        }
      } catch (err) {
        console.error('[Voice XP Loop Error]', err.message);
      }
    }, 300_000);
  }
};
