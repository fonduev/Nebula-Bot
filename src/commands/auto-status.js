// ============================================================
// Comando /auto-status - Monitor en Vivo 24/7 de Servidor Minecraft
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed, createProgressBar } = require('../utils/theme');
const { setAutoStatus, getAutoStatus } = require('../utils/database');

async function buildServerStatusEmbed(client, ip) {
  try {
    const res = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(ip)}`);
    const data = await res.json();

    if (!data.online) {
      return createNebulaEmbed(client, {
        color: COLORS.ERROR,
        title: `🔴 Servidor Fuera de Línea | ${ip}`,
        description:
          `# **Servidor Inaccesible**\n\n` +
          `> El servidor no responde a las solicitudes de ping en este momento.\n\n` +
          `${SYMBOLS.ARROW} **Dirección:** \`${ip}\`\n` +
          `${SYMBOLS.ARROW} **Última comprobación:** <t:${Math.floor(Date.now() / 1000)}:R>`,
        footerText: 'Nebula Minecraft Live Monitor • Actualizado automáticamente'
      });
    }

    const onlinePlayers = data.players?.online || 0;
    const maxPlayers = data.players?.max || 1;
    const pct = Math.round((onlinePlayers / maxPlayers) * 100);
    const bar = createProgressBar(onlinePlayers, maxPlayers, 12);
    const version = data.version || 'Desconocida';
    const motdClean = data.motd?.clean ? data.motd.clean.join('\n') : 'Sin descripción';
    const playerList = data.players?.list ? data.players.list.map(p => `\`${p.name}\``).slice(0, 15).join(', ') : 'Oculta por privacidad';

    return createNebulaEmbed(client, {
      color: COLORS.MINECRAFT,
      title: `🟢 Servidor En Línea | ${ip}`,
      thumbnail: `https://api.mcsrvstat.us/icon/${encodeURIComponent(ip)}`,
      description:
        `# **${onlinePlayers} / ${maxPlayers} Jugadores (${pct}%)**\n` +
        `${bar}\n\n` +
        `\`\`\`text\n${motdClean}\n\`\`\`\n` +
        `${SYMBOLS.ARROW} **Versión:** \`${version}\`\n` +
        `${SYMBOLS.ARROW} **IP de Conexión:** \`${ip}\`\n` +
        `${SYMBOLS.ARROW} **Jugadores recientes:** ${playerList}\n` +
        `${SYMBOLS.ARROW} **Actualizado:** <t:${Math.floor(Date.now() / 1000)}:R>`,
      footerText: 'Nebula Minecraft Live Monitor • Actualizado en vivo cada 2 minutos'
    });
  } catch (err) {
    return createNebulaEmbed(client, {
      color: COLORS.WARNING,
      title: `⚠️ Error de Consulta | ${ip}`,
      description: `> No se pudo obtener la información de ${ip} en este momento. Reintentando en breve...`
    });
  }
}

function createAutoStatusButtons(ip) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_autostatus_refresh')
      .setLabel('Actualizar Ahora')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_autostatus_stop')
      .setLabel('Detener Monitor')
      .setEmoji('🛑')
      .setStyle(ButtonStyle.Danger)
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('auto-status')
    .setDescription('Gestiona el monitor en vivo 24/7 de un servidor de Minecraft (activar, detener o info)')
    .addStringOption(opt =>
      opt
        .setName('accion')
        .setDescription('¿Deseas activar, detener o consultar el estado del monitor?')
        .setRequired(false)
        .addChoices(
          { name: '🟢 Activar / Iniciar Monitor', value: 'activar' },
          { name: '🛑 Detener / Desactivar Monitor', value: 'detener' },
          { name: '📊 Ver Estado Actual', value: 'info' }
        )
    )
    .addStringOption(opt =>
      opt
        .setName('ip')
        .setDescription('Dirección IP o dominio del servidor de Minecraft (ej: mc.hypixel.net)')
        .setRequired(false)
    )
    .addChannelOption(opt =>
      opt
        .setName('canal')
        .setDescription('Canal donde publicar el monitor (opcional, por defecto el actual)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addBooleanOption(opt =>
      opt
        .setName('borrar_mensaje')
        .setDescription('Al detener el monitor, ¿eliminar también el mensaje fijado? (Por defecto: no)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    if (
      !interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) &&
      !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
    ) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Permiso Denegado',
            description: '> No posees la facultad (`Gestionar Canales` o `Administrador`) para configurar el banner de estado en vivo.'
          })
        ],
        ephemeral: true
      });
    }

    const rawIp = interaction.options.getString('ip');
    const ip = rawIp ? rawIp.trim() : null;
    const accion = interaction.options.getString('accion') || (ip ? 'activar' : null);
    const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
    const borrarMensaje = interaction.options.getBoolean('borrar_mensaje') || false;
    const activeConfig = getAutoStatus(interaction.guildId);

    // -------------------------------------------------------------
    // ACCIÓN 1: DETENER EL MONITOR ACTIVO
    // -------------------------------------------------------------
    if (accion === 'detener') {
      await interaction.deferReply({ ephemeral: true });

      if (!activeConfig) {
        return await interaction.editReply({
          content: '⚠️ **No hay ningún monitor activo:** Este servidor no tiene ningún monitor en vivo de Minecraft configurado.'
        });
      }

      // Eliminar de la base de datos
      setAutoStatus(interaction.guildId, null);

      // Intentar editar o borrar el mensaje en el canal
      try {
        const channel = await interaction.client.channels.fetch(activeConfig.channelId).catch(() => null);
        if (channel) {
          const message = await channel.messages.fetch(activeConfig.messageId).catch(() => null);
          if (message) {
            if (borrarMensaje) {
              await message.delete().catch(() => {});
            } else {
              const stoppedEmbed = createNebulaEmbed(interaction.client, {
                color: COLORS.ERROR,
                title: `🛑 Monitor Detenido | ${activeConfig.ip}`,
                description:
                  `# **Monitor en Vivo Desactivado**\n\n` +
                  `> El monitor automático 24/7 ha sido desactivado por ${interaction.user}.\n\n` +
                  `${SYMBOLS.ARROW} **Servidor:** \`${activeConfig.ip}\`\n` +
                  `${SYMBOLS.ARROW} **Fecha de parada:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                footerText: 'Nebula Minecraft Live Monitor • Inactivo'
              });
              await message.edit({ embeds: [stoppedEmbed], components: [] }).catch(() => {});
            }
          }
        }
      } catch (err) {}

      return await interaction.editReply({
        content: `🛑 **¡Monitor en vivo detenido!** El monitor de \`${activeConfig.ip}\` ha sido desactivado correctamente y ya no se actualizará cada 2 minutos.`
      });
    }

    // -------------------------------------------------------------
    // ACCIÓN 2: CONSULTAR ESTADO O PANEL DE CONTROL (SIN ARGUMENTOS)
    // -------------------------------------------------------------
    if (accion === 'info' || (!accion && !ip)) {
      await interaction.deferReply({ ephemeral: true });

      if (!activeConfig) {
        return await interaction.editReply({
          embeds: [
            createNebulaEmbed(interaction.client, {
              color: COLORS.INFO,
              title: 'ℹ️ Monitor de Minecraft Inactivo',
              description:
                `> No hay ningún monitor de Minecraft activo en este servidor.\n\n` +
                `${SYMBOLS.ARROW} Para activar uno, usa: \`/auto-status accion: Activar ip: <servidor>\` o simplemente \`/auto-status ip: <servidor>\`.`
            })
          ]
        });
      }

      const infoEmbed = createNebulaEmbed(interaction.client, {
        color: COLORS.PRIMARY,
        title: `📊 Monitor Activo | ${activeConfig.ip}`,
        description:
          `# **Monitor en Vivo 24/7**\n\n` +
          `${SYMBOLS.ARROW} **Servidor:** \`${activeConfig.ip}\`\n` +
          `${SYMBOLS.ARROW} **Canal:** <#${activeConfig.channelId}>\n` +
          `${SYMBOLS.ARROW} **Mensaje:** [Ver Banner en Canal](https://discord.com/channels/${interaction.guildId}/${activeConfig.channelId}/${activeConfig.messageId})\n` +
          `${SYMBOLS.ARROW} **Frecuencia:** Cada 2 minutos en segundo plano.\n\n` +
          `*Puedes detenerlo pulsando el botón rojo de abajo o usando \`/auto-status accion: Detener\`.*`,
        footerText: 'Nebula Minecraft Live Monitor • Panel de Control'
      });

      const controlRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_autostatus_refresh')
          .setLabel('Actualizar Ahora')
          .setEmoji('🔄')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('btn_autostatus_stop')
          .setLabel('Detener Monitor')
          .setEmoji('🛑')
          .setStyle(ButtonStyle.Danger)
      );

      return await interaction.editReply({
        embeds: [infoEmbed],
        components: [controlRow]
      });
    }

    // -------------------------------------------------------------
    // ACCIÓN 3: ACTIVAR NUEVO MONITOR
    // -------------------------------------------------------------
    if (!ip) {
      return await interaction.reply({
        content: '❌ **Falta la IP:** Debes indicar la dirección IP del servidor de Minecraft (ej: `/auto-status ip: mc.egonetwork.online`).',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    // Si ya existía un monitor en el servidor, avisamos en el anterior
    if (activeConfig && activeConfig.messageId) {
      try {
        const oldCh = await interaction.client.channels.fetch(activeConfig.channelId).catch(() => null);
        if (oldCh) {
          const oldMsg = await oldCh.messages.fetch(activeConfig.messageId).catch(() => null);
          if (oldMsg) {
            const supersededEmbed = createNebulaEmbed(interaction.client, {
              color: COLORS.WARNING,
              title: `⚠️ Monitor Reemplazado | ${activeConfig.ip}`,
              description: `> Este monitor fue sustituido por uno nuevo en <#${targetChannel.id}> por ${interaction.user}.`
            });
            await oldMsg.edit({ embeds: [supersededEmbed], components: [] }).catch(() => {});
          }
        }
      } catch (e) {}
    }

    const statusEmbed = await buildServerStatusEmbed(interaction.client, ip);
    const sentMessage = await targetChannel.send({
      embeds: [statusEmbed],
      components: [createAutoStatusButtons(ip)]
    });

    setAutoStatus(interaction.guildId, {
      guildId: interaction.guildId,
      channelId: targetChannel.id,
      messageId: sentMessage.id,
      ip
    });

    const stopButtonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_autostatus_stop')
        .setLabel('Detener Monitor')
        .setEmoji('🛑')
        .setStyle(ButtonStyle.Danger)
    );

    return await interaction.editReply({
      content:
        `✅ **¡Monitor en vivo activado!** He publicado el banner interactivo en ${targetChannel}. Se actualizará automáticamente cada 2 minutos.\n\n` +
        `*Puedes detenerlo en cualquier momento pulsando el botón **🛑 Detener Monitor**.*`,
      components: [stopButtonRow]
    });
  },

  buildServerStatusEmbed,
  createAutoStatusButtons
};
