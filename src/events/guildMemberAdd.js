// ============================================================
// Evento guildMemberAdd - Bienvenidas, Auto-Rol & Auditoría
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { Events } = require('discord.js');
const { getGuildConfig } = require('../utils/database');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    if (!member || !member.guild) return;

    const guild = member.guild;
    const config = getGuildConfig(guild.id);

    // 1. Asignación automática de rol inicial
    if (config.welcomeRoleId) {
      try {
        await member.roles.add(config.welcomeRoleId);
      } catch (err) {
        console.error('[Auto-Rol Welcome Error]', err.message);
      }
    }

    // 2. Mensaje oficial de bienvenida cósmica
    if (config.welcomeChannelId) {
      try {
        const welcomeChannel = await guild.channels.fetch(config.welcomeChannelId).catch(() => null);
        if (welcomeChannel) {
          const welcomeEmbed = createNebulaEmbed(guild.client, {
            color: COLORS.PRIMARY,
            title: `🌌 ¡Bienvenido a ${guild.name}!`,
            thumbnail: member.user.displayAvatarURL({ dynamic: true, size: 256 }),
            description:
              `# **¡Un nuevo explorador estelar ha llegado!**\n\n` +
              `Hola ${member}, nos alegra tenerte en nuestra comunidad.\n\n` +
              `${SYMBOLS.ARROW} **Usuario:** ${member.user.tag}\n` +
              `${SYMBOLS.ARROW} **Miembro número:** \`#${guild.memberCount}\`\n` +
              `${SYMBOLS.ARROW} **Cuenta creada:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n\n` +
              `>>> 📌 *No olvides revisar las normas del servidor, explorar los comandos con \`/ayuda\` y disfrutar de tu estancia.*`,
            footerText: `Nebula Welcome Core • Ecosistema Oficial`
          });

          await welcomeChannel.send({
            content: `👋 ¡Hola ${member}! Te damos la bienvenida a **${guild.name}**.`,
            embeds: [welcomeEmbed]
          }).catch(() => {});
        }
      } catch (err) {
        console.error('[Welcome Send Error]', err.message);
      }
    }

    // 3. Registro de auditoría (Detección de cuentas nuevas / posibles bots)
    if (config.logChannelId) {
      try {
        const logChannel = await guild.channels.fetch(config.logChannelId).catch(() => null);
        if (logChannel) {
          const ageDays = (Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24);
          const isSuspicious = ageDays < 7; // Cuenta con menos de 7 días de creada

          const auditEmbed = createNebulaEmbed(guild.client, {
            color: isSuspicious ? COLORS.WARNING : COLORS.SUCCESS,
            title: isSuspicious ? '⚠️ Nuevo Miembro (Cuenta Reciente)' : '📥 Nuevo Miembro Registrado',
            thumbnail: member.user.displayAvatarURL({ dynamic: true }),
            description:
              `>>> ${member} (\`${member.user.tag}\`) ha ingresado al servidor.\n\n` +
              `${SYMBOLS.ARROW} **ID:** \`${member.id}\`\n` +
              `${SYMBOLS.ARROW} **Antigüedad de cuenta:** \`${Math.floor(ageDays)} días\` (<t:${Math.floor(member.user.createdTimestamp / 1000)}:d>)\n` +
              `${SYMBOLS.ARROW} **Total de miembros:** \`${guild.memberCount}\`` +
              (isSuspicious ? `\n\n🚨 *Atención Staff: Esta cuenta fue creada hace menos de una semana.*` : ''),
            footerText: 'Nebula Audit Core • Registro de Entrada'
          });

          await logChannel.send({ embeds: [auditEmbed] }).catch(() => {});
        }
      } catch (e) {}
    }
  }
};
