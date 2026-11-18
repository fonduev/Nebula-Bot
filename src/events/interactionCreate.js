// ============================================================
// Evento interactionCreate - Gestor Central de Interacciones
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const {
  Events,
  EmbedBuilder,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits
} = require('discord.js');
const {
  getGuildConfig,
  setGuildConfig,
  getTempVoice,
  setTempVoice,
  getUserData,
  setUserBio,
  claimDaily,
  addWarn,
  removeWarn,
  getGuildWarns,
  getAutoStatus,
  setAutoStatus
} = require('../utils/database');
const { buildProfilePayload } = require('../commands/perfil');
const { buildRankPayload } = require('../commands/rank');
const { buildTopPayload } = require('../commands/top');
const { runSlotsGame } = require('../commands/slots');
const { runRuletaGame } = require('../commands/ruleta');
const { rollDice } = require('../commands/dado');
const { flipCoin } = require('../commands/moneda');
const { answer8Ball } = require('../commands/8ball');
const { buildCrafteoPayload } = require('../commands/crafteo');
const { buildPocionPayload } = require('../commands/pocion');
const { buildEncantamientoPayload } = require('../commands/encantamiento');
const { buildNetherPayload } = require('../commands/nether');
const { buildMcXpPayload } = require('../commands/mc-xp');
const { buildQueuePayload } = require('../commands/queue');
const { buildPingPayload } = require('../commands/ping');
const { buildWarnsPayload } = require('../commands/warns');
const { fetchServerEmbed, createServerButtons } = require('../commands/servidor');
const { buildBenchmarkPayload } = require('../commands/benchmark');
const { searchCache: modSearchCache, buildModEmbed, buildModButtons } = require('../commands/modsearch');
const { getMainHelpEmbed, getHelpSelectMenu } = require('../commands/ayuda');
const { activeGiveaways } = require('../commands/sorteo');
const { activeSuggestions } = require('../commands/sugerencia');
const { COLORS, SYMBOLS, createNebulaEmbed, createOfficialButtonsRow, createProgressBar } = require('../utils/theme');
const { togglePause, stopTrack, setVolume, getSession, skipTrack } = require('../utils/musicManager');
const {
  getDraft,
  setDraft,
  resetDraft,
  buildEmbedFromDraft,
  buildCustomButtonsRow,
  buildStudioPayload,
  createTextModal,
  createColorModal,
  createAuthorModal,
  createImagesModal,
  createFieldModal,
  createFooterModal,
  createButtonsModal,
  createMessageModal,
  createJsonModal
} = require('../utils/embedStudio');

// Almacén en memoria de votos de encuestas
const activePolls = new Map();

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // --------------------------------------------------------
    // 0. Autocompletado en tiempo real (/crafteo, etc.)
    // --------------------------------------------------------
    if (interaction.isAutocomplete()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command || !command.autocomplete) return;
      try {
        await command.autocomplete(interaction);
      } catch (err) {
        if (err.code !== 10062) console.error(`[Autocomplete Error /${interaction.commandName}]`, err.message);
      }
      return;
    }

    // --------------------------------------------------------
    // 1. Manejo de Comandos Slash (/)
    // --------------------------------------------------------
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        console.log(`[Comando] /${interaction.commandName} ejecutado por ${interaction.user.tag} en ${interaction.guild?.name || 'DM'}`);
        await command.execute(interaction);
      } catch (error) {
        if (error.code === 10062 || error.code === 40060) return;
        console.error(`Error en comando /${interaction.commandName}:`, error);
        try {
          const errPayload = {
            embeds: [
              new EmbedBuilder()
                .setColor(COLORS.ERROR)
                .setTitle('❌ Error al Ejecutar el Comando')
                .setDescription(`> Ocurrió un inconveniente inesperado al procesar \`/${interaction.commandName}\`.\nInténtalo nuevamente en unos instantes.`)
            ],
            ephemeral: true
          };
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errPayload).catch(() => {});
          } else {
            await interaction.reply(errPayload).catch(() => {});
          }
        } catch (e) {}
      }
      return;
    }

    // --------------------------------------------------------
    // 2. Menú de Selección Desplegable (/ayuda)
    // --------------------------------------------------------
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'help_category_select') {
        const selected = interaction.values[0];
        let categoryEmbed;

        if (selected === 'help_home') {
          categoryEmbed = getMainHelpEmbed(interaction.client);
        } else if (selected === 'help_tickets_embeds') {
          categoryEmbed = createNebulaEmbed(interaction.client, {
            color: COLORS.GOLD,
            title: '🎫 Sistema de Tickets & Creador de Embeds',
            description:
              `>>> **Herramientas profesionales para soporte y anuncios.**\n` +
              `Paneles interactivos, canales privados automatizados y generador de comunicados.`,
            fields: [
              {
                name: '`▹ /ticket-panel`',
                value: 'Publica el panel oficial con botones para abrir tickets en un clic en `#tickets`.',
                inline: false
              },
              {
                name: '`▹ /ticket [cerrar | agregar | remover | reclamar]`',
                value: 'Comandos dentro del ticket para invitar miembros, cerrarlo con cuenta atrás o reclamarlo.',
                inline: false
              },
              {
                name: '`▹ /embed [builder | rapido | json]`',
                value: 'Embed Studio V2: diseñador visual interactivo con modales en vivo, campos ilimitados, botones V2 con enlaces y soporte de JSON.',
                inline: false
              },
              {
                name: '`▹ /anuncio`',
                value: 'Publicación rápida de comunicados con diseño preconfigurado cósmico.',
                inline: false
              }
            ],
            footerText: 'Nebula Ticket Core • Sistema Integral'
          });
        } else if (selected === 'help_music_voice') {
          categoryEmbed = createNebulaEmbed(interaction.client, {
            color: COLORS.PRIMARY,
            title: '🎵 Música & Canales de Voz',
            description:
              `>>> **Audio de alta fidelidad para tus sesiones de juego y música.**`,
            fields: [
              {
                name: '`▹ /play <cancion>`',
                value: 'Busca y reproduce canciones por nombre, enlaces de YouTube o Spotify. Si hay varias opciones cercanas, despliega un menú interactivo.',
                inline: false
              },
              {
                name: '`▹ /buscar <termino>`',
                value: 'Explora opciones de canciones en YouTube y Spotify para seleccionar en un menú interactivo.',
                inline: false
              },
              {
                name: '`▹ /skip`',
                value: 'Salta la canción actual y reproduce inmediatamente la siguiente pista en la cola.',
                inline: false
              },
              {
                name: '`▹ /queue`',
                value: 'Visualiza la pista en reproducción y la lista de canciones en espera.',
                inline: false
              },
              {
                name: '`▹ /stop`',
                value: 'Detiene la música, vacía la cola y desconecta al bot del canal de voz.',
                inline: false
              },
              {
                name: '`▹ /volume <1-100>`',
                value: 'Ajusta el volumen de salida del reproductor con barra gráfica interactiva.',
                inline: false
              },
              {
                name: '`▹ /voz-info`',
                value: 'Muestra estadísticas técnicas del canal de voz: bitrate, miembros conectados y calidad de enlace.',
                inline: false
              },
              {
                name: '`▹ /voz-mute <mute | unmute>`',
                value: 'Silencia o reactiva el micrófono de todos los miembros del canal de voz para partidas o eventos.',
                inline: false
              }
            ],
            footerText: 'Nebula Music & Voice Engine'
          });
        } else if (selected === 'help_launcher') {
          categoryEmbed = createNebulaEmbed(interaction.client, {
            color: COLORS.SECONDARY,
            title: '🚀 Nebula Launcher & Ecosistema Oficial',
            description:
              `>>> **Ecosistema Oficial de Nebula Launcher v5.0.8**\nDescargas oficiales del cliente de Minecraft, vinculación de cuentas y novedades.`,
            fields: [
              {
                name: '`▹ /launcher`',
                value: 'Descargas oficiales verificadas en formatos `.exe` (Windows), `.zip` (Portable) y `.tar.gz` (Linux), junto con el resumen de especificaciones.',
                inline: false
              },
              {
                name: '`▹ /benchmark`',
                value: 'Sneak peek y comparativa técnica en vivo de la próxima versión en Rust (en desarrollo) frente a la versión actual.',
                inline: false
              },
              {
                name: '`▹ /changelog`',
                value: 'Historial completo de versiones y notas de parches aplicadas (v5.0.8, v5.0.7, etc.).',
                inline: false
              },
              {
                name: '`▹ /vincular <usuario>`',
                value: 'Genera un código seguro para vincular tu nombre de Minecraft con tu cuenta de Discord y verificar tu perfil de jugador.',
                inline: false
              },
              {
                name: '`▹ /reporte <tipo> <descripcion>`',
                value: 'Canal directo de retroalimentación para enviar reportes de bugs o sugerir nuevas características para el lanzador.',
                inline: false
              }
            ],
            footerText: 'Nebula Dev Studios • nebuladevstudios.com/launcher.html'
          });
        } else if (selected === 'help_minecraft') {
          categoryEmbed = createNebulaEmbed(interaction.client, {
            color: COLORS.MINECRAFT,
            title: '⛏️ Herramientas de Minecraft en Tiempo Real',
            description:
              `>>> **Diagnóstico y utilidades para jugadores y servidores**\nMonitoreo de estado en vivo, buscador de mods, modelos tridimensionales e inspectores de perfiles.`,
            fields: [
              {
                name: '`▹ /servidor <ip> [tipo: java|bedrock]`',
                value: 'Consulta en vivo el estado, jugadores en línea, barra visual de capacidad, versión, MOTD con colores y latencia.',
                inline: false
              },
              {
                name: '`▹ /modsearch <termino> [tipo] [cargador]`',
                value: 'Busca mods, shaders, modpacks y resource packs en tiempo real directamente en la API de Modrinth con enlaces de instalación.',
                inline: false
              },
              {
                name: '`▹ /mcuser <usuario>`',
                value: 'Perfil integral de jugador: UUID oficial, skin 3D cuerpo completo, comandos /give y descarga de texturas.',
                inline: false
              },
              {
                name: '`▹ /skin <usuario> [vista]`',
                value: 'Renderiza la skin oficial de cualquier jugador en 3D con varios ángulos de visualización.',
                inline: false
              },
              {
                name: '`▹ /cabeza <usuario>`',
                value: 'Muestra la cabeza 3D del jugador y genera los comandos `/give` exactos para obtenerla en Minecraft 1.20.5+ y anteriores.',
                inline: false
              },
              {
                name: '`▹ /uuid <usuario>`',
                value: 'Obtiene el identificador universal único (UUID) oficial de Mojang con y sin formato para plugins y configuraciones.',
                inline: false
              },
              {
                name: '`▹ /mods [categoria]`',
                value: 'Catálogo de mods recomendados para optimización extrema de FPS (Sodium, Lithium), shaders visuales (Iris) y calidad de vida.',
                inline: false
              },
              {
                name: '`▹ /color`',
                value: 'Tabla completa de códigos de colores Minecraft (`&a`, `&l`, etc.) con previsualización ANSI directa en Discord.',
                inline: false
              }
            ],
            footerText: 'Nebula Bot • Herramientas Minecraft en Vivo'
          });
        } else if (selected === 'help_moderation') {
          categoryEmbed = createNebulaEmbed(interaction.client, {
            color: COLORS.WARNING,
            title: '🛡️ Moderación, Protección & Administración',
            description:
              `>>> **Comandos administrativos para mantener tu comunidad segura y organizada**\nRequieren los permisos adecuados de moderación.`,
            fields: [
              {
                name: '`▹ /limpiar <cantidad>`',
                value: 'Purga entre 1 y 100 mensajes del canal actual de manera instantánea.',
                inline: false
              },
              {
                name: '`▹ /kick <usuario> [razon]`',
                value: 'Expulsa a un miembro infractor del servidor con registro de motivo.',
                inline: false
              },
              {
                name: '`▹ /ban <usuario> [razon]`',
                value: 'Banea permanentemente a un usuario del servidor y elimina su acceso.',
                inline: false
              },
              {
                name: '`▹ /timeout <usuario> <duracion> [razon]`',
                value: 'Aísla temporalmente a un usuario para que no pueda interactuar (desde 1 minuto hasta 1 semana).',
                inline: false
              },
              {
                name: '`▹ /slowmode <segundos> [canal]`',
                value: 'Regula la velocidad del chat configurando un tiempo de espera obligatorio entre mensajes.',
                inline: false
              }
            ],
            footerText: 'Nebula Bot • Seguridad & Control'
          });
        } else if (selected === 'help_community') {
          categoryEmbed = createNebulaEmbed(interaction.client, {
            color: COLORS.PRIMARY,
            title: '📊 Comunidad, Identidad & Diagnóstico',
            description:
              `>>> **Información del servidor, usuarios y conectividad en vivo**`,
            fields: [
              {
                name: '`▹ /serverinfo`',
                value: 'Panel analítico del servidor: propietario, fecha de creación, recuento de miembros, canales, roles y mejoras.',
                inline: false
              },
              {
                name: '`▹ /userinfo [usuario]`',
                value: 'Inspecciona el perfil de cualquier miembro: fecha de ingreso, antigüedad en Discord, roles y avatar.',
                inline: false
              },
              {
                name: '`▹ /avatar [usuario]`',
                value: 'Visualizador de avatar en máxima resolución (1024x1024) con botones de descarga en formato PNG y WEBP.',
                inline: false
              },
              {
                name: '`▹ /roles`',
                value: 'Muestra la jerarquía de roles del servidor y la cantidad de miembros asignados a cada uno.',
                inline: false
              },
              {
                name: '`▹ /botinfo`',
                value: 'Métricas de rendimiento en tiempo real: consumo de memoria RAM, uptime, Node.js y versiones del sistema.',
                inline: false
              },
              {
                name: '`▹ /ping`',
                value: 'Velocímetro de latencia entre Nebula Bot y los servidores de Discord.',
                inline: false
              },
              {
                name: '`▹ /ip`',
                value: 'Dirección oficial del servidor de Minecraft e instrucciones para unirte con un clic.',
                inline: false
              }
            ],
            footerText: 'Nebula Bot • Diagnóstico & Comunidad'
          });
        } else if (selected === 'help_games') {
          categoryEmbed = createNebulaEmbed(interaction.client, {
            color: COLORS.ACCENT,
            title: '🎲 Minijuegos, Entretenimiento & Dinámicas',
            description:
              `>>> **Comandos para animar y dinamizar los canales de tu comunidad**`,
            fields: [
              {
                name: '`▹ /encuesta <pregunta> <opcion_a> <opcion_b>`',
                value: 'Crea una votación comunitaria interactiva con botones de voto en vivo y porcentajes actualizados.',
                inline: false
              },
              {
                name: '`▹ /ppt`',
                value: 'Desafía a Nebula Bot al clásico juego de Piedra, Papel o Tijera utilizando botones interactivos.',
                inline: false
              },
              {
                name: '`▹ /8ball <pregunta>`',
                value: 'Pregunta al oráculo cósmico de Nebula y recibe predicciones místicas para preguntas de Sí o No.',
                inline: false
              },
              {
                name: '`▹ /dado [caras]`',
                value: 'Lanza dados de 6, 12, 20 (con detección de críticos y pifias naturales) o 100 caras.',
                inline: false
              },
              {
                name: '`▹ /moneda`',
                value: 'Lanza una moneda estelar al aire para decidir rápidamente entre Cara o Cruz.',
                inline: false
              }
            ],
            footerText: 'Nebula Bot • Minijuegos & Diversión'
          });
        }

        if (categoryEmbed) {
          const selectRow = getHelpSelectMenu();
          const buttonsRow = createOfficialButtonsRow();
          await interaction.update({ embeds: [categoryEmbed], components: [selectRow, buttonsRow] });
        }
      }

      // 2.2 Selectores de Crafteo, Pociones y Encantamientos
      if (interaction.customId === 'select_crafteo_category') {
        const catKey = interaction.values[0];
        const { getRecipesByCategory } = require('../utils/recipes');
        const firstInCat = getRecipesByCategory(catKey).items[0]?.key || 'piston';
        const payload = buildCrafteoPayload(interaction.client, firstInCat, catKey, 0);
        return await interaction.update(payload);
      }

      if (interaction.customId === 'select_crafteo_item') {
        const itemKey = interaction.values[0];
        const payload = buildCrafteoPayload(interaction.client, itemKey);
        return await interaction.update(payload);
      }

      if (interaction.customId === 'select_pocion_item') {
        const potionKey = interaction.values[0];
        const payload = buildPocionPayload(interaction.client, potionKey);
        return await interaction.update(payload);
      }

      if (interaction.customId === 'select_encantamiento_item') {
        const enchantKey = interaction.values[0];
        const payload = buildEncantamientoPayload(interaction.client, enchantKey);
        return await interaction.update(payload);
      }

      if (interaction.customId.startsWith('modsearch_select_')) {
        const hits = modSearchCache?.get(interaction.message.id);
        if (!hits || hits.length === 0) {
          return await interaction.reply({
            content: '⚠️ Los datos de esta búsqueda han expirado. Por favor realiza una nueva búsqueda con `/modsearch`.',
            ephemeral: true
          });
        }
        const index = parseInt(interaction.values[0], 10) || 0;
        const selectedHit = hits[index] || hits[0];
        const newEmbed = buildModEmbed(interaction.client, selectedHit);
        const newButtons = buildModButtons(selectedHit);
        const currentMenuRow = interaction.message.components[0];
        return await interaction.update({
          embeds: [newEmbed],
          components: [currentMenuRow, newButtons]
        });
      }
      return;
    }

    // --------------------------------------------------------
    // 3. Botones Interactivos
    // --------------------------------------------------------
    if (interaction.isButton()) {
      const customId = interaction.customId;

      // 3.0 Embed Studio V2 - Acciones y Apertura de Modales
      if (customId.startsWith('embed_btn_')) {
        const draft = getDraft(interaction.user.id, interaction.guildId, interaction.guild);

        if (customId === 'embed_btn_text') {
          return await interaction.showModal(createTextModal(draft));
        }
        if (customId === 'embed_btn_color') {
          return await interaction.showModal(createColorModal(draft));
        }
        if (customId === 'embed_btn_author') {
          return await interaction.showModal(createAuthorModal(draft));
        }
        if (customId === 'embed_btn_images') {
          return await interaction.showModal(createImagesModal(draft));
        }
        if (customId === 'embed_btn_add_field') {
          return await interaction.showModal(createFieldModal());
        }
        if (customId === 'embed_btn_del_field') {
          if (Array.isArray(draft.fields) && draft.fields.length > 0) {
            draft.fields.pop();
            return await interaction.update(buildStudioPayload(draft, `🗑️ Último campo eliminado (${draft.fields.length} restantes).`));
          } else {
            return await interaction.update(buildStudioPayload(draft, '⚠️ No hay campos para eliminar.'));
          }
        }
        if (customId === 'embed_btn_footer') {
          return await interaction.showModal(createFooterModal(draft));
        }
        if (customId === 'embed_btn_buttons') {
          return await interaction.showModal(createButtonsModal(draft));
        }
        if (customId === 'embed_btn_msg') {
          return await interaction.showModal(createMessageModal(draft));
        }
        if (customId === 'embed_btn_json') {
          return await interaction.showModal(createJsonModal(draft));
        }
        if (customId === 'embed_btn_reset') {
          const fresh = resetDraft(interaction.user.id, interaction.guildId, interaction.guild);
          return await interaction.update(buildStudioPayload(fresh, '🔄 Embed restablecido a la plantilla original.'));
        }
        return;
      }

      // 3.1 Refrescar Servidor de Minecraft
      if (customId.startsWith('refresh_server_')) {
        const parts = customId.replace('refresh_server_', '').split('_');
        const serverIp = parts[0];
        const type = parts[1] || 'java';
        await interaction.deferUpdate();

        const updatedEmbed = await fetchServerEmbed(serverIp, interaction.client, type);
        const updatedRow = createServerButtons(serverIp, type);

        await interaction.editReply({ embeds: [updatedEmbed], components: [updatedRow] });
        return;
      }

      // 3.1.0 Copiar IP de Servidor
      if (customId.startsWith('btn_copy_ip_')) {
        const ip = customId.replace('btn_copy_ip_', '');
        return await interaction.reply({
          content: `📋 **Dirección IP copiada:**\n\`\`\`text\n${ip}\n\`\`\`\n*Pégala directamente en tu cliente de Minecraft o únete desde Nebula Launcher.*`,
          ephemeral: true
        });
      }

      // 3.1.0.1 Benchmark / Specs de Nebula Launcher
      if (customId === 'btn_launcher_specs') {
        const payload = buildBenchmarkPayload(interaction.client);
        return await interaction.reply({ ...payload, ephemeral: true });
      }

      // 3.1.0.2 Comando Cabeza /give para /mcuser y /skin
      if (customId.startsWith('btn_mcuser_head_')) {
        const username = customId.replace('btn_mcuser_head_', '');
        const embed = createNebulaEmbed(interaction.client, {
          color: COLORS.GOLD,
          title: `🗿 Comandos /give de Cabeza | ${username}`,
          thumbnail: `https://mc-heads.net/avatar/${encodeURIComponent(username)}/128`,
          description:
            `>>> **Comandos para obtener la cabeza de \`${username}\` dentro de Minecraft:**\n\n` +
            `📦 **Minecraft Moderno (1.20.5+):**\n` +
            `\`\`\`mcfunction\n/give @p player_head[profile="${username}"] 1\n\`\`\`\n` +
            `🏷️ **Minecraft Clásico (1.8 a 1.20.4):**\n` +
            `\`\`\`mcfunction\n/give @p minecraft:player_head{SkullOwner:"${username}"} 1\n\`\`\``,
          footerText: `Nebula Heads • Jugador: ${username}`
        });
        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // 3.1.1 Refrescar Monitor Auto-Status
      if (customId === 'btn_autostatus_refresh') {
        const config = getAutoStatus(interaction.guildId);
        if (!config || !config.ip) {
          return await interaction.reply({
            content: '⚠️ Este monitor ya no se encuentra activo o fue detenido previamente.',
            ephemeral: true
          });
        }
        await interaction.deferUpdate();
        const { buildServerStatusEmbed, createAutoStatusButtons } = require('../commands/auto-status');
        const updatedEmbed = await buildServerStatusEmbed(interaction.client, config.ip);
        await interaction.editReply({
          embeds: [updatedEmbed],
          components: [createAutoStatusButtons(config.ip)]
        }).catch(() => {});
        return;
      }

      // 3.1.2 Detener / Desactivar Monitor Auto-Status
      if (customId === 'btn_autostatus_stop') {
        // Verificar que el usuario tenga permisos de moderación o administración
        if (
          !interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) &&
          !interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)
        ) {
          return await interaction.reply({
            content: '❌ **Permiso Denegado:** Solo miembros con la facultad de `Gestionar Canales` o `Administrador` pueden detener el monitor en vivo.',
            ephemeral: true
          });
        }

        const config = getAutoStatus(interaction.guildId);
        if (!config) {
          return await interaction.reply({
            content: '⚠️ El monitor de este servidor ya no se encuentra activo o ya fue detenido.',
            ephemeral: true
          });
        }

        // Eliminar de la base de datos
        setAutoStatus(interaction.guildId, null);

        const stoppedEmbed = createNebulaEmbed(interaction.client, {
          color: COLORS.ERROR,
          title: `🛑 Monitor Detenido | ${config.ip}`,
          description:
            `# **Monitor en Vivo Desactivado**\n\n` +
            `> El monitor automático 24/7 ha sido detenido por ${interaction.user}.\n\n` +
            `${SYMBOLS.ARROW} **Servidor:** \`${config.ip}\`\n` +
            `${SYMBOLS.ARROW} **Fecha de parada:** <t:${Math.floor(Date.now() / 1000)}:R>`,
          footerText: 'Nebula Minecraft Live Monitor • Inactivo'
        });

        // Si se pulsó en el propio mensaje del banner
        if (interaction.message && interaction.message.id === config.messageId) {
          await interaction.update({ embeds: [stoppedEmbed], components: [] });
          await interaction.followUp({
            content: `🛑 **Monitor detenido con éxito:** Se ha desactivado el ciclo de actualización de cada 2 minutos. Para reactivarlo, usa \`/auto-status ip: ${config.ip}\`.`,
            ephemeral: true
          });
        } else {
          // Si se pulsó desde una respuesta efímera o un panel de control
          try {
            const ch = await interaction.client.channels.fetch(config.channelId).catch(() => null);
            if (ch) {
              const msg = await ch.messages.fetch(config.messageId).catch(() => null);
              if (msg) await msg.edit({ embeds: [stoppedEmbed], components: [] }).catch(() => {});
            }
          } catch (e) {}

          await interaction.reply({
            content: `🛑 **Monitor detenido con éxito:** El banner de \`${config.ip}\` ha sido desactivado y ya no se actualizará cada 2 minutos.`,
            ephemeral: true
          });
        }
        return;
      }

      // 3.2 Minijuego Piedra, Papel o Tijera
      if (customId.startsWith('ppt_')) {
        const userChoice = customId.replace('ppt_', '');
        const botChoices = ['piedra', 'papel', 'tijera'];
        const botChoice = botChoices[Math.floor(Math.random() * botChoices.length)];

        const emojis = { piedra: '🪨 Piedra', papel: '📄 Papel', tijera: '✂️ Tijera' };

        let resultTitle = '';
        let resultDesc = '';
        let resultColor = COLORS.PRIMARY;

        if (userChoice === botChoice) {
          resultTitle = '🤝 ¡Empate Cósmico!';
          resultDesc = 'Ambos eligieron la misma opción en esta ronda.';
          resultColor = COLORS.WARNING;
        } else if (
          (userChoice === 'piedra' && botChoice === 'tijera') ||
          (userChoice === 'papel' && botChoice === 'piedra') ||
          (userChoice === 'tijera' && botChoice === 'papel')
        ) {
          resultTitle = '🎉 ¡Victoria para Ti!';
          resultDesc = 'Tu elección ha superado la jugada de Nebula Bot.';
          resultColor = COLORS.SUCCESS;
        } else {
          resultTitle = '🤖 ¡Punto para Nebula Bot!';
          resultDesc = 'La inteligencia del cosmos predijo tu movimiento.';
          resultColor = COLORS.ERROR;
        }

        const embed = createNebulaEmbed(interaction.client, {
          color: resultColor,
          title: `✂️ Piedra, Papel o Tijera | ${resultTitle}`,
          description:
            `>>> ${resultDesc}\n\n` +
            `👤 **Tu Elección:** ${emojis[userChoice]}\n` +
            `🤖 **Nebula Bot:** ${emojis[botChoice]}`,
          footerText: `Partida jugada por ${interaction.user.tag}`
        });

        await interaction.update({ embeds: [embed], components: [] });
        return;
      }

      // 3.3 Votaciones de Encuestas con Barra Visual
      if (customId.startsWith('poll_')) {
        const msgId = interaction.message.id;
        if (!activePolls.has(msgId)) {
          activePolls.set(msgId, { opt1Votes: new Set(), opt2Votes: new Set() });
        }

        const poll = activePolls.get(msgId);
        const userId = interaction.user.id;
        const isOpt1 = customId.startsWith('poll_opt1_');

        if (isOpt1) {
          poll.opt2Votes.delete(userId);
          poll.opt1Votes.add(userId);
        } else {
          poll.opt1Votes.delete(userId);
          poll.opt2Votes.add(userId);
        }

        const count1 = poll.opt1Votes.size;
        const count2 = poll.opt2Votes.size;
        const total = count1 + count2;

        const pct1 = total > 0 ? Math.round((count1 / total) * 100) : 0;
        const pct2 = total > 0 ? Math.round((count2 / total) * 100) : 0;

        const bar1 = createProgressBar(count1, total, 10);
        const bar2 = createProgressBar(count2, total, 10);

        const oldEmbed = interaction.message.embeds[0];
        const updatedEmbed = EmbedBuilder.from(oldEmbed).setDescription(
          `> Vota haciendo clic en los botones de abajo. Los resultados se actualizan en vivo.\n\n` +
          `🔵 **Opción A:** \`${count1} votos\` (${pct1}%)\n${bar1}\n\n` +
          `🟣 **Opción B:** \`${count2} votos\` (${pct2}%)\n${bar2}\n\n` +
          `📊 **Total de participantes:** \`${total} votos registrados\``
        );

        await interaction.update({ embeds: [updatedEmbed] });
        return;
      }

      // 3.4 Creación de Canales de Tickets Oficiales
      if (customId.startsWith('ticket_create_')) {
        const parts = customId.split('_'); // ticket_create_<tipo>_<catId>_<roleId>
        const ticketType = parts[2] || 'general';
        const categoryId = parts[3] !== 'none' ? parts[3] : null;
        const staffRoleId = parts[4] !== 'none' ? parts[4] : null;

        const cleanUsername = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
        const expectedChannelName = `ticket-${cleanUsername}`;

        // Evitar tickets duplicados del mismo usuario en el servidor
        const existingTicket = interaction.guild.channels.cache.find(
          c => c.name === expectedChannelName && c.type === ChannelType.GuildText
        );

        if (existingTicket) {
          return await interaction.reply({
            content: `⚠️ Ya tienes un ticket abierto actualmente en ${existingTicket}. Por favor utiliza ese canal para continuar tu consulta.`,
            ephemeral: true
          });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
          const typeLabels = {
            general: 'Soporte General',
            launcher: 'Nebula Launcher',
            report: 'Reporte de Incidencia'
          };
          const selectedLabel = typeLabels[ticketType] || 'Soporte';

          // Permisos del canal
          const permissionOverwrites = [
            {
              id: interaction.guild.roles.everyone.id,
              deny: ['ViewChannel']
            },
            {
              id: interaction.user.id,
              allow: ['ViewChannel', 'SendMessages', 'AttachFiles', 'EmbedLinks', 'ReadMessageHistory']
            },
            {
              id: interaction.client.user.id,
              allow: ['ViewChannel', 'SendMessages', 'ManageChannels', 'EmbedLinks', 'ReadMessageHistory']
            }
          ];

          if (staffRoleId) {
            permissionOverwrites.push({
              id: staffRoleId,
              allow: ['ViewChannel', 'SendMessages', 'AttachFiles', 'EmbedLinks', 'ReadMessageHistory']
            });
          }

          const ticketChannel = await interaction.guild.channels.create({
            name: expectedChannelName,
            type: ChannelType.GuildText,
            parent: categoryId || undefined,
            permissionOverwrites: permissionOverwrites,
            topic: `Ticket de ${interaction.user.tag} (${interaction.user.id}) | Categoría: ${selectedLabel}`
          });

          // Embed de bienvenida en el ticket
          const welcomeEmbed = createNebulaEmbed(interaction.client, {
            color: COLORS.PRIMARY,
            title: `🎫 Ticket de Asistencia | ${selectedLabel}`,
            thumbnail: interaction.user.displayAvatarURL({ dynamic: true }),
            description:
              `>>> **¡Hola <@${interaction.user.id}>!** Bienvenido a tu canal privado de atención.\n\n` +
              `Un moderador o miembro del equipo de **Nebula Dev Studios** te atenderá en breve.\n\n` +
              `${SYMBOLS.ARROW} **Categoría:** \`${selectedLabel}\`\n` +
              `${SYMBOLS.ARROW} **Usuario:** ${interaction.user.tag} (\`${interaction.user.id}\`)\n` +
              `${SYMBOLS.ARROW} **Fecha de apertura:** <t:${Math.floor(Date.now() / 1000)}:f>`,
            fields: [
              {
                name: '📌 Instrucciones para agilizar tu respuesta',
                value:
                  '• Describe detalladamente tu consulta o inconveniente.\n' +
                  '• Si reportas un fallo con **Nebula Launcher**, envía capturas o el registro de error.\n' +
                  '• Evita menciones innecesarias al Staff mientras revisamos tu caso.',
                inline: false
              }
            ],
            footerText: 'Nebula Ticket Management • Canal Privado'
          });

          const ticketActionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('ticket_btn_close')
              .setLabel('Cerrar Ticket')
              .setStyle(ButtonStyle.Danger)
              .setEmoji('🔒'),
            new ButtonBuilder()
              .setCustomId('ticket_btn_claim')
              .setLabel('Reclamar Ticket')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('📌'),
            new ButtonBuilder()
              .setCustomId('ticket_btn_transcript')
              .setLabel('Guardar Transcripción')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('💾')
          );

          await ticketChannel.send({
            content: staffRoleId ? `<@${interaction.user.id}> | <@&${staffRoleId}>` : `<@${interaction.user.id}>`,
            embeds: [welcomeEmbed],
            components: [ticketActionRow]
          });

          await interaction.editReply({
            content: `✅ ¡Tu ticket ha sido creado exitosamente! Accede aquí: ${ticketChannel}`
          });
        } catch (err) {
          console.error('Error al crear canal de ticket:', err);
          await interaction.editReply({
            content: '❌ Ocurrió un error al intentar crear el canal del ticket. Verifica que el bot posea el permiso `Gestionar Canales`.'
          });
        }
        return;
      }

      // 3.5 Botón Cerrar Ticket
      if (customId === 'ticket_btn_close') {
        const confirmRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('ticket_confirm_close')
            .setLabel('Confirmar Cierre')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('✅'),
          new ButtonBuilder()
            .setCustomId('ticket_cancel_close')
            .setLabel('Cancelar')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌')
        );

        await interaction.reply({
          content: '⚠️ **¿Estás seguro de que deseas cerrar y eliminar este ticket de soporte?**',
          components: [confirmRow]
        });
        return;
      }

      // 3.6 Confirmar Cierre
      if (customId === 'ticket_confirm_close') {
        await interaction.update({
          content: '🔒 **Ticket cerrado correctamente.** El canal será eliminado en 5 segundos...',
          components: []
        });

        setTimeout(async () => {
          try {
            await interaction.channel.delete();
          } catch (e) {
            console.error('Error al eliminar canal de ticket:', e);
          }
        }, 5000);
        return;
      }

      // 3.7 Cancelar Cierre
      if (customId === 'ticket_cancel_close') {
        await interaction.update({
          content: '↩️ **Cierre de ticket cancelado.** Puedes continuar la conversación.',
          components: []
        });
        return;
      }

      // 3.8 Reclamar Ticket
      if (customId === 'ticket_btn_claim') {
        const isStaff = interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) || interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels);
        if (!isStaff) {
          return await interaction.reply({
            content: '❌ Solo los miembros del Staff con permisos de soporte o moderación pueden reclamar tickets.',
            ephemeral: true
          });
        }

        const embed = createNebulaEmbed(interaction.client, {
          color: COLORS.SUCCESS,
          title: '📌 Ticket Reclamado',
          description: `> Este ticket ha sido tomado a cargo por <@${interaction.user.id}>.`
        });

        await interaction.reply({ embeds: [embed] });
        return;
      }

      // 3.9 Generar Transcripción de Ticket
      if (customId === 'ticket_btn_transcript') {
        await interaction.deferReply();
        try {
          const messages = await interaction.channel.messages.fetch({ limit: 100 });
          const transcriptLines = [];

          transcriptLines.push(`======================================================`);
          transcriptLines.push(`  TRANSCRIPCIÓN OFICIAL DE TICKET | NEBULA STUDIOS`);
          transcriptLines.push(`  Canal: #${interaction.channel.name}`);
          transcriptLines.push(`  Generado por: ${interaction.user.tag}`);
          transcriptLines.push(`  Fecha: ${new Date().toISOString()}`);
          transcriptLines.push(`======================================================\n`);

          const sorted = Array.from(messages.values()).reverse();
          for (const msg of sorted) {
            const time = msg.createdAt.toLocaleString('es-ES');
            transcriptLines.push(`[${time}] ${msg.author.tag}: ${msg.content || '(Embed / Archivo Adjunto)'}`);
          }

          const buffer = Buffer.from(transcriptLines.join('\n'), 'utf-8');
          const attachment = new AttachmentBuilder(buffer, { name: `${interaction.channel.name}-transcripcion.txt` });

          await interaction.editReply({
            content: '📄 **Aquí tienes la transcripción completa de la conversación:**',
            files: [attachment]
          });
        } catch (e) {
          console.error(e);
          await interaction.editReply({ content: '❌ No se pudo compilar la transcripción del ticket.' });
        }
        return;
      }

      // 3.10 Controles de Música (Play / Pause / Volume / Stop)
      if (customId === 'music_btn_toggle_pause') {
        const state = togglePause(interaction.guildId);
        if (!state) {
          return await interaction.reply({ content: '❌ No hay música activa.', ephemeral: true }).catch(() => {});
        }
        await interaction.reply({
          content: state === 'paused' ? '⏸️ Transmisión en pausa.' : '▶️ Transmisión reanudada.',
          ephemeral: true
        }).catch(() => {});
        return;
      }

      if (customId === 'music_btn_skip') {
        const skipped = skipTrack(interaction.guildId);
        if (!skipped) {
          return await interaction.reply({ content: '❌ No hay ninguna canción reproduciéndose.', ephemeral: true }).catch(() => {});
        }
        await interaction.reply({ content: '⏭️ Canción omitida.', ephemeral: true }).catch(() => {});
        return;
      }

      if (customId === 'music_btn_vol_up') {
        const session = getSession(interaction.guildId);
        if (!session) return await interaction.reply({ content: '❌ No hay música activa.', ephemeral: true }).catch(() => {});
        const newVol = setVolume(interaction.guildId, session.volume + 0.1);
        await interaction.reply({ content: `🔊 Volumen: \`${Math.round(newVol * 100)}%\``, ephemeral: true }).catch(() => {});
        return;
      }

      if (customId === 'music_btn_vol_down') {
        const session = getSession(interaction.guildId);
        if (!session) return await interaction.reply({ content: '❌ No hay música activa.', ephemeral: true }).catch(() => {});
        const newVol = setVolume(interaction.guildId, session.volume - 0.1);
        await interaction.reply({ content: `🔉 Volumen: \`${Math.round(newVol * 100)}%\``, ephemeral: true }).catch(() => {});
        return;
      }

      if (customId === 'music_btn_stop') {
        stopTrack(interaction.guildId);
        await interaction.reply({ content: '⏹️ Música detenida y canal de voz liberado.', ephemeral: true }).catch(() => {});
        return;
      }

      if (customId === 'music_btn_queue') {
        const session = getSession(interaction.guildId);
        if (!session || (!session.currentTrack && session.queue.length === 0)) {
          return await interaction.reply({ content: '📜 La cola de reproducción está vacía.', ephemeral: true });
        }
        const queueList = session.queue.slice(0, 5).map((t, i) => `\`${i + 1}.\` **${t.title}** \`[${t.duration}]\``).join('\n');
        return await interaction.reply({
          embeds: [
            createNebulaEmbed(interaction.client, {
              color: COLORS.PRIMARY,
              title: '📜 Cola de Reproducción Rápida',
              description:
                `🎶 **Sonando Ahora:** **${session.currentTrack ? session.currentTrack.title : 'Ninguna'}**\n\n` +
                `📑 **Canciones en Espera (${session.queue.length}):**\n` +
                (queueList || '*No hay más canciones en espera.*'),
              footerText: 'Nebula Music Quick Queue'
            })
          ],
          ephemeral: true
        });
      }

      // 3.11 Participar en Sorteo
      if (customId === 'btn_giveaway_join') {
        const giveaway = activeGiveaways?.get(interaction.message.id);
        if (!giveaway) {
          return await interaction.reply({
            content: '⚠️ Este sorteo ya ha concluido o no se encuentra activo.',
            ephemeral: true
          });
        }

        const userId = interaction.user.id;
        const alreadyJoined = giveaway.participants.has(userId);

        if (alreadyJoined) {
          giveaway.participants.delete(userId);
          const count = giveaway.participants.size;
          const updatedRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('btn_giveaway_join')
              .setLabel(`Participar (${count})`)
              .setEmoji('🎉')
              .setStyle(ButtonStyle.Success)
          );
          await interaction.update({ components: [updatedRow] });
          return await interaction.followUp({
            content: '👋 Has salido del sorteo.',
            ephemeral: true
          });
        } else {
          giveaway.participants.add(userId);
          const count = giveaway.participants.size;
          const updatedRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('btn_giveaway_join')
              .setLabel(`Participar (${count})`)
              .setEmoji('🎉')
              .setStyle(ButtonStyle.Success)
          );
          await interaction.update({ components: [updatedRow] });
          return await interaction.followUp({
            content: `🎉 ¡Estás participando en el sorteo de **${giveaway.prize}**! Mucha suerte.`,
            ephemeral: true
          });
        }
      }

      // 3.12 Votaciones de Sugerencias Comunitarias
      if (customId === 'btn_sugg_up' || customId === 'btn_sugg_down') {
        let sugg = activeSuggestions?.get(interaction.message.id);
        if (!sugg) {
          sugg = { upvotes: new Set(), downvotes: new Set() };
          activeSuggestions?.set(interaction.message.id, sugg);
        }

        const userId = interaction.user.id;
        const isUp = customId === 'btn_sugg_up';

        if (isUp) {
          sugg.downvotes.delete(userId);
          if (sugg.upvotes.has(userId)) {
            sugg.upvotes.delete(userId);
          } else {
            sugg.upvotes.add(userId);
          }
        } else {
          sugg.upvotes.delete(userId);
          if (sugg.downvotes.has(userId)) {
            sugg.downvotes.delete(userId);
          } else {
            sugg.downvotes.add(userId);
          }
        }

        const upCount = sugg.upvotes.size;
        const downCount = sugg.downvotes.size;

        const updatedRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_sugg_up')
            .setLabel(`Apoyar (${upCount})`)
            .setEmoji('👍')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('btn_sugg_down')
            .setLabel(`Rechazar (${downCount})`)
            .setEmoji('👎')
            .setStyle(ButtonStyle.Danger)
        );

        await interaction.update({ components: [updatedRow] });
        return;
      }

      // 3.13 Auto-Roles (Toggle 1 Clic)
      if (customId.startsWith('btn_autorole_')) {
        const roleId = customId.replace('btn_autorole_', '');
        const role = interaction.guild.roles.cache.get(roleId);

        if (!role) {
          return await interaction.reply({
            content: '❌ El rol configurado ya no existe en el servidor.',
            ephemeral: true
          });
        }

        const member = interaction.member;
        if (member.roles.cache.has(roleId)) {
          try {
            await member.roles.remove(roleId);
            return await interaction.reply({
              content: `➖ Se te ha retirado el rol **${role.name}**.`,
              ephemeral: true
            });
          } catch (e) {
            return await interaction.reply({
              content: '❌ No tengo permisos suficientes para retirar este rol.',
              ephemeral: true
            });
          }
        } else {
          try {
            await member.roles.add(roleId);
            return await interaction.reply({
              content: `➕ ¡Se te ha asignado el rol **${role.name}**!`,
              ephemeral: true
            });
          } catch (e) {
            return await interaction.reply({
              content: '❌ No tengo permisos suficientes para asignarte este rol.',
              ephemeral: true
            });
          }
        }
      }

      // 3.14 Verificación Anti-Bots de 1 Clic
      if (customId.startsWith('btn_verify_member_')) {
        const roleId = customId.replace('btn_verify_member_', '');
        const role = interaction.guild.roles.cache.get(roleId);

        if (!role) {
          return await interaction.reply({
            content: '❌ El rol de verificación no existe en el servidor.',
            ephemeral: true
          });
        }

        const member = interaction.member;
        if (member.roles.cache.has(roleId)) {
          return await interaction.reply({
            content: `🛡️ Ya te encuentras verificado con el rol **${role.name}**.`,
            ephemeral: true
          });
        }

        try {
          await member.roles.add(roleId);
          return await interaction.reply({
            content: `🎉 **¡Verificación Exitosa!** Ahora posees el rol **${role.name}** y acceso completo al servidor.`,
            ephemeral: true
          });
        } catch (e) {
          return await interaction.reply({
            content: '❌ Ocurrió un error al asignarte el rol. Contacta al Staff del servidor.',
            ephemeral: true
          });
        }
      }

      // 3.15 Botones de selección de música (gestionados por el collector de /play)
      if (customId.startsWith('music_search_')) {
        return;
      }

      // 3.16 Botón para Desactivar Auto-Voz
      if (customId === 'voice_btn_disable_autovoz') {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
          return await interaction.reply({
            content: '❌ No tienes permisos de `Gestionar Canales` para desactivar el sistema.',
            ephemeral: true
          });
        }

        setGuildConfig(interaction.guildId, { autoVoiceChannelId: null });

        const disabledEmbed = createNebulaEmbed(interaction.client, {
          color: COLORS.WARNING,
          title: '🔇 Sistema de Auto-Voz Desactivado',
          description:
            `>>> El sistema de salas de voz temporales (*Join to Create*) ha sido **desactivado** con éxito por ${interaction.user}.\n\n` +
            `${SYMBOLS.ARROW} Ya no se crearán canales temporales automáticos.\n` +
            `${SYMBOLS.ARROW} Puedes volver a activarlo en cualquier momento ejecutando \`/auto-voz canal:#canal\`.`,
          footerText: 'Nebula Auto-Voice Engine • Desactivado'
        });

        return await interaction.update({
          embeds: [disabledEmbed],
          components: []
        });
      }

      // 3.17 Botones Táctiles de Control de Salas de Voz
      if (customId.startsWith('voice_ctrl_')) {
        const voiceChannel = interaction.member.voice?.channel;
        if (!voiceChannel) {
          return await interaction.reply({
            content: '❌ Debes estar conectado en tu sala de voz para usar estos controles.',
            ephemeral: true
          });
        }

        const ownerId = getTempVoice(voiceChannel.id);
        const isOwner = ownerId === interaction.user.id;
        const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels);

        // A. Desconectarse (cualquier miembro puede pulsar esto)
        if (customId === 'voice_ctrl_disconnect') {
          await interaction.member.voice.disconnect().catch(() => {});
          return await interaction.reply({
            content: '🚪 Te has desconectado de la sala.',
            ephemeral: true
          });
        }

        // B. Reclamar Sala (si el dueño no está en el canal)
        if (customId === 'voice_ctrl_claim') {
          if (isOwner) {
            return await interaction.reply({
              content: '👑 Ya eres el dueño de esta sala.',
              ephemeral: true
            });
          }

          const ownerPresent = ownerId && voiceChannel.members.has(ownerId);
          if (ownerPresent) {
            return await interaction.reply({
              content: '❌ No puedes reclamar esta sala porque el dueño actual sigue conectado aquí.',
              ephemeral: true
            });
          }

          setTempVoice(voiceChannel.id, interaction.user.id);
          return await interaction.reply({
            content: '👑 **¡Propiedad Reclamada!** Ahora eres el nuevo dueño oficial de esta sala de voz.',
            ephemeral: true
          });
        }

        // Las demás acciones requieren ser dueño o admin
        if (!isOwner && !isAdmin) {
          return await interaction.reply({
            content: '❌ Solo el dueño de la sala o un administrador puede modificar su configuración.',
            ephemeral: true
          });
        }

        // C. Bloquear / Desbloquear
        if (customId === 'voice_ctrl_lock') {
          const currentConnect = voiceChannel.permissionsFor(interaction.guild.roles.everyone).has(PermissionFlagsBits.Connect);
          const shouldLock = currentConnect;

          await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            Connect: shouldLock ? false : null
          });

          return await interaction.reply({
            content: shouldLock ? '🔒 **Sala Bloqueada:** Nadie más puede unirse.' : '🔓 **Sala Desbloqueada:** Ahora cualquiera puede unirse.',
            ephemeral: true
          });
        }

        // D. Ocultar / Mostrar
        if (customId === 'voice_ctrl_hide') {
          const currentView = voiceChannel.permissionsFor(interaction.guild.roles.everyone).has(PermissionFlagsBits.ViewChannel);
          const shouldHide = currentView;

          await voiceChannel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            ViewChannel: shouldHide ? false : null
          });
          await voiceChannel.permissionOverwrites.edit(interaction.user.id, {
            ViewChannel: true,
            Connect: true
          });

          return await interaction.reply({
            content: shouldHide ? '👁️‍🗨️ **Sala Oculta:** Es invisible para los demás en la lista.' : '👁️ **Sala Visible:** Vuelve a ser visible para todos.',
            ephemeral: true
          });
        }

        // E. Modal para Fijar Límite
        if (customId === 'voice_ctrl_limit') {
          const modal = new ModalBuilder()
            .setCustomId('voice_modal_limit')
            .setTitle('Aforo / Límite de la Sala');

          const limitInput = new TextInputBuilder()
            .setCustomId('limit_val')
            .setLabel('Número de miembros (0 a 99, 0 = sin límite)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ejemplo: 4')
            .setValue(voiceChannel.userLimit ? String(voiceChannel.userLimit) : '0')
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder().addComponents(limitInput));
          return await interaction.showModal(modal);
        }

        // F. Modal para Renombrar Sala
        if (customId === 'voice_ctrl_rename') {
          const modal = new ModalBuilder()
            .setCustomId('voice_modal_rename')
            .setTitle('Renombrar Sala de Voz');

          const nameInput = new TextInputBuilder()
            .setCustomId('name_val')
            .setLabel('Nuevo nombre de tu canal')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ejemplo: 🎮 Sala de Juegos')
            .setValue(voiceChannel.name)
            .setMaxLength(32)
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
          return await interaction.showModal(modal);
        }
      }

      // 3.18 Interfaz de Perfil, Rank, Top y Daily
      if (customId.startsWith('btn_view_rank_')) {
        const userId = customId.replace('btn_view_rank_', '');
        const targetUser = await interaction.client.users.fetch(userId).catch(() => interaction.user);
        const payload = buildRankPayload(interaction.client, interaction.guild, targetUser);
        return await interaction.reply({ ...payload, ephemeral: true });
      }

      if (customId === 'btn_view_my_rank') {
        const payload = buildRankPayload(interaction.client, interaction.guild, interaction.user);
        return await interaction.reply({ ...payload, ephemeral: true });
      }

      if (customId.startsWith('btn_rank_refresh_')) {
        const userId = customId.replace('btn_rank_refresh_', '');
        const targetUser = await interaction.client.users.fetch(userId).catch(() => interaction.user);
        const payload = buildRankPayload(interaction.client, interaction.guild, targetUser);
        return await interaction.update(payload);
      }

      if (customId.startsWith('btn_view_perfil_')) {
        const userId = customId.replace('btn_view_perfil_', '');
        const targetUser = await interaction.client.users.fetch(userId).catch(() => interaction.user);
        const payload = await buildProfilePayload(interaction.client, interaction.guild, targetUser, interaction.user.id);
        return await interaction.reply({ ...payload, ephemeral: true });
      }

      if (customId === 'btn_view_my_perfil') {
        const payload = await buildProfilePayload(interaction.client, interaction.guild, interaction.user, interaction.user.id);
        return await interaction.reply({ ...payload, ephemeral: true });
      }

      if (customId.startsWith('btn_perfil_refresh_')) {
        const userId = customId.replace('btn_perfil_refresh_', '');
        const targetUser = await interaction.client.users.fetch(userId).catch(() => interaction.user);
        const payload = await buildProfilePayload(interaction.client, interaction.guild, targetUser, interaction.user.id);
        return await interaction.update(payload);
      }

      if (customId === 'btn_view_top') {
        const payload = buildTopPayload(interaction.client, interaction.guild, interaction.user.id);
        return await interaction.reply({ ...payload, ephemeral: true });
      }

      if (customId === 'btn_top_refresh') {
        const payload = buildTopPayload(interaction.client, interaction.guild, interaction.user.id);
        return await interaction.update(payload);
      }

      if (customId === 'btn_edit_bio') {
        const userData = getUserData(interaction.guildId, interaction.user.id);
        const modal = new ModalBuilder()
          .setCustomId('modal_edit_bio')
          .setTitle('Editar Biografía Cósmica');

        const bioInput = new TextInputBuilder()
          .setCustomId('bio_val')
          .setLabel('Tu biografía (máximo 100 caracteres)')
          .setStyle(TextInputStyle.Paragraph)
          .setValue(userData.bio || 'Viajero del cosmos de Nebula')
          .setMaxLength(100)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(bioInput));
        return await interaction.showModal(modal);
      }

      if (customId === 'btn_claim_daily') {
        const result = claimDaily(interaction.guildId, interaction.user.id);
        if (!result.success) {
          const availableAt = Math.floor((Date.now() + result.remainingMs) / 1000);
          return await interaction.reply({
            content: `⏳ Ya reclamaste tus coins hoy. Vuelve <t:${availableAt}:R>.`,
            ephemeral: true
          });
        }
        return await interaction.reply({
          content: `🪙 ¡Reclamaste **+${result.reward} Nebula Coins**! Racha: **${result.streak} días** 🔥. Saldo: **${result.totalCoins} 🪙**.`,
          ephemeral: true
        });
      }

      // 3.19 Interfaz de Casino & Minijuegos
      if (customId.startsWith('btn_slots_repeat_')) {
        const bet = parseInt(customId.replace('btn_slots_repeat_', ''), 10) || 10;
        const result = runSlotsGame(interaction.client, interaction.guildId, interaction.user, bet);
        if (result.error) {
          return await interaction.reply({ content: result.error, ephemeral: true });
        }
        return await interaction.update(result);
      }

      if (customId.startsWith('btn_ruleta_repeat_')) {
        const parts = customId.replace('btn_ruleta_repeat_', '').split('_');
        const bet = parseInt(parts[0], 10) || 10;
        const color = parts[1] || 'rojo';
        const result = runRuletaGame(interaction.client, interaction.guildId, interaction.user, bet, color);
        if (result.error) {
          return await interaction.reply({ content: result.error, ephemeral: true });
        }
        return await interaction.update(result);
      }

      if (customId.startsWith('btn_dado_')) {
        const caras = parseInt(customId.replace('btn_dado_', ''), 10) || 6;
        const result = rollDice(interaction.client, interaction.user, caras);
        return await interaction.update(result);
      }

      if (customId === 'btn_moneda_again') {
        const result = flipCoin(interaction.client, interaction.user);
        return await interaction.update(result);
      }

      if (customId === 'btn_8ball_ask') {
        const modal = new ModalBuilder()
          .setCustomId('modal_8ball_ask')
          .setTitle('Consultar al Oráculo');

        const qInput = new TextInputBuilder()
          .setCustomId('8ball_q')
          .setLabel('¿Qué misterio deseas consultar?')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ej: ¿Será hoy un buen día?')
          .setMaxLength(120)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(qInput));
        return await interaction.showModal(modal);
      }

      // 3.20 Interfaz de Minecraft Tools
      if (customId.startsWith('btn_crafteo_page_')) {
        const parts = customId.replace('btn_crafteo_page_', '').split('_');
        const catId = parts[0];
        const page = parseInt(parts[1], 10) || 0;
        const recipeKey = parts.slice(2).join('_') || 'piston';
        const payload = buildCrafteoPayload(interaction.client, recipeKey, catId, page);
        return await interaction.update(payload);
      }

      if (customId.startsWith('btn_nether_flip_')) {
        const parts = customId.replace('btn_nether_flip_', '').split('_');
        const x = parseFloat(parts[0]);
        const z = parseFloat(parts[1]);
        const dir = parts.slice(2).join('_');
        const payload = buildNetherPayload(interaction.client, x, z, dir);
        return await interaction.update(payload);
      }

      if (customId.startsWith('btn_mc_xp_quick_')) {
        const parts = customId.replace('btn_mc_xp_quick_', '').split('_');
        const cur = parseInt(parts[0], 10);
        const tgt = parseInt(parts[1], 10);
        const payload = buildMcXpPayload(interaction.client, cur, tgt);
        return await interaction.update(payload);
      }

      // 3.21 Diagnóstico & Audio
      if (customId === 'btn_ping_refresh') {
        const start = Date.now();
        await interaction.deferUpdate();
        const latency = Date.now() - start;
        const payload = buildPingPayload(interaction.client, latency);
        return await interaction.editReply(payload);
      }

      if (customId === 'btn_ping_uptime') {
        const totalSeconds = Math.floor(process.uptime());
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const ramUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);

        const uptimeEmbed = createNebulaEmbed(interaction.client, {
          color: COLORS.PRIMARY,
          title: '📊 Rendimiento y Uptime de Nebula Bot',
          description:
            `>>> **Estado operativo en vivo.**\n\n` +
            `${SYMBOLS.ARROW} **Tiempo Activo:** \`${days}d ${hours}h ${minutes}m ${seconds}s\`\n` +
            `${SYMBOLS.ARROW} **Consumo de Memoria RAM:** \`${ramUsed} MB\`\n` +
            `${SYMBOLS.ARROW} **Servidores Conectados:** \`${interaction.client.guilds.cache.size}\`\n` +
            `${SYMBOLS.ARROW} **Versión de Node:** \`${process.version}\``
        });
        return await interaction.reply({ embeds: [uptimeEmbed], ephemeral: true });
      }

      if (customId === 'btn_queue_refresh') {
        const payload = buildQueuePayload(interaction.client, interaction.guildId);
        return await interaction.update(payload);
      }

      // 3.22 Moderación & Administración
      if (customId.startsWith('btn_view_warns_')) {
        const userId = customId.replace('btn_view_warns_', '');
        const targetUser = await interaction.client.users.fetch(userId).catch(() => interaction.user);
        const isMod = interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers);
        const payload = buildWarnsPayload(interaction.client, interaction.guild, targetUser, isMod);
        return await interaction.reply({ ...payload, ephemeral: true });
      }

      if (customId.startsWith('btn_unwarn_last_')) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
          return await interaction.reply({ content: '❌ Solo moderadores pueden perdonar advertencias.', ephemeral: true });
        }
        const userId = customId.replace('btn_unwarn_last_', '');
        const targetUser = await interaction.client.users.fetch(userId).catch(() => interaction.user);
        const guildWarns = getGuildWarns(interaction.guildId);
        const userWarns = guildWarns[userId] || [];
        if (userWarns.length > 0) {
          const lastWarn = userWarns[userWarns.length - 1];
          removeWarn(interaction.guildId, userId, lastWarn.id);
        }
        const payload = buildWarnsPayload(interaction.client, interaction.guild, targetUser, true);
        return await interaction.update(payload);
      }

      if (customId.startsWith('btn_warn_add_')) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
          return await interaction.reply({ content: '❌ Solo moderadores pueden advertir miembros.', ephemeral: true });
        }
        const userId = customId.replace('btn_warn_add_', '');
        const modal = new ModalBuilder()
          .setCustomId(`modal_warn_add_${userId}`)
          .setTitle('Advertir Usuario');

        const reasonInput = new TextInputBuilder()
          .setCustomId('warn_reason')
          .setLabel('Motivo de la advertencia')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Ej: Spam repetitivo en el chat')
          .setMaxLength(200)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
        return await interaction.showModal(modal);
      }

      if (customId === 'btn_disable_logs') {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ViewAuditLog)) {
          return await interaction.reply({ content: '❌ No tienes permisos de auditoría.', ephemeral: true });
        }
        setGuildConfig(interaction.guildId, { logChannelId: null });
        return await interaction.update({
          content: '📴 **El canal de registros de auditoría ha sido desactivado.**',
          embeds: [],
          components: []
        });
      }

      if (customId === 'btn_welcome_disable') {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
          return await interaction.reply({ content: '❌ No tienes permisos de Gestión del Servidor.', ephemeral: true });
        }
        setGuildConfig(interaction.guildId, { welcomeChannelId: null });
        return await interaction.update({
          content: '📴 **El sistema de bienvenidas ha sido desactivado.**',
          embeds: [],
          components: []
        });
      }

      if (customId === 'btn_welcome_test') {
        const embed = createNebulaEmbed(interaction.client, {
          color: COLORS.PRIMARY,
          title: '🌌 ¡Bienvenido al Cosmos de Nebula!',
          thumbnail: interaction.user.displayAvatarURL({ dynamic: true }),
          description:
            `¡Saludos, ${interaction.user}! Bienvenido/a a **${interaction.guild.name}**.\n\n` +
            `${SYMBOLS.ARROW} Eres el miembro **#${interaction.guild.memberCount}** de nuestra tripulación.\n` +
            `${SYMBOLS.ARROW} Explora las salas de voz temporales, consulta \`/ayuda\` y disfruta de tu estadía cósmica.`,
          footerText: 'Nebula Welcome Simulation'
        });
        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }

    // --------------------------------------------------------
    // 4. Selector de Canales (Publicar Embed Studio V2)
    // --------------------------------------------------------
    if (interaction.isChannelSelectMenu()) {
      if (interaction.customId === 'embed_select_channel') {
        const targetChannel = interaction.channels.first();
        if (!targetChannel) {
          return await interaction.reply({ content: '❌ Canal inválido o no encontrado.', ephemeral: true });
        }

        const draft = getDraft(interaction.user.id, interaction.guildId, interaction.guild);
        const finalEmbed = buildEmbedFromDraft(draft);
        const buttonsRow = buildCustomButtonsRow(draft);

        const payload = { embeds: [finalEmbed] };
        if (draft.content && draft.content.trim() !== '') {
          payload.content = draft.content;
        }
        if (buttonsRow) {
          payload.components = [buttonsRow];
        }

        try {
          await targetChannel.send(payload);
          return await interaction.update(
            buildStudioPayload(draft, `🚀 ¡Embed publicado exitosamente en ${targetChannel}!`)
          );
        } catch (err) {
          console.error('Error publicando embed en canal:', err);
          return await interaction.update(
            buildStudioPayload(draft, `❌ Error al publicar en ${targetChannel}: Verifica los permisos del bot.`)
          );
        }
      }
      return;
    }

    // --------------------------------------------------------
    // 5. Envíos de Modales (ModalSubmit - Embed Studio V2)
    // --------------------------------------------------------
    if (interaction.isModalSubmit()) {
      const customId = interaction.customId;

      if (customId.startsWith('embed_modal_')) {
        const draft = getDraft(interaction.user.id, interaction.guildId, interaction.guild);

        if (customId === 'embed_modal_text') {
          draft.title = interaction.fields.getTextInputValue('title') || '';
          draft.titleUrl = interaction.fields.getTextInputValue('title_url') || '';
          draft.description = interaction.fields.getTextInputValue('description') || '';
          return await interaction.update(buildStudioPayload(draft, '✅ Título y descripción actualizados.'));
        }

        if (customId === 'embed_modal_color') {
          let hex = interaction.fields.getTextInputValue('color').trim();
          if (!hex.startsWith('#')) hex = '#' + hex;
          draft.color = hex;
          return await interaction.update(buildStudioPayload(draft, `🎨 Color actualizado a \`${hex}\`.`));
        }

        if (customId === 'embed_modal_author') {
          draft.author = {
            name: interaction.fields.getTextInputValue('author_name') || '',
            iconURL: interaction.fields.getTextInputValue('author_icon') || '',
            url: interaction.fields.getTextInputValue('author_url') || ''
          };
          return await interaction.update(buildStudioPayload(draft, '👤 Información del autor actualizada.'));
        }

        if (customId === 'embed_modal_images') {
          draft.thumbnail = interaction.fields.getTextInputValue('thumbnail') || '';
          draft.image = interaction.fields.getTextInputValue('image') || '';
          return await interaction.update(buildStudioPayload(draft, '🖼️ URLs de imágenes actualizadas.'));
        }

        if (customId === 'embed_modal_field') {
          const name = interaction.fields.getTextInputValue('field_name');
          const value = interaction.fields.getTextInputValue('field_value');
          const inlineRaw = interaction.fields.getTextInputValue('field_inline') || 'no';
          const isInline = ['si', 'yes', 'true', '1'].includes(inlineRaw.toLowerCase().trim());

          if (!Array.isArray(draft.fields)) draft.fields = [];
          draft.fields.push({ name, value, inline: isInline });
          return await interaction.update(buildStudioPayload(draft, `➕ Campo agregado (#${draft.fields.length}).`));
        }

        if (customId === 'embed_modal_footer') {
          const text = interaction.fields.getTextInputValue('footer_text') || '';
          const icon = interaction.fields.getTextInputValue('footer_icon') || '';
          const timeRaw = interaction.fields.getTextInputValue('show_timestamp') || 'si';
          draft.footer = { text, iconURL: icon };
          draft.timestamp = ['si', 'yes', 'true', '1'].includes(timeRaw.toLowerCase().trim());
          return await interaction.update(buildStudioPayload(draft, '📄 Pie de página y fecha actualizados.'));
        }

        if (customId === 'embed_modal_buttons') {
          const b1Label = interaction.fields.getTextInputValue('btn1_label');
          const b1Url = interaction.fields.getTextInputValue('btn1_url');
          const b2Label = interaction.fields.getTextInputValue('btn2_label');
          const b2Url = interaction.fields.getTextInputValue('btn2_url');

          const newButtons = [];
          if (b1Label && b1Url && b1Url.startsWith('http')) {
            newButtons.push({ label: b1Label, url: b1Url, emoji: '🔗' });
          }
          if (b2Label && b2Url && b2Url.startsWith('http')) {
            newButtons.push({ label: b2Label, url: b2Url, emoji: '🔗' });
          }
          draft.buttons = newButtons;
          return await interaction.update(buildStudioPayload(draft, `🔘 Botones V2 actualizados (${newButtons.length} configurados).`));
        }

        if (customId === 'embed_modal_msg') {
          draft.content = interaction.fields.getTextInputValue('content') || '';
          return await interaction.update(buildStudioPayload(draft, '💬 Mensaje exterior actualizado.'));
        }

        if (customId === 'embed_modal_json') {
          const raw = interaction.fields.getTextInputValue('json_data');
          try {
            const parsed = JSON.parse(raw);
            if (parsed.content) draft.content = parsed.content;
            const emb = Array.isArray(parsed.embeds) ? parsed.embeds[0] : parsed;
            if (emb) {
              if (emb.title) draft.title = emb.title;
              if (emb.url) draft.titleUrl = emb.url;
              if (emb.description) draft.description = emb.description;
              if (emb.color) {
                draft.color = typeof emb.color === 'number' ? '#' + emb.color.toString(16).padStart(6, '0') : emb.color;
              }
              if (emb.author) draft.author = emb.author;
              if (emb.thumbnail) draft.thumbnail = emb.thumbnail.url || emb.thumbnail;
              if (emb.image) draft.image = emb.image.url || emb.image;
              if (emb.footer) draft.footer = emb.footer;
              if (Array.isArray(emb.fields)) draft.fields = emb.fields;
            }
            if (Array.isArray(parsed.buttons)) draft.buttons = parsed.buttons;
            return await interaction.update(buildStudioPayload(draft, '📋 ¡JSON importado con éxito!'));
          } catch (err) {
            return await interaction.update(buildStudioPayload(draft, '❌ Error al importar JSON: Formato inválido.'));
          }
        }
      }

      // 5.2 Modales de Control de Salas de Voz
      if (customId === 'voice_modal_limit') {
        const voiceChannel = interaction.member.voice?.channel;
        if (!voiceChannel) {
          return await interaction.reply({
            content: '❌ Debes estar conectado a la sala para modificar su capacidad.',
            ephemeral: true
          });
        }

        const raw = interaction.fields.getTextInputValue('limit_val').trim();
        const limit = parseInt(raw, 10);
        if (isNaN(limit) || limit < 0 || limit > 99) {
          return await interaction.reply({
            content: '❌ Por favor ingresa un número válido entre 0 y 99 (0 para ilimitado).',
            ephemeral: true
          });
        }

        await voiceChannel.setUserLimit(limit);
        return await interaction.reply({
          content: limit === 0 ? '👥 **Capacidad:** Ahora la sala es ilimitada.' : `👥 **Capacidad:** Aforo fijado a **${limit} miembros**.`,
          ephemeral: true
        });
      }

      if (customId === 'voice_modal_rename') {
        const voiceChannel = interaction.member.voice?.channel;
        if (!voiceChannel) {
          return await interaction.reply({
            content: '❌ Debes estar conectado a la sala para renombrarla.',
            ephemeral: true
          });
        }

        const newName = interaction.fields.getTextInputValue('name_val').trim();
        if (!newName) {
          return await interaction.reply({
            content: '❌ El nombre no puede estar vacío.',
            ephemeral: true
          });
        }

        await voiceChannel.setName(newName.slice(0, 32));
        return await interaction.reply({
          content: `🏷️ **Sala Renombrada:** Ahora se llama **${newName.slice(0, 32)}**.`,
          ephemeral: true
        });
      }

      // 5.3 Modales de Biografía, 8Ball y Advertencias
      if (customId === 'modal_edit_bio') {
        const newBio = interaction.fields.getTextInputValue('bio_val');
        setUserBio(interaction.guildId, interaction.user.id, newBio);
        const payload = await buildProfilePayload(interaction.client, interaction.guild, interaction.user, interaction.user.id);
        return await interaction.reply({
          content: '✅ **¡Biografía cósmica actualizada con éxito!**',
          embeds: payload.embeds,
          components: payload.components,
          ephemeral: true
        });
      }

      if (customId === 'modal_8ball_ask') {
        const question = interaction.fields.getTextInputValue('8ball_q');
        const payload = answer8Ball(interaction.client, interaction.user, question);
        return await interaction.reply(payload);
      }

      if (customId.startsWith('modal_warn_add_')) {
        const targetUserId = customId.replace('modal_warn_add_', '');
        const targetUser = await interaction.client.users.fetch(targetUserId).catch(() => null);
        const reason = interaction.fields.getTextInputValue('warn_reason').trim();

        addWarn(interaction.guildId, targetUserId, interaction.user.id, reason);

        return await interaction.reply({
          content: `⚠️ Se ha registrado una advertencia para **${targetUser?.username || targetUserId}** por el motivo: *${reason}*.`,
          ephemeral: true
        });
      }
      return;
    }
  }
};
