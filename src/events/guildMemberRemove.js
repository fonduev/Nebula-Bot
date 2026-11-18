// ============================================================
// Evento guildMemberRemove - Registro de Salidas & Auditoría
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { Events } = require('discord.js');
const { getGuildConfig } = require('../utils/database');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    if (!member || !member.guild) return;

    const guild = member.guild;
    const config = getGuildConfig(guild.id);

    // Registro de auditoría
    if (config.logChannelId) {
      try {
        const logChannel = await guild.channels.fetch(config.logChannelId).catch(() => null);
        if (logChannel) {
          const leaveEmbed = createNebulaEmbed(guild.client, {
            color: COLORS.ERROR,
            title: '📤 Miembro Ha Abandonado el Servidor',
            thumbnail: member.user.displayAvatarURL({ dynamic: true }),
            description:
              `>>> **${member.user.tag}** (\`${member.id}\`) ha salido del servidor.\n\n` +
              `${SYMBOLS.ARROW} **Miembros restantes:** \`${guild.memberCount}\`\n` +
              `${SYMBOLS.ARROW} **Fecha de salida:** <t:${Math.floor(Date.now() / 1000)}:f>`,
            footerText: 'Nebula Audit Core • Registro de Salida'
          });

          await logChannel.send({ embeds: [leaveEmbed] }).catch(() => {});
        }
      } catch (e) {}
    }
  }
};
