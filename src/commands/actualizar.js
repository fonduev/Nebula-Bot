// ============================================================
// Comando /actualizar - Sincronizador Automático de GitHub
// Uso exclusivo de Administradores del Bot
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { execSync } = require('child_process');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('actualizar')
    .setDescription('Descarga los últimos cambios de GitHub (git pull) y actualiza el bot en la máquina virtual')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // Verificar permisos
    const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
    if (!isAdmin) {
      return await interaction.reply({
        content: '❌ Solo los administradores pueden ejecutar este comando.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // 1. Obtener commit actual antes del pull
      let beforeCommit = 'desconocido';
      try {
        beforeCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
      } catch (e) {}

      // 2. Ejecutar git pull origin main
      console.log('[Auto-Updater] Ejecutando git pull origin main...');
      const pullOutput = execSync('git pull origin main', { encoding: 'utf8' });

      // 3. Ejecutar npm install para nuevas dependencias
      console.log('[Auto-Updater] Ejecutando npm install...');
      let npmOutput = '';
      try {
        npmOutput = execSync('npm install --no-audit --no-fund', { encoding: 'utf8' });
      } catch (e) {
        npmOutput = e.message;
      }

      // 4. Obtener nuevo commit tras el pull
      let afterCommit = beforeCommit;
      try {
        afterCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
      } catch (e) {}

      const hasNewChanges = beforeCommit !== afterCommit;

      const embed = createNebulaEmbed(interaction.client, {
        color: COLORS.SUCCESS,
        title: '🔄 Sincronización con GitHub Completada',
        description:
          `>>> **El bot ha sincronizado su código fuente con el repositorio oficial.**\n\n` +
          `${SYMBOLS.ARROW} **Commit Anterior:** \`${beforeCommit}\`\n` +
          `${SYMBOLS.ARROW} **Commit Actual:** \`${afterCommit}\`\n` +
          `${SYMBOLS.ARROW} **Estado:** ${hasNewChanges ? '✨ Se descargaron nuevos parches.' : '✅ El bot ya estaba en la versión más reciente.'}\n\n` +
          `\`\`\`bash\n${pullOutput.slice(0, 500).trim()}\n\`\`\`\n` +
          `*(Si estás usando PM2 o systemd en tu máquina virtual, el bot se reiniciará automáticamente en 3 segundos)*`,
        footerText: 'Nebula Git Auto-Updater'
      });

      await interaction.editReply({ embeds: [embed] });

      // Si hubo cambios, reiniciar el proceso tras 3 segundos para recargar módulos
      if (hasNewChanges) {
        setTimeout(() => {
          console.log('[Auto-Updater] Reiniciando proceso para aplicar cambios de código...');
          process.exit(0);
        }, 3000);
      }

    } catch (err) {
      console.error('[Auto-Updater] Error actualizando bot:', err);
      return await interaction.editReply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Error al Actualizar desde GitHub',
            description:
              `> Ocurrió un error al intentar sincronizar con Git:\n\`\`\`bash\n${err.message.slice(0, 500)}\n\`\`\`\n` +
              `*Verifica la consola de la máquina virtual o ejecuta \`git pull\` manualmente.*`
          })
        ]
      });
    }
  }
};
