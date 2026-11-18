// ============================================================
// Comando /voz-mute - Moderación de Canales de Voz
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voz-mute')
    .setDescription('Silencia o desilencia a los miembros de tu canal de voz actual (Moderación)')
    .addStringOption(option =>
      option
        .setName('accion')
        .setDescription('Elige si deseas silenciar o reactivar el micrófono')
        .setRequired(true)
        .addChoices(
          { name: '🔇 Silenciar a Todos (Mute All)', value: 'mute' },
          { name: '🔊 Desilenciar a Todos (Unmute All)', value: 'unmute' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.MuteMembers)) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Permiso Denegado',
            description: '> Necesitas permisos de `Silenciar Miembros` para ejecutar esta acción.'
          })
        ],
        ephemeral: true
      });
    }

    const memberVoice = interaction.member.voice.channel;
    if (!memberVoice) {
      return await interaction.reply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.WARNING,
            title: '🔇 Canal No Encontrado',
            description: '> Debes estar conectado en el canal de voz que deseas moderar.'
          })
        ],
        ephemeral: true
      });
    }

    const action = interaction.options.getString('accion');
    const isMute = action === 'mute';

    await interaction.deferReply();

    let count = 0;
    for (const [_, member] of memberVoice.members) {
      if (member.id === interaction.client.user.id) continue;
      try {
        await member.voice.setMute(isMute, `Comando /voz-mute por ${interaction.user.tag}`);
        count++;
      } catch (e) {
        // Ignorar miembros que no puedan ser alterados
      }
    }

    const embed = createNebulaEmbed(interaction.client, {
      color: isMute ? COLORS.WARNING : COLORS.SUCCESS,
      title: isMute ? '🔇 Canal de Voz Silenciado' : '🔊 Micrófonos Reactivados',
      description:
        `>>> **Acción de moderación aplicada a \`${count}\` miembros en <#${memberVoice.id}>.**\n\n` +
        `${SYMBOLS.ARROW} **Moderador:** ${interaction.user.tag}\n` +
        `${SYMBOLS.ARROW} **Estado:** \`${isMute ? 'SILENCIO GLOBAL ACTIVADO' : 'TODOS PUEDEN HABLAR'}\``,
      footerText: 'Nebula Voice Moderation'
    });

    await interaction.editReply({ embeds: [embed] });
  }
};
