// ============================================================
// Nebula Bot - Almacenamiento Local Seguro (Database Manager)
// Nebula Dev Studios • nebuladevstudios.com
// ============================================================

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getFilePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function loadJson(name, defaultValue = {}) {
  try {
    const file = getFilePath(name);
    if (!fs.existsSync(file)) return defaultValue;
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[DB Error] Error cargando ${name}.json:`, err.message);
    return defaultValue;
  }
}

function saveJson(name, data) {
  try {
    const file = getFilePath(name);
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[DB Error] Error guardando ${name}.json:`, err.message);
  }
}

// -------------------------------------------------------------
// 1. SISTEMA DE SNIPE (Mensajes Borrados Recientemente)
// -------------------------------------------------------------
const snipes = new Map(); // channelId -> { author, content, image, timestamp }

function setSnipe(channelId, snipeData) {
  snipes.set(channelId, snipeData);
}

function getSnipe(channelId) {
  return snipes.get(channelId);
}

// -------------------------------------------------------------
// 2. SISTEMA DE WARNS (Moderación)
// -------------------------------------------------------------
function getGuildWarns(guildId) {
  const allWarns = loadJson('warns', {});
  return allWarns[guildId] || {};
}

function addWarn(guildId, userId, moderatorId, reason) {
  const allWarns = loadJson('warns', {});
  if (!allWarns[guildId]) allWarns[guildId] = {};
  if (!allWarns[guildId][userId]) allWarns[guildId][userId] = [];

  const warnId = Date.now().toString(36).toUpperCase();
  const warnItem = {
    id: warnId,
    moderatorId,
    reason: reason || 'Sin motivo especificado',
    timestamp: Date.now()
  };

  allWarns[guildId][userId].push(warnItem);
  saveJson('warns', allWarns);
  return warnItem;
}

function removeWarn(guildId, userId, warnId = null) {
  const allWarns = loadJson('warns', {});
  if (!allWarns[guildId] || !allWarns[guildId][userId]) return false;

  if (!warnId || warnId.toLowerCase() === 'todas' || warnId.toLowerCase() === 'all') {
    const count = allWarns[guildId][userId].length;
    delete allWarns[guildId][userId];
    saveJson('warns', allWarns);
    return count;
  }

  const initialLen = allWarns[guildId][userId].length;
  allWarns[guildId][userId] = allWarns[guildId][userId].filter(w => w.id !== warnId);
  saveJson('warns', allWarns);
  return initialLen !== allWarns[guildId][userId].length;
}

// -------------------------------------------------------------
// 3. SISTEMA DE XP, NIVELES Y ECONOMÍA CÓSMICA
// -------------------------------------------------------------
function getUserData(guildId, userId) {
  const allUsers = loadJson('levels', {});
  if (!allUsers[guildId]) allUsers[guildId] = {};
  if (!allUsers[guildId][userId]) {
    allUsers[guildId][userId] = {
      xp: 0,
      level: 1,
      coins: 50,
      lastDaily: 0,
      dailyStreak: 0,
      bio: 'Viajero del cosmos de Nebula'
    };
  }
  return allUsers[guildId][userId];
}

function setUserBio(guildId, userId, newBio) {
  const allUsers = loadJson('levels', {});
  if (!allUsers[guildId]) allUsers[guildId] = {};
  if (!allUsers[guildId][userId]) {
    getUserData(guildId, userId);
  }
  allUsers[guildId][userId].bio = (newBio || 'Viajero del cosmos de Nebula').trim().slice(0, 100);
  saveJson('levels', allUsers);
  return allUsers[guildId][userId];
}

function addMessageXp(guildId, userId, xpGained = 15) {
  const allUsers = loadJson('levels', {});
  if (!allUsers[guildId]) allUsers[guildId] = {};
  if (!allUsers[guildId][userId]) {
    allUsers[guildId][userId] = {
      xp: 0,
      level: 1,
      coins: 50,
      lastDaily: 0,
      dailyStreak: 0,
      bio: 'Viajero del cosmos de Nebula'
    };
  }

  const user = allUsers[guildId][userId];
  user.xp += xpGained;
  user.coins = (user.coins || 0) + 1;

  // Fórmula de nivel: nivel = Math.floor(0.1 * Math.sqrt(xp)) + 1
  const requiredXp = user.level * user.level * 100;
  let leveledUp = false;
  if (user.xp >= requiredXp) {
    user.level += 1;
    user.coins += user.level * 25; // Recompensa por subir de nivel
    leveledUp = true;
  }

  saveJson('levels', allUsers);
  return { user, leveledUp };
}

function claimDaily(guildId, userId) {
  const allUsers = loadJson('levels', {});
  if (!allUsers[guildId]) allUsers[guildId] = {};
  if (!allUsers[guildId][userId]) {
    allUsers[guildId][userId] = {
      xp: 0,
      level: 1,
      coins: 50,
      lastDaily: 0,
      dailyStreak: 0,
      bio: 'Viajero del cosmos de Nebula'
    };
  }

  const user = allUsers[guildId][userId];
  const now = Date.now();
  const cooldown = 24 * 60 * 60 * 1000;
  const timePassed = now - (user.lastDaily || 0);

  if (timePassed < cooldown) {
    const remainingMs = cooldown - timePassed;
    return { success: false, remainingMs };
  }

  // Si pasaron menos de 48 horas mantiene la racha, sino reinicia a 1
  if (timePassed < 48 * 60 * 60 * 1000) {
    user.dailyStreak = (user.dailyStreak || 0) + 1;
  } else {
    user.dailyStreak = 1;
  }

  const bonus = Math.min(user.dailyStreak * 10, 200);
  const reward = 100 + bonus;
  user.coins = (user.coins || 0) + reward;
  user.xp = (user.xp || 0) + 50;
  user.lastDaily = now;

  saveJson('levels', allUsers);
  return { success: true, reward, streak: user.dailyStreak, totalCoins: user.coins };
}

function getTopUsers(guildId, limit = 10) {
  const allUsers = loadJson('levels', {});
  const guildUsers = allUsers[guildId] || {};
  const sorted = Object.entries(guildUsers)
    .map(([userId, data]) => ({ userId, ...data }))
    .sort((a, b) => b.xp - a.xp)
    .slice(0, limit);
  return sorted;
}

// -------------------------------------------------------------
// 4. CONFIGURACIÓN DEL SERVIDOR (Verificación, etc.)
// -------------------------------------------------------------
function getGuildConfig(guildId) {
  const allConfigs = loadJson('guild_configs', {});
  return allConfigs[guildId] || {};
}

function setGuildConfig(guildId, newSettings) {
  const allConfigs = loadJson('guild_configs', {});
  allConfigs[guildId] = { ...(allConfigs[guildId] || {}), ...newSettings };
  saveJson('guild_configs', allConfigs);
  return allConfigs[guildId];
}

// -------------------------------------------------------------
// 5. VINCULACIÓN DE MINECRAFT
// -------------------------------------------------------------
function getLinkedMinecraft(userId) {
  const allLinks = loadJson('minecraft_links', {});
  return allLinks[userId] || null;
}

function setLinkedMinecraft(userId, mcUser) {
  const allLinks = loadJson('minecraft_links', {});
  allLinks[userId] = mcUser;
  saveJson('minecraft_links', allLinks);
  return mcUser;
}

function modifyCoins(guildId, userId, amount) {
  const allUsers = loadJson('levels', {});
  if (!allUsers[guildId]) allUsers[guildId] = {};
  if (!allUsers[guildId][userId]) {
    allUsers[guildId][userId] = {
      xp: 0,
      level: 1,
      coins: 50,
      lastDaily: 0,
      dailyStreak: 0,
      bio: 'Viajero del cosmos de Nebula'
    };
  }
  const user = allUsers[guildId][userId];
  user.coins = Math.max(0, (user.coins || 0) + amount);
  saveJson('levels', allUsers);
  return user.coins;
}

function transferCoins(guildId, fromUserId, toUserId, amount) {
  const allUsers = loadJson('levels', {});
  if (!allUsers[guildId]) allUsers[guildId] = {};
  
  const sender = allUsers[guildId][fromUserId] || { coins: 50, level: 1, xp: 0 };
  if ((sender.coins || 0) < amount) {
    return { success: false, reason: 'insufficient_funds', balance: sender.coins || 0 };
  }

  if (!allUsers[guildId][toUserId]) {
    allUsers[guildId][toUserId] = {
      xp: 0,
      level: 1,
      coins: 50,
      lastDaily: 0,
      dailyStreak: 0,
      bio: 'Viajero del cosmos de Nebula'
    };
  }

  allUsers[guildId][fromUserId].coins = (sender.coins || 0) - amount;
  allUsers[guildId][toUserId].coins = (allUsers[guildId][toUserId].coins || 0) + amount;
  saveJson('levels', allUsers);

  return {
    success: true,
    senderBalance: allUsers[guildId][fromUserId].coins,
    receiverBalance: allUsers[guildId][toUserId].coins
  };
}

// -------------------------------------------------------------
// 6. CANALES DE VOZ TEMPORALES (JOIN TO CREATE)
// -------------------------------------------------------------
const tempVoiceOwners = new Map(); // channelId -> ownerId

function setTempVoice(channelId, ownerId) {
  tempVoiceOwners.set(channelId, ownerId);
}

function getTempVoice(channelId) {
  return tempVoiceOwners.get(channelId);
}

function deleteTempVoice(channelId) {
  return tempVoiceOwners.delete(channelId);
}

// -------------------------------------------------------------
// 7. AUTO-STATUS MINECRAFT (BANNERS EN VIVO)
// -------------------------------------------------------------
function getAutoStatus(guildId) {
  const configs = loadJson('auto_status', {});
  return configs[guildId] || null;
}

function setAutoStatus(guildId, data) {
  const configs = loadJson('auto_status', {});
  if (!data) {
    delete configs[guildId];
  } else {
    configs[guildId] = data;
  }
  saveJson('auto_status', configs);
}

function getAllAutoStatus() {
  return loadJson('auto_status', {});
}

module.exports = {
  setSnipe,
  getSnipe,
  getGuildWarns,
  addWarn,
  removeWarn,
  getUserData,
  setUserBio,
  addMessageXp,
  claimDaily,
  getTopUsers,
  getGuildConfig,
  setGuildConfig,
  getLinkedMinecraft,
  setLinkedMinecraft,
  modifyCoins,
  transferCoins,
  setTempVoice,
  getTempVoice,
  deleteTempVoice,
  getAutoStatus,
  setAutoStatus,
  getAllAutoStatus
};
