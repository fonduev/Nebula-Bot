// ============================================================
// Comando /transferir - Transferencia de Nebula Coins entre Miembros
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');
const { transferCoins } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('transferir')
    .setDescription('Transfiere Nebula Coins de tu saldo a otro miembro del servidor')
    .addUserOption(opt =>
      opt
        .setName('usuario')
        .setDescription('El miembro que recibirá las monedas')
        .setRequired(true)
    )
    .addIntegerOption(opt =>
      opt
        .setName('cantidad')
        .setDescription('Número de monedas a transferir')
        .setMinValue(1)
        .setMaxValue(100000)
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('usuario');
    const amount = interaction.options.getInteger('cantidad');

    if (targetUser.id === interaction.user.id) {
      return await interaction.reply({
        content: '❌ No puedes transferirte monedas a ti mismo.',
        ephemeral: true
      });
    }

    if (targetUser.bot) {
      return await interaction.reply({
        content: '❌ No puedes transferir monedas a un bot.',
        ephemeral: true
      });
    }

    const result = transferCoins(interaction.guildId, interaction.user.id, targetUser.id, amount);

    if (!result.success) {
      return await interaction.reply({
        content: `❌ Fondos insuficientes. Tu saldo actual es de **${result.balance} 🪙 Nebula Coins**, no puedes transferir **${amount}**.`,
        ephemeral: true
      });
    }

    const embed = createNebulaEmbed(interaction.client, {
      color: COLORS.SUCCESS,
      title: '💸 Transferencia Completada con Éxito',
      thumbnail: targetUser.displayAvatarURL({ dynamic: true }),
      description:
        `# **${amount} 🪙 Nebula Coins Transferidas**\n\n` +
        `> Se ha completado la transacción entre miembros de **${interaction.guild.name}**.\n\n` +
        `${SYMBOLS.ARROW} **Emisor:** ${interaction.user} (\`${interaction.user.tag}\`)\n` +
        `${SYMBOLS.ARROW} **Receptor:** ${targetUser} (\`${targetUser.tag}\`)\n` +
        `${SYMBOLS.ARROW} **Monto:** \`${amount} Coins\`\n` +
        `${SYMBOLS.ARROW} **Tu nuevo saldo:** \`${result.senderBalance} Coins\``,
      footerText: 'Nebula Economy System • Comercio Seguro'
    });

    return await interaction.reply({ embeds: [embed] });
  }
};
