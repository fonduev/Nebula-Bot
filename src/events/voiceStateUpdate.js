// ============================================================
// Evento voiceStateUpdate - Auto-Voz, Auditoría & Voice XP
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { Events, ChannelType, PermissionFlagsBits } = require('discord.js');
const { getGuildConfig, setTempVoice, getTempVoice, deleteTempVoice, addMessageXp } = require('../utils/database');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');
const { createVoiceControlRow } = require('../commands/sala');

// Rastreo de usuarios activos en voz para Voice XP: key = `${guildId}_${userId}` -> timestamp
const activeVoiceSessions = new Map();

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    const guild = newState.guild || oldState.guild;
    const member = newState.member || oldState.member;
    if (!guild || !member || member.user.bot) return;

    const config = getGuildConfig(guild.id);

    // -------------------------------------------------------------
    // 1. AUTO-VOZ: SALAS TEMPORALES ("JOIN TO CREATE")
    // -------------------------------------------------------------
    if (config.autoVoiceChannelId && newState.channelId === config.autoVoiceChannelId) {
      try {
        const triggerChannel = newState.channel;
        const parentCategory = triggerChannel?.parentId;

        const cleanName = member.displayName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, '').trim().slice(0, 15) || 'Jugador';
        const newVoice = await guild.channels.create({
          name: `🔊 Sala de ${cleanName}`,
          type: ChannelType.GuildVoice,
          parent: parentCategory || undefined,
          permissionOverwrites: [
            {
              id: member.id,
              allow: [
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.MoveMembers,
                PermissionFlagsBits.MuteMembers,
                PermissionFlagsBits.DeafenMembers,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak
              ]
            }
          ]
        });

        // Registrar propiedad de la sala
        setTempVoice(newVoice.id, member.id);

        // Mover al miembro a su nueva sala
        await member.voice.setChannel(newVoice).catch(() => {});

        // Enviar panel táctil interactivo en el chat de texto de la sala de voz
        const welcomeEmbed = createNebulaEmbed(guild.client, {
          color: COLORS.PRIMARY,
          title: '🎛️ Centro de Mando de tu Sala Privada',
          thumbnail: member.user.displayAvatarURL({ dynamic: true }),
          description:
            `# **¡Bienvenido a tu sala, ${cleanName}!**\n\n` +
            `Tienes el control total de este canal de voz. Utiliza los botones táctiles para personalizar tu experiencia:\n\n` +
            `${SYMBOLS.ARROW} 🔒 **Bloquear / Desbloquear:** Cierra o abre el acceso general a la sala.\n` +
            `${SYMBOLS.ARROW} 👁️ **Ocultar / Mostrar:** Hazla invisible en la lista para usuarios no invitados.\n` +
            `${SYMBOLS.ARROW} 👥 **Fijar Límite:** Ajusta el aforo máximo de miembros.\n` +
            `${SYMBOLS.ARROW} 🏷️ **Renombrar:** Personaliza el título de tu canal.\n` +
            `${SYMBOLS.ARROW} 👑 **Reclamar:** Toma la propiedad si el dueño original se desconectó.\n` +
            `${SYMBOLS.ARROW} 🚪 **Desconectarme:** Sal del canal inmediatamente.\n\n` +
            `*También dispones del comando \`/sala\` (invitar amigos, expulsar, bitrate HD y región).*`,
          footerText: 'Nebula Auto-Voice Core • Panel Táctil'
        });

        await newVoice.send({
          content: `${member}`,
          embeds: [welcomeEmbed],
          components: createVoiceControlRow()
        }).catch(() => {});
      } catch (err) {
        console.error('[Auto-Voz Error]', err.message);
      }
    }

    // -------------------------------------------------------------
    // 2. ELIMINACIÓN DE SALAS TEMPORALES VACÍAS
    // -------------------------------------------------------------
    if (oldState.channelId && oldState.channelId !== newState.channelId) {
      const oldChannel = oldState.channel;
      if (oldChannel) {
        const isTemp = getTempVoice(oldChannel.id);
        if (isTemp && oldChannel.members.size === 0) {
          try {
            deleteTempVoice(oldChannel.id);
            await oldChannel.delete();
          } catch (e) {
            console.error('[Auto-Voz Delete Error]', e.message);
          }
        }
      }
    }

    // -------------------------------------------------------------
    // 3. AUDITORÍA DE CANALES DE VOZ (LOGS)
    // -------------------------------------------------------------
    if (config.logChannelId) {
      try {
        const logChannel = await guild.channels.fetch(config.logChannelId).catch(() => null);
        if (logChannel) {
          // Conexión a voz
          if (!oldState.channelId && newState.channelId) {
            const joinEmbed = createNebulaEmbed(guild.client, {
              color: COLORS.SUCCESS,
              title: '🔊 Conexión a Canal de Voz',
              thumbnail: member.user.displayAvatarURL({ dynamic: true }),
              description:
                `>>> ${member} (\`${member.user.tag}\`) se ha conectado a un canal de voz.\n\n` +
                `${SYMBOLS.ARROW} **Canal:** <#${newState.channelId}>\n` +
                `${SYMBOLS.ARROW} **Fecha:** <t:${Math.floor(Date.now() / 1000)}:T>`,
              footerText: 'Nebula Audit Core • Voz'
            });
            await logChannel.send({ embeds: [joinEmbed] }).catch(() => {});
          }
          // Desconexión de voz
          else if (oldState.channelId && !newState.channelId) {
            const leaveEmbed = createNebulaEmbed(guild.client, {
              color: COLORS.ERROR,
              title: '🔇 Desconexión de Canal de Voz',
              thumbnail: member.user.displayAvatarURL({ dynamic: true }),
              description:
                `>>> ${member} (\`${member.user.tag}\`) ha salido del canal de voz.\n\n` +
                `${SYMBOLS.ARROW} **Canal anterior:** <#${oldState.channelId}>\n` +
                `${SYMBOLS.ARROW} **Fecha:** <t:${Math.floor(Date.now() / 1000)}:T>`,
              footerText: 'Nebula Audit Core • Voz'
            });
            await logChannel.send({ embeds: [leaveEmbed] }).catch(() => {});
          }
          // Cambio de canal
          else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            const moveEmbed = createNebulaEmbed(guild.client, {
              color: COLORS.PRIMARY,
              title: '🔀 Cambio de Canal de Voz',
              thumbnail: member.user.displayAvatarURL({ dynamic: true }),
              description:
                `>>> ${member} (\`${member.user.tag}\`) se ha movido de canal.\n\n` +
                `${SYMBOLS.ARROW} **De:** <#${oldState.channelId}>\n` +
                `${SYMBOLS.ARROW} **A:** <#${newState.channelId}>\n` +
                `${SYMBOLS.ARROW} **Fecha:** <t:${Math.floor(Date.now() / 1000)}:T>`,
              footerText: 'Nebula Audit Core • Voz'
            });
            await logChannel.send({ embeds: [moveEmbed] }).catch(() => {});
          }
        }
      } catch (e) {}
    }

    // -------------------------------------------------------------
    // 4. VOICE XP: SEGUIMIENTO DE TIEMPO ACTIVO EN VOZ
    // -------------------------------------------------------------
    const sessionKey = `${guild.id}_${member.id}`;
    if (newState.channelId && !newState.deaf) {
      if (!activeVoiceSessions.has(sessionKey)) {
        activeVoiceSessions.set(sessionKey, Date.now());
      }
    } else {
      activeVoiceSessions.delete(sessionKey);
    }
  },

  activeVoiceSessions
};
