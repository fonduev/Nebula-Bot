// ============================================================
// Comando /ticket - Gestión de Canales de Tickets
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Comandos de gestión y control para canales de tickets')
    .addSubcommand(sub =>
      sub
        .setName('cerrar')
        .setDescription('Cierra y elimina el ticket de soporte actual')
        .addStringOption(opt => opt.setName('razon').setDescription('Motivo de cierre del ticket').setRequired(false))
    )
    .addSubcommand(sub =>
      sub
        .setName('agregar')
        .setDescription('Añade a otro miembro al canal del ticket actual')
        .addUserOption(opt => opt.setName('usuario').setDescription('El miembro que deseas invitar').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('remover')
        .setDescription('Remueve el acceso de un miembro al ticket actual')
        .addUserOption(opt => opt.setName('usuario').setDescription('El miembro que deseas retirar').setRequired(true))
    )
    .addSubcommand(sub =>
      sub
        .setName('reclamar')
        .setDescription('Reclama la atención de este ticket como miembro del Staff')
    ),

  async execute(interaction) {
    const channel = interaction.channel;

    // Verificar si el canal actual es un ticket
    if (!channel.name.startsWith('ticket-')) {
      return await interaction.reply({
        content: '❌ Este comando solo puede utilizarse dentro de un canal de ticket activo.',
        ephemeral: true
      });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'cerrar') {
      const reason = interaction.options.getString('razon') || 'Ticket resuelto por el usuario / Staff';

      const embed = createNebulaEmbed(interaction.client, {
        color: COLORS.ERROR,
        title: '🔒 Ticket Cerrado',
        description:
          `>>> **Este ticket ha sido cerrado por ${interaction.user.tag}.**\n\n` +
          `${SYMBOLS.ARROW} **Motivo:** ${reason}\n\n` +
          `*El canal será eliminado en 5 segundos...*`,
        footerText: 'Nebula Ticket Management'
      });

      await interaction.reply({ embeds: [embed] });

      setTimeout(async () => {
        try {
          await channel.delete();
        } catch (e) {
          console.error('Error al borrar canal de ticket:', e);
        }
      }, 5000);
      return;
    }

    if (sub === 'agregar') {
      const targetUser = interaction.options.getUser('usuario');
      try {
        await channel.permissionOverwrites.edit(targetUser.id, {
          ViewChannel: true,
          SendMessages: true,
          AttachFiles: true,
          EmbedLinks: true,
          ReadMessageHistory: true
        });

        const embed = createNebulaEmbed(interaction.client, {
          color: COLORS.SUCCESS,
          title: '👤 Miembro Añadido al Ticket',
          description: `> <@${targetUser.id}> ha sido añadido al ticket por ${interaction.user.tag}.`
        });

        await interaction.reply({ embeds: [embed] });
      } catch (err) {
        await interaction.reply({ content: '❌ Ocurrió un error al otorgar permisos al usuario.', ephemeral: true });
      }
      return;
    }

    if (sub === 'remover') {
      const targetUser = interaction.options.getUser('usuario');
      try {
        await channel.permissionOverwrites.delete(targetUser.id);

        const embed = createNebulaEmbed(interaction.client, {
          color: COLORS.WARNING,
          title: '👤 Miembro Retirado del Ticket',
          description: `> <@${targetUser.id}> ha sido retirado de este ticket.`
        });

        await interaction.reply({ embeds: [embed] });
      } catch (err) {
        await interaction.reply({ content: '❌ Ocurrió un error al retirar permisos al usuario.', ephemeral: true });
      }
      return;
    }

    if (sub === 'reclamar') {
      const isStaff = interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) || interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels);
      if (!isStaff) {
        return await interaction.reply({
          content: '❌ Solo los miembros del Staff de soporte o moderación pueden reclamar la atención de tickets.',
          ephemeral: true
        });
      }

      const embed = createNebulaEmbed(interaction.client, {
        color: COLORS.PRIMARY,
        title: '📌 Ticket Reclamado',
        description:
          `>>> **Atención asignada al Staff.**\n\n` +
          `${SYMBOLS.ARROW} **Atendido por:** <@${interaction.user.id}>\n` +
          `Por favor continúa la conversación directamente con el moderador asignado.`
      });

      await interaction.reply({ embeds: [embed] });
      return;
    }
  }
};
