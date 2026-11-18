// ============================================================
// Comando /uuid - Identificador Oficial de Mojang
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { COLORS, SYMBOLS, createNebulaEmbed } = require('../utils/theme');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('uuid')
    .setDescription('Obtén el UUID oficial de Mojang de cualquier cuenta de Minecraft')
    .addStringOption(option =>
      option.setName('usuario').setDescription('Nombre de usuario de Minecraft').setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString('usuario').trim();
    await interaction.deferReply();

    try {
      const res = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`);
      if (res.status === 204 || res.status === 404) {
        return await interaction.editReply({
          embeds: [
            createNebulaEmbed(interaction.client, {
              color: COLORS.ERROR,
              title: '❌ Jugador No Encontrado',
              description: `> No se localizó ninguna cuenta oficial de Minecraft con el nombre **\`${username}\`**.\nVerifica que esté bien escrito o que sea una cuenta premium activa.`
            })
          ]
        });
      }

      const data = await res.json();
      const rawUuid = data.id;
      const formattedUuid = `${rawUuid.substr(0, 8)}-${rawUuid.substr(8, 4)}-${rawUuid.substr(12, 4)}-${rawUuid.substr(16, 4)}-${rawUuid.substr(20)}`;
      const avatarUrl = `https://mc-heads.net/avatar/${encodeURIComponent(data.name)}/128`;
      const nameMcUrl = `https://namemc.com/profile/${rawUuid}`;

      const embed = createNebulaEmbed(interaction.client, {
        color: COLORS.SUCCESS,
        title: `🆔 Perfil Oficial de Mojang | ${data.name}`,
        thumbnail: avatarUrl,
        description:
          `>>> **Identificador Único Universal (UUID)** verificado por los servidores centrales de autenticación de Mojang.`,
        fields: [
          {
            name: '🎮 Nombre Oficial Registrado',
            value: `\`${data.name}\``,
            inline: true
          },
          {
            name: '🔑 Estado de Cuenta',
            value: '`Premium / Activa`',
            inline: true
          },
          {
            name: '📋 UUID con Guiones (Estándar para configs y bases de datos)',
            value: `\`\`\`${formattedUuid}\`\`\``,
            inline: false
          },
          {
            name: '📋 UUID sin Guiones (Formato API y Skins)',
            value: `\`\`\`${rawUuid}\`\`\``,
            inline: false
          }
        ],
        footerText: `Mojang Auth API • Perfil: ${data.name}`
      });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Historial en NameMC')
          .setStyle(ButtonStyle.Link)
          .setEmoji('🎮')
          .setURL(nameMcUrl)
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      console.error(err);
      await interaction.editReply({
        embeds: [
          createNebulaEmbed(interaction.client, {
            color: COLORS.ERROR,
            title: '❌ Error de Conexión',
            description: '> No se pudo contactar el servicio de perfiles de Mojang en este momento.'
          })
        ]
      });
    }
  }
};
