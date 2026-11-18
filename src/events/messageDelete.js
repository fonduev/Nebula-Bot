// ============================================================
// Evento messageDelete - Registro para /snipe
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { setSnipe, getGuildConfig } = require('../utils/database');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  name: 'messageDelete',
  async execute(message) {
    if (!message || message.partial) return;
    if (message.author && message.author.bot) return;

    const attachment = message.attachments.first();
    setSnipe(message.channelId, {
      author: message.author ? message.author.tag : 'Usuario desconocido',
      authorAvatar: message.author ? message.author.displayAvatarURL({ dynamic: true }) : null,
      content: message.content || null,
      image: attachment ? attachment.url : null,
      timestamp: Date.now()
    });

    // Envío a canal de auditoría si está configurado
    if (message.guildId) {
      const config = getGuildConfig(message.guildId);
      if (config.logChannelId) {
        try {
          const logChannel = await message.guild.channels.fetch(config.logChannelId).catch(() => null);
          if (logChannel && logChannel.id !== message.channelId) {
            const logEmbed = createNebulaEmbed(message.client, {
              color: COLORS.ERROR,
              title: '🗑️ Mensaje Eliminado',
              thumbnail: message.author?.displayAvatarURL({ dynamic: true }),
              description:
                `>>> Un mensaje ha sido borrado en <#${message.channelId}>.\n\n` +
                `${SYMBOLS.ARROW} **Autor:** ${message.author} (\`${message.author?.tag}\`)\n` +
                `${SYMBOLS.ARROW} **Canal:** <#${message.channelId}>\n` +
                `${SYMBOLS.ARROW} **Contenido:**\n` +
                (message.content ? `\`\`\`text\n${message.content.slice(0, 1000)}\n\`\`\`` : '*Sin texto (solo archivo adjunto)*'),
              footerText: 'Nebula Audit Core • Registro de Mensajes'
            });

            if (attachment) {
              logEmbed.setImage(attachment.url);
            }

            await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
          }
        } catch (e) {}
      }
    }
  }
};
