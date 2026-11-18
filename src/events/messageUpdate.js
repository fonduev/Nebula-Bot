// ============================================================
// Evento messageUpdate - Auditoría de Mensajes Editados
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { Events } = require('discord.js');
const { getGuildConfig } = require('../utils/database');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  name: Events.MessageUpdate,
  async execute(oldMessage, newMessage) {
    if (!oldMessage || oldMessage.partial || !newMessage || newMessage.partial) return;
    if (newMessage.author && newMessage.author.bot) return;
    if (oldMessage.content === newMessage.content) return; // Evita falsos positivos de embeds de enlaces

    if (newMessage.guildId) {
      const config = getGuildConfig(newMessage.guildId);
      if (config.logChannelId) {
        try {
          const logChannel = await newMessage.guild.channels.fetch(config.logChannelId).catch(() => null);
          if (logChannel && logChannel.id !== newMessage.channelId) {
            const editEmbed = createNebulaEmbed(newMessage.client, {
              color: COLORS.WARNING,
              title: '✏️ Mensaje Editado',
              thumbnail: newMessage.author?.displayAvatarURL({ dynamic: true }),
              description:
                `>>> Un mensaje ha sido modificado en <#${newMessage.channelId}>. [Ir al mensaje](${newMessage.url})\n\n` +
                `${SYMBOLS.ARROW} **Autor:** ${newMessage.author} (\`${newMessage.author?.tag}\`)\n` +
                `${SYMBOLS.ARROW} **Canal:** <#${newMessage.channelId}>\n\n` +
                `**Antes:**\n` +
                `\`\`\`text\n${(oldMessage.content || 'Sin texto').slice(0, 500)}\n\`\`\`\n` +
                `**Después:**\n` +
                `\`\`\`text\n${(newMessage.content || 'Sin texto').slice(0, 500)}\n\`\`\``,
              footerText: 'Nebula Audit Core • Registro de Edición'
            });

            await logChannel.send({ embeds: [editEmbed] }).catch(() => {});
          }
        } catch (e) {}
      }
    }
  }
};
