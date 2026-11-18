// ============================================================
// Comando /vincular - Vinculación de Cuenta Minecraft
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');
const { setLinkedMinecraft } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vincular')
    .setDescription('Vincula tu usuario de Minecraft con tu cuenta de Discord para Nebula Launcher')
    .addStringOption(option =>
      option
        .setName('usuario')
        .setDescription('Tu nombre de usuario exacto en Minecraft (ej: Steve)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const mcUser = interaction.options.getString('usuario').trim();
    setLinkedMinecraft(interaction.user.id, mcUser);
    const randomCode = 'NEB-' + Math.floor(1000 + Math.random() * 9000);
    const skinAvatarUrl = `https://mc-heads.net/avatar/${encodeURIComponent(mcUser)}/128`;

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.PRIMARY,
      title: '🔗 Vinculación de Perfil | Nebula Launcher',
      thumbnail: skinAvatarUrl,
      description:
        `>>> **¡Hola, ${interaction.user.username}!**\n` +
        `Estás a un paso de sincronizar tu cuenta de Discord con el usuario de Minecraft **\`${mcUser}\`**.\n` +
        `Sigue las instrucciones que se detallan a continuación para completar la verificación:`,
      fields: [
        {
          name: '1️⃣ Paso 1: Inicia Nebula Launcher',
          value: 'Abre el lanzador en tu PC y dirígete a la pestaña **Ajustes > Cuentas & Discord**.',
          inline: false
        },
        {
          name: '2️⃣ Paso 2: Introduce tu Código de Verificación',
          value: `\`\`\`ansi\n\u001b[1;35m${randomCode}\u001b[0m\n\`\`\`\n*Este código expira en 15 minutos.*`,
          inline: false
        },
        {
          name: '🎁 Beneficios Desbloqueados',
          value:
            `${SYMBOLS.ARROW} Rol exclusivo de **Jugador Verificado** en Discord.\n` +
            `${SYMBOLS.ARROW} Sincronización de tu perfil de jugador y estadísticas.\n` +
            `${SYMBOLS.ARROW} Notificaciones de logros y eventos de la comunidad.`,
          inline: false
        }
      ],
      footerText: 'Nebula Dev Studios • Sistema de Identidad Unificada'
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
