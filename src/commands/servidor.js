// ============================================================
// Comando /servidor - Monitor de Servidores Minecraft (Java & Bedrock)
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, SYMBOLS, createProgressBar, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('servidor')
    .setDescription('Consulta en tiempo real el estado, jugadores, latencia y MOTD de un servidor Java o Bedrock')
    .addStringOption(option =>
      option
        .setName('ip')
        .setDescription('Dirección IP o dominio del servidor (ej: mc.hypixel.net, play.nethergames.org)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('tipo')
        .setDescription('Edición del servidor de Minecraft')
        .setRequired(false)
        .addChoices(
          { name: '☕ Minecraft Java (Predeterminado)', value: 'java' },
          { name: '📱 Minecraft Bedrock / Pocket Edition', value: 'bedrock' }
        )
    ),

  async execute(interaction) {
    const serverIp = interaction.options.getString('ip').trim();
    const type = interaction.options.getString('tipo') || 'java';
    await interaction.deferReply();

    const embed = await fetchServerEmbed(serverIp, interaction.client, type);
    const row = createServerButtons(serverIp, type);

    await interaction.editReply({ embeds: [embed], components: [row] });
  },

  fetchServerEmbed,
  createServerButtons
};

async function fetchServerEmbed(serverIp, client, type = 'java') {
  try {
    const startTime = Date.now();
    const isBedrock = type === 'bedrock';
    const endpoint = isBedrock
      ? `https://api.mcsrvstat.us/bedrock/3/${encodeURIComponent(serverIp)}`
      : `https://api.mcsrvstat.us/3/${encodeURIComponent(serverIp)}`;

    const response = await fetch(endpoint);
    const data = await response.json();
    const queryLatency = Date.now() - startTime;
    const serverFavicon = `https://eu.mc-api.net/v3/server/favicon/${encodeURIComponent(serverIp)}`;

    if (!data.online) {
      return createNebulaEmbed(client, {
        color: COLORS.ERROR,
        title: `🔴 Servidor Desconectado | ${serverIp}`,
        thumbnail: serverFavicon,
        description:
          `>>> **No se pudo establecer conexión con \`${serverIp}\` [${isBedrock ? 'Bedrock' : 'Java'}].**\n\n` +
          `${SYMBOLS.ARROW} **Posibles Causas:**\n` +
          `• La dirección IP o puerto está mal escrito.\n` +
          `• El servidor está temporalmente apagado o en mantenimiento.\n` +
          `• El firewall del host está bloqueando solicitudes de ping externo.`,
        fields: [
          {
            name: '⏱️ Tiempo de Respuesta de Red',
            value: `\`${queryLatency} ms\` (Inaccesible)`,
            inline: true
          },
          {
            name: '🏷️ Edición Consultada',
            value: isBedrock ? '`Minecraft Bedrock`' : '`Minecraft Java`',
            inline: true
          }
        ],
        footerText: `Nebula Monitor • Host: ${serverIp}`
      });
    }

    // Limpiar y estructurar el MOTD
    let motdClean = 'Sin descripción disponible';
    if (data.motd && data.motd.clean) {
      motdClean = Array.isArray(data.motd.clean) ? data.motd.clean.join('\n') : data.motd.clean;
    }

    const onlinePlayers = data.players?.online ?? 0;
    const maxPlayers = data.players?.max ?? 0;
    const progressBar = createProgressBar(onlinePlayers, maxPlayers, 12);

    const fields = [
      {
        name: '👥 Jugadores Conectados',
        value: `**${onlinePlayers.toLocaleString()}** / **${maxPlayers.toLocaleString()}**\n${progressBar}`,
        inline: false
      },
      {
        name: '🏷️ Versión de Juego',
        value: `\`${data.version || 'Universal'}\``,
        inline: true
      },
      {
        name: '🌐 Puerto de Red',
        value: `\`${data.port || (isBedrock ? 19132 : 25565)}\``,
        inline: true
      },
      {
        name: '📡 Edición / Software',
        value: `\`${isBedrock ? (data.software || 'Bedrock Dedicated') : (data.protocol?.name || 'Minecraft Java')}\``,
        inline: true
      }
    ];

    // Si el servidor expone lista de jugadores muestra
    if (Array.isArray(data.players?.list) && data.players.list.length > 0) {
      const sampleNames = data.players.list
        .slice(0, 8)
        .map(p => `\`${typeof p === 'string' ? p : p.name}\``)
        .join(' ');
      const extraCount = data.players.list.length > 8 ? ` *(y ${data.players.list.length - 8} más)*` : '';
      fields.push({
        name: '🎮 Jugadores en Muestra',
        value: sampleNames + extraCount,
        inline: false
      });
    }

    const embed = createNebulaEmbed(client, {
      color: COLORS.SUCCESS,
      title: `🟢 Servidor en Línea | ${data.hostname || serverIp}`,
      thumbnail: serverFavicon,
      description:
        `\`\`\`ansi\n\u001b[1;36m${motdClean.trim()}\u001b[0m\n\`\`\`\n` +
        `>>> **Respuesta de consulta:** \`${queryLatency} ms\` • **Estado:** 🟢 \`OPERATIVO\` [${isBedrock ? 'Bedrock' : 'Java'}]`,
      fields: fields,
      footerText: `Nebula Bot • Monitor en Tiempo Real • IP: ${serverIp}`
    });

    return embed;
  } catch (error) {
    console.error('Error al consultar servidor de Minecraft:', error);
    return createNebulaEmbed(client, {
      color: COLORS.ERROR,
      title: `❌ Error de Red | ${serverIp}`,
      description: `Ocurrió un error inesperado al intentar consultar los datos de **${serverIp}**.`
    });
  }
}

function createServerButtons(serverIp, type = 'java') {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`refresh_server_${serverIp}_${type}`)
      .setLabel('Actualizar Estado')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🔄'),
    new ButtonBuilder()
      .setCustomId(`btn_copy_ip_${serverIp}`)
      .setLabel('Copiar IP')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📋'),
    new ButtonBuilder()
      .setLabel('Jugar en Nebula Launcher')
      .setStyle(ButtonStyle.Link)
      .setEmoji('🚀')
      .setURL('https://nebuladevstudios.com/launcher.html')
  );
}
