// ============================================================
// Comando /ticket-panel - Creador de Paneles de Tickets
// Nebula Dev Studios • nebuladevstudios.com
// Sistema Oficial de Tickets Automatizados
// ============================================================

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Despliega el panel oficial e interactivo de tickets de soporte en un canal (Administración)')
    .addChannelOption(option =>
      option
        .setName('canal')
        .setDescription('Canal donde enviar el panel de tickets (opcional, por defecto el actual)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('titulo').setDescription('Título personalizado del panel').setRequired(false)
    )
    .addStringOption(option =>
      option.setName('descripcion').setDescription('Mensaje explicativo del panel (acepta \\n)').setRequired(false)
    )
    .addChannelOption(option =>
      option
        .setName('categoria_soporte')
        .setDescription('Categoría de canales donde se abrirán los tickets')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(false)
    )
    .addRoleOption(option =>
      option
        .setName('rol_staff')
        .setDescription('Rol del equipo de soporte con acceso prioritario a los tickets')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Necesitas permisos de `Administrador` para configurar el panel de tickets.',
        ephemeral: true
      });
    }

    const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
    const title = interaction.options.getString('titulo') || '🎫 Centro de Soporte & Asistencia | Nebula Studios';
    let description = interaction.options.getString('descripcion');
    const categoryChannel = interaction.options.getChannel('categoria_soporte');
    const staffRole = interaction.options.getRole('rol_staff');

    if (!description) {
      description =
        `>>> **¿Necesitas ayuda con el servidor, tu cuenta o Nebula Launcher?**\n\n` +
        `Selecciona la categoría correspondiente haciendo clic en uno de los botones inferiores para abrir un canal privado con nuestro equipo de moderación.\n\n` +
        `${SYMBOLS.ARROW} **Horario de atención:** Equipo activo 24/7\n` +
        `${SYMBOLS.ARROW} **Regla:** Sé paciente y describe tu caso con claridad.`;
    } else {
      description = description.replace(/\\n/g, '\n');
    }

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.PRIMARY,
      title: title,
      description: description,
      fields: [
        {
          name: '📩 Soporte General',
          value: 'Dudas sobre rangos, roles, vinculación y comunidad.',
          inline: true
        },
        {
          name: '🚀 Soporte Técnico Launcher',
          value: 'Problemas de arranque, Java, mods o instalación v5.0.8.',
          inline: true
        },
        {
          name: '🛡️ Reportes & Quejas',
          value: 'Reporte confidencial de usuarios infractores o fallos graves.',
          inline: true
        }
      ],
      footerText: 'Nebula Ticket System • Sistema Oficial de Soporte'
    });

    // Guardar metadata en el customId si hay categoría o rol especificado
    // Formato: ticket_cat_${categoriaId || 'none'}_role_${rolId || 'none'}
    const catId = categoryChannel ? categoryChannel.id : 'none';
    const rId = staffRole ? staffRole.id : 'none';

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_create_general_${catId}_${rId}`)
        .setLabel('Soporte General')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📩'),
      new ButtonBuilder()
        .setCustomId(`ticket_create_launcher_${catId}_${rId}`)
        .setLabel('Nebula Launcher')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🚀'),
      new ButtonBuilder()
        .setCustomId(`ticket_create_report_${catId}_${rId}`)
        .setLabel('Reportar Incidencia')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🛡️')
    );

    try {
      await targetChannel.send({ embeds: [embed], components: [row] });
      await interaction.reply({
        content: `✅ Panel de tickets publicado exitosamente en ${targetChannel}.`,
        ephemeral: true
      });
    } catch (err) {
      console.error('Error al desplegar panel de tickets:', err);
      await interaction.reply({
        content: `❌ No se pudo publicar el panel en ${targetChannel}. Comprueba que el bot tenga permisos de lectura y escritura en ese canal.`,
        ephemeral: true
      });
    }
  }
};
