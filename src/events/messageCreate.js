// ============================================================
// Evento messageCreate - Ganancia de XP y Actividad en el Servidor
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { addMessageXp } = require('../utils/database');
const { createNebulaEmbed, COLORS, SYMBOLS } = require('../utils/theme');

const xpCooldowns = new Map(); // "guildId-userId" -> timestamp

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message || message.author.bot || !message.guild) return;

    const key = `${message.guildId}-${message.author.id}`;
    const now = Date.now();
    const lastXp = xpCooldowns.get(key) || 0;

    // Cooldown de 45 segundos para otorgar XP
    if (now - lastXp < 45000) return;
    xpCooldowns.set(key, now);

    const randomXp = Math.floor(Math.random() * 11) + 15; // 15 a 25 XP
    const { user, leveledUp } = addMessageXp(message.guildId, message.author.id, randomXp);

    if (leveledUp) {
      const levelEmbed = createNebulaEmbed(message.client, {
        color: COLORS.GOLD,
        title: '🎉 ¡Has Subido de Nivel!',
        description:
          `¡Felicidades, ${message.author}! Has alcanzado el **Nivel ${user.level}**.\n` +
          `🎁 Recompensa: \`+${user.level * 25} Nebula Coins\` añadidas a tu saldo.\n\n` +
          `*(Este aviso se eliminará automáticamente en 5 segundos para mantener el chat limpio)*`,
        footerText: 'Nebula Levels & Gamification • Auto-eliminable'
      });

      // Se responde en el canal y se auto-elimina a los 5 segundos (no envía DM)
      message.reply({ embeds: [levelEmbed] })
        .then(sentMsg => {
          setTimeout(() => {
            sentMsg.delete().catch(() => {});
          }, 5000);
        })
        .catch(() => {});
    }
  }
};
