// ============================================================
// Comando /verificar - Sistema de Verificación Anti-Bots en 1 Clic
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');
const { setGuildConfig } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verificar')
    .setDescription('Publica el panel oficial de verificación anti-bots con botón de 1 clic')
    .addRoleOption(opt =>
      opt.setName('rol')
        .setDescription('Rol que se otorgará al verificarse (ej: Miembro / Verificado)')
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName('canal')
        .setDescription('Canal donde publicar el panel (ej: #verificación)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Permiso Denegado',
            description: '> Este comando solo puede ser configurado por usuarios con permisos de **Administrador**.'
          })
        ],
        ephemeral: true
      });
    }

    const role = interaction.options.getRole('rol');
    const targetChannel = interaction.options.getChannel('canal') || interaction.channel;

    const myHighest = interaction.guild.members.me.roles.highest.position;
    if (role.position >= myHighest) {
      return await interaction.reply({
        content: `❌ No puedo asignar el rol ${role} porque su jerarquía está por encima o igual a mi rol más alto. Por favor sube mi rol en Ajustes del Servidor.`,
        ephemeral: true
      });
    }

    setGuildConfig(interaction.guildId, { verifyRoleId: role.id });

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.SUCCESS,
      title: '🛡️ Verificación de Seguridad del Servidor',
      thumbnail: interaction.guild.iconURL({ dynamic: true }) || 'https://nebuladevstudios.com/assets/img/logo.svg',
      description:
        `# **¡Bienvenido a ${interaction.guild.name}!**\n\n` +
        `> Para mantener nuestra comunidad protegida contra spam, bots y cuentas maliciosas, requerimos una verificación simple de 1 solo clic.\n\n` +
        `### 📌 Instrucciones:\n` +
        `1. Pulsa el botón verde **«Verificarme Ahora»** situado debajo.\n` +
        `2. Recibirás automáticamente el rol ${role}.\n` +
        `3. Se desbloquearán todos los canales de texto, voz y soporte del servidor.\n\n` +
        `*Al verificarte, aceptas respetar las normas comunitarias del servidor.*`,
      footerText: 'Nebula Security Suite • Sistema de Verificación Oficial'
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`btn_verify_member_${role.id}`)
        .setLabel('Verificarme Ahora')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success)
    );

    await targetChannel.send({
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({
      content: `✅ Panel de verificación publicado exitosamente en ${targetChannel} con el rol ${role}.`,
      ephemeral: true
    });
  }
};
