// ============================================================
// Comando /sala - Centro Integral de Gestión de Canales de Voz
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');
const { getTempVoice, setTempVoice } = require('../utils/database');

function createVoiceControlRow() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('voice_ctrl_lock')
      .setLabel('Bloquear')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('voice_ctrl_hide')
      .setLabel('Ocultar')
      .setEmoji('👁️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('voice_ctrl_limit')
      .setLabel('Fijar Límite')
      .setEmoji('👥')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('voice_ctrl_rename')
      .setLabel('Renombrar')
      .setEmoji('🏷️')
      .setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('voice_ctrl_claim')
      .setLabel('Reclamar Sala')
      .setEmoji('👑')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('voice_ctrl_disconnect')
      .setLabel('Desconectarme')
      .setEmoji('🚪')
      .setStyle(ButtonStyle.Danger)
  );

  return [row1, row2];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sala')
    .setDescription('Panel de control y herramientas avanzadas para tu canal de voz temporal')
    .addSubcommand(sub =>
      sub
        .setName('bloquear')
        .setDescription('Bloquea o desbloquea tu sala privada para impedir que otros miembros entren')
    )
    .addSubcommand(sub =>
      sub
        .setName('ocultar')
        .setDescription('Oculta o hace visible tu sala en la lista de canales del servidor')
    )
    .addSubcommand(sub =>
      sub
        .setName('limite')
        .setDescription('Establece el número máximo de participantes en tu sala')
        .addIntegerOption(opt =>
          opt
            .setName('usuarios')
            .setDescription('Límite de miembros (0 para sin límite, máximo 99)')
            .setMinValue(0)
            .setMaxValue(99)
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('renombrar')
        .setDescription('Cambia el nombre de tu sala de voz privada')
        .addStringOption(opt =>
          opt
            .setName('nombre')
            .setDescription('Nuevo nombre para el canal')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('invitar')
        .setDescription('Otorga permiso directo de acceso a un amigo aunque la sala esté bloqueada u oculta')
        .addUserOption(opt =>
          opt
            .setName('usuario')
            .setDescription('El usuario que deseas invitar a tu sala')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('expulsar')
        .setDescription('Desconecta a un miembro de tu sala y le prohíbe volver a entrar')
        .addUserOption(opt =>
          opt
            .setName('usuario')
            .setDescription('El usuario que deseas expulsar')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('transferir')
        .setDescription('Transfiere la propiedad de la sala de voz a otro miembro presente')
        .addUserOption(opt =>
          opt
            .setName('usuario')
            .setDescription('El nuevo dueño de la sala')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('bitrate')
        .setDescription('Ajusta la calidad de transmisión de audio de tu canal de voz')
        .addIntegerOption(opt =>
          opt
            .setName('calidad')
            .setDescription('Bitrate de audio en kbps')
            .setRequired(true)
            .addChoices(
              { name: '📻 64 kbps (Estándar / Bajo Consumo)', value: 64 },
              { name: '🎧 96 kbps (Alta Calidad Gaming)', value: 96 },
              { name: '🎶 128 kbps (Estudio / Música)', value: 128 },
              { name: '🚀 256 kbps (Ultra Fidelidad)', value: 256 },
              { name: '🌌 384 kbps (Máxima Calidad Discord Nitro)', value: 384 }
            )
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('region')
        .setDescription('Cambia la región de servidores WebRTC para optimizar ping y latencia')
        .addStringOption(opt =>
          opt
            .setName('servidor')
            .setDescription('Selecciona la región geográfica')
            .setRequired(true)
            .addChoices(
              { name: '🌐 Automático (Recomendado)', value: 'auto' },
              { name: '🇺🇸 US East', value: 'us-east' },
              { name: '🇺🇸 US Central', value: 'us-central' },
              { name: '🇧🇷 Brasil', value: 'brazil' },
              { name: '🇪🇺 Rotterdam (Europa)', value: 'rotterdam' }
            )
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('panel')
        .setDescription('Publica el panel visual táctil con botones interactivos de control en la sala')
    ),

  createVoiceControlRow,

  async execute(interaction) {
    const voiceChannel = interaction.member.voice?.channel;
    if (!voiceChannel) {
      return await interaction.reply({
        content: '❌ Debes estar conectado a un canal de voz temporal para utilizar este comando.',
        ephemeral: true
      });
    }

    const ownerId = getTempVoice(voiceChannel.id);
    const isOwner = ownerId === interaction.user.id;
    const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels);

    const sub = interaction.options.getSubcommand();

    // Solo dueños o administradores pueden cambiar configuraciones
    if (!isOwner && !isAdmin && sub !== 'panel') {
      return await interaction.reply({
        content: '❌ Solo el dueño de esta sala privada o un administrador puede modificar su configuración.',
        ephemeral: true
      });
    }

    // 1. BLOQUEAR / DESBLOQUEAR
    if (sub === 'bloquear') {
      const currentConnect = voiceChannel.permissionsFor(interaction.guild.roles.everyone).has(PermissionFlagsBits.Connect);
      const shouldLock = currentConnect;

      await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        Connect: shouldLock ? false : null
      });

      const embed = createNebulaEmbed(interaction.client, {
        color: shouldLock ? COLORS.ERROR : COLORS.SUCCESS,
        title: shouldLock ? '🔒 Sala Bloqueada' : '🔓 Sala Desbloqueada',
        description: shouldLock
          ? '> Tu sala ha sido cerrada con candado. Ningún otro miembro puede conectarse ahora.'
          : '> Tu sala ha sido abierta de nuevo para que otros miembros puedan unirse libremente.'
      });

      return await interaction.reply({ embeds: [embed] });
    }

    // 2. OCULTAR / MOSTRAR
    if (sub === 'ocultar') {
      const currentView = voiceChannel.permissionsFor(interaction.guild.roles.everyone).has(PermissionFlagsBits.ViewChannel);
      const shouldHide = currentView;

      await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        ViewChannel: shouldHide ? false : null
      });

      // Asegurar que el creador y los miembros adentro siempre puedan verla
      await voiceChannel.permissionOverwrites.edit(interaction.user.id, {
        ViewChannel: true,
        Connect: true
      });

      const embed = createNebulaEmbed(interaction.client, {
        color: shouldHide ? COLORS.WARNING : COLORS.PRIMARY,
        title: shouldHide ? '👁️‍🗨️ Sala Oculta' : '👁️ Sala Visible',
        description: shouldHide
          ? '> Tu sala se ha vuelto invisible en la lista de canales para los demás miembros del servidor.'
          : '> Tu sala ahora es visible para toda la comunidad.'
      });

      return await interaction.reply({ embeds: [embed] });
    }

    // 3. FIJAR LÍMITE
    if (sub === 'limite') {
      const limit = interaction.options.getInteger('usuarios');
      await voiceChannel.setUserLimit(limit);

      const embed = createNebulaEmbed(interaction.client, {
        color: COLORS.PRIMARY,
        title: '👥 Capacidad Actualizada',
        description: limit === 0
          ? '> Se ha eliminado el límite de usuarios de tu sala (ilimitada).'
          : `> El cupo de participantes se ha establecido en **${limit} miembros**.`
      });

      return await interaction.reply({ embeds: [embed] });
    }

    // 4. RENOMBRAR
    if (sub === 'renombrar') {
      const newName = interaction.options.getString('nombre').trim();
      await voiceChannel.setName(newName.slice(0, 32));

      const embed = createNebulaEmbed(interaction.client, {
        color: COLORS.ACCENT,
        title: '🏷️ Sala Renombrada',
        description: `> El canal de voz ahora se llama: **${newName.slice(0, 32)}**`
      });

      return await interaction.reply({ embeds: [embed] });
    }

    // 5. INVITAR AMIGO
    if (sub === 'invitar') {
      const targetUser = interaction.options.getUser('usuario');
      await voiceChannel.permissionOverwrites.edit(targetUser.id, {
        ViewChannel: true,
        Connect: true
      });

      const embed = createNebulaEmbed(interaction.client, {
        color: COLORS.SUCCESS,
        title: '🎟️ Acceso Concedido',
        description: `> Se le ha otorgado acceso VIP a ${targetUser} para ver y unirse a esta sala.`
      });

      return await interaction.reply({ embeds: [embed] });
    }

    // 6. EXPULSAR USUARIO
    if (sub === 'expulsar') {
      const targetUser = interaction.options.getUser('usuario');
      if (targetUser.id === interaction.user.id) {
        return await interaction.reply({ content: '❌ No puedes expulsarte a ti mismo.', ephemeral: true });
      }

      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      if (targetMember && targetMember.voice.channelId === voiceChannel.id) {
        await targetMember.voice.disconnect().catch(() => {});
      }

      await voiceChannel.permissionOverwrites.edit(targetUser.id, {
        Connect: false
      });

      const embed = createNebulaEmbed(interaction.client, {
        color: COLORS.ERROR,
        title: '🚫 Usuario Expulsado',
        description: `> ${targetUser} ha sido desconectado y vetado de ingresar a esta sala.`
      });

      return await interaction.reply({ embeds: [embed] });
    }

    // 7. TRANSFERIR PROPIEDAD
    if (sub === 'transferir') {
      const targetUser = interaction.options.getUser('usuario');
      if (targetUser.id === interaction.user.id) {
        return await interaction.reply({ content: '❌ Ya eres el dueño de esta sala.', ephemeral: true });
      }
      if (targetUser.bot) {
        return await interaction.reply({ content: '❌ No puedes transferir una sala a un bot.', ephemeral: true });
      }

      setTempVoice(voiceChannel.id, targetUser.id);

      const embed = createNebulaEmbed(interaction.client, {
        color: COLORS.GOLD,
        title: '👑 Propiedad Transferida',
        description: `> El liderazgo y control de esta sala ha sido cedido a ${targetUser}.`
      });

      return await interaction.reply({ embeds: [embed] });
    }

    // 8. BITRATE / CALIDAD DE AUDIO
    if (sub === 'bitrate') {
      const kbps = interaction.options.getInteger('calidad');
      const maxBitrate = interaction.guild.maximumBitrate; // Depende de nivel de Boost de Discord
      const targetBitrate = Math.min(kbps * 1000, maxBitrate);

      try {
        await voiceChannel.setBitrate(targetBitrate);

        const embed = createNebulaEmbed(interaction.client, {
          color: COLORS.PRIMARY,
          title: '📻 Calidad de Audio Actualizada',
          description:
            `# **${Math.round(targetBitrate / 1000)} kbps**\n\n` +
            `> Fidelidad de audio ajustada. Ideal para música, partidas competitivas o podcasting.\n\n` +
            `${SYMBOLS.ARROW} **Límite máximo del servidor:** \`${Math.round(maxBitrate / 1000)} kbps\``,
          footerText: 'Nebula HD Audio Engine'
        });

        return await interaction.reply({ embeds: [embed] });
      } catch (err) {
        return await interaction.reply({
          content: '❌ No se pudo ajustar el bitrate. Verifica que el servidor soporte esa tasa de bits.',
          ephemeral: true
        });
      }
    }

    // 9. REGIÓN WEBRTC
    if (sub === 'region') {
      const region = interaction.options.getString('servidor');
      const targetRegion = region === 'auto' ? null : region;

      try {
        await voiceChannel.setRTCRegion(targetRegion);

        const embed = createNebulaEmbed(interaction.client, {
          color: COLORS.SECONDARY,
          title: '🌐 Región de Servidor Actualizada',
          description: `> Servidor de voz WebRTC cambiado a: **${region.toUpperCase()}**.\nOptimizado para menor latencia y ping de los participantes.`
        });

        return await interaction.reply({ embeds: [embed] });
      } catch (err) {
        return await interaction.reply({
          content: '❌ No se pudo modificar la región WebRTC.',
          ephemeral: true
        });
      }
    }

    // 10. PANEL DE CONTROL TÁCTIL
    if (sub === 'panel') {
      const panelEmbed = createNebulaEmbed(interaction.client, {
        color: COLORS.PRIMARY,
        title: '🎛️ Centro de Mando de Sala de Voz',
        thumbnail: interaction.user.displayAvatarURL({ dynamic: true }),
        description:
          `# **${voiceChannel.name}**\n\n` +
          `Pulsa los botones táctiles inferiores para gestionar tu sala privada de inmediato:\n\n` +
          `${SYMBOLS.ARROW} **Propietario:** <@${ownerId || interaction.user.id}>\n` +
          `${SYMBOLS.ARROW} **Límite actual:** \`${voiceChannel.userLimit === 0 ? 'Sin límite' : voiceChannel.userLimit + ' miembros'}\`\n` +
          `${SYMBOLS.ARROW} **Bitrate:** \`${Math.round(voiceChannel.bitrate / 1000)} kbps\`\n\n` +
          `*Controles rápidos accesibles para ti y tus compañeros de canal.*`,
        footerText: 'Nebula Voice Controller • Interacción Táctil'
      });

      return await interaction.reply({
        embeds: [panelEmbed],
        components: createVoiceControlRow()
      });
    }
  }
};
