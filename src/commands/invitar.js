// ============================================================
// Comando /invitar - Enlaces de Invitación Oficiales
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invitar')
    .setDescription('Obtén los enlaces oficiales para añadir a Nebula Bot a tu propio servidor de Discord'),

  async execute(interaction) {
    const clientId = process.env.CLIENT_ID || interaction.client.user.id;

    // Enlace con permisos de Administrador (experiencia completa sin configurar permisos canal por canal)
    const adminInviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&integration_type=0&scope=bot+applications.commands`;

    // Enlace con permisos estándar (Moderación, Canales, Voz, Mensajes, Embeds - Sin rol de Admin)
    const standardInviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=1374393699408&integration_type=0&scope=bot+applications.commands`;

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.PRIMARY,
      title: '🌌 ¡Lleva a Nebula Bot a tu Servidor!',
      url: 'https://nebuladevstudios.com',
      thumbnail: interaction.client.user.displayAvatarURL(),
      description:
        `>>> **El ecosistema integral definitivo para servidores de Minecraft y comunidades gamer.**\n` +
        `Todo en uno: monitoreo de servidores en vivo, buscador Modrinth, música de alta fidelidad, auto-voz, tickets, economía y moderación.\n\n` +
        `${SYMBOLS.STAR} **100% Gratuito y Optimizado:** Sin planes de pago ni restricciones artificiales.\n` +
        `${SYMBOLS.STAR} **Salas de Auto-Voz:** Crea salas temporales que se limpian solas al salir.\n` +
        `${SYMBOLS.STAR} **Monitor Minecraft 24/7:** Banners interactivos en vivo con ping Java & Bedrock.\n` +
        `${SYMBOLS.STAR} **Música Sin Cortes:** Reproduce desde YouTube y Spotify con volumen y controles táctiles.\n` +
        `${SYMBOLS.STAR} **Casino & Niveles:** Minijuegos de ruleta, slots, dados y recompensas por chatear.`,
      fields: [
        {
          name: '🚀 Primeros Pasos tras Invitarlo',
          value:
            `**1.** Haz clic en cualquiera de los botones de abajo para añadirlo a tu servidor.\n` +
            `**2.** Coloca el rol de **Nebula Bot** lo más arriba posible en la lista de roles para que pueda gestionar auto-roles y sanciones.\n` +
            `**3.** Escribe \`/ayuda\` para ver el centro de control interactivo con los 76 comandos.`,
          inline: false
        },
        {
          name: '⚡ Comandos Recomendados para Configurar tu Servidor',
          value:
            `${SYMBOLS.ARROW} \`/auto-voz\`: Configura el canal "Unirse para Crear".\n` +
            `${SYMBOLS.ARROW} \`/auto-status\`: Banner en vivo de tu servidor de Minecraft.\n` +
            `${SYMBOLS.ARROW} \`/ticket-panel\`: Publica un panel oficial de atención a usuarios.\n` +
            `${SYMBOLS.ARROW} \`/bienvenida\`: Mensajes automáticos para nuevos miembros.`,
          inline: false
        }
      ],
      footerText: 'Nebula Dev Studios • nebuladevstudios.com'
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Añadir al Servidor (Recomendado)')
        .setStyle(ButtonStyle.Link)
        .setEmoji('➕')
        .setURL(adminInviteUrl),
      new ButtonBuilder()
        .setLabel('Añadir sin Permisos de Admin')
        .setStyle(ButtonStyle.Link)
        .setEmoji('🛡️')
        .setURL(standardInviteUrl),
      new ButtonBuilder()
        .setLabel('Servidor de Soporte')
        .setStyle(ButtonStyle.Link)
        .setEmoji('💬')
        .setURL('https://discord.gg/cfE254mQHZ'),
      new ButtonBuilder()
        .setLabel('Web Oficial')
        .setStyle(ButtonStyle.Link)
        .setEmoji('🌐')
        .setURL('https://nebuladevstudios.com')
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
