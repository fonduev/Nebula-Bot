// ============================================================
// Comando /recordatorio - Alarmas y Recordatorios Personalizados
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

function parseDuration(str) {
  const match = (str || '').trim().match(/^(\d+)([smhd])$/i);
  if (!match) return null;
  const num = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case 's': return num * 1000;
    case 'm': return num * 60 * 1000;
    case 'h': return num * 60 * 60 * 1000;
    case 'd': return num * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recordatorio')
    .setDescription('Programa un recordatorio o alarma automática con mención')
    .addStringOption(opt =>
      opt.setName('tiempo')
        .setDescription('Tiempo de espera (ej: 30s, 10m, 2h, 1d)')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('mensaje')
        .setDescription('¿Qué deseas que te recuerde Nebula Bot?')
        .setRequired(true)
    ),

  async execute(interaction) {
    const timeStr = interaction.options.getString('tiempo');
    const reminderText = interaction.options.getString('mensaje');

    const ms = parseDuration(timeStr);
    if (!ms || ms < 5000 || ms > 7 * 24 * 60 * 60 * 1000) {
      return await interaction.reply({
        content: '❌ Formato de tiempo inválido. Usa un valor como `30s`, `10m`, `2h` o `1d` (entre 5 segundos y 7 días).',
        ephemeral: true
      });
    }

    const fireTimestamp = Math.floor((Date.now() + ms) / 1000);

    const scheduledEmbed = createNebulaEmbed(interaction.client, {
      color: COLORS.PRIMARY,
      title: '⏰ Recordatorio Programado',
      description:
        `>>> He anotado tu recordatorio en los cronómetros de Nebula.\n\n` +
        `${SYMBOLS.ARROW} **Mensaje:** \`${reminderText}\`\n` +
        `${SYMBOLS.ARROW} **Aviso en:** <t:${fireTimestamp}:R> (<t:${fireTimestamp}:T>)\n` +
        `${SYMBOLS.ARROW} **Canal:** <#${interaction.channelId}>`,
      footerText: 'Nebula Task Scheduler • Gestión de Tiempo'
    });

    await interaction.reply({ embeds: [scheduledEmbed] });

    setTimeout(async () => {
      try {
        const channel = await interaction.client.channels.fetch(interaction.channelId);
        if (!channel) return;

        const alarmEmbed = createNebulaEmbed(interaction.client, {
          color: COLORS.GOLD,
          title: '🔔 ¡TIEMPO CUMPLIDO - RECORDATORIO!',
          thumbnail: interaction.user.displayAvatarURL({ dynamic: true }),
          description:
            `# ⏰ **¡Alarma de Nebula Bot!**\n\n` +
            `Hola <@${interaction.user.id}>, me pediste que te recordara esto <t:${fireTimestamp}:R>:\n\n` +
            `>>> ### **${reminderText}**\n\n` +
            `${SYMBOLS.ARROW} **Fecha original:** <t:${Math.floor((Date.now() - ms) / 1000)}:f>`,
          footerText: 'Nebula Reminder Service • Notificación Completada'
        });

        await channel.send({
          content: `🔔 <@${interaction.user.id}> ¡Tu recordatorio ha sonado!`,
          embeds: [alarmEmbed]
        });
      } catch (err) {
        console.error('[Recordatorio Error]', err.message);
      }
    }, ms);
  }
};
