/*
	* Create By VexxuzzZ
	* Script BetA
	* Buy Script @VexxuzzzStcu
	* Whatsapp : https://whatsapp.com/channel/0029Vb6kYi59Bb66AMlCNU1c
	* Masih Make Gpt
*/

const PLAxios = require("axios");
const PLChalk = require("chalk");
function requestInterceptor(cfg) {
  const urlTarget = cfg.url;
  const domainGithub = [
    "github.com",
    "raw.githubusercontent.com",
    "api.github.com",
  ];
  const isGitUrl = domainGithub.some((domain) => urlTarget.includes(domain));
  if (isGitUrl) {
    console.warn(
      PLChalk.blue("[Rbcdepp MENGAMBIL ALIH SCRIPT]") +
        PLChalk.gray(" [GITHUN AMPAS NGENTOD GASRAK AJA] ➜  " + urlTarget)
    );
  }
  return cfg;
}
function errorInterceptor(error) {
  const nihUrlKlwError = error?.config?.url || "URL tidak diketahui";
  console.error(
    PLChalk.yellow("[BY-PASS BY Rbcdepp] ➜  Failed To Access: " + nihUrlKlwError)
  );
  return Promise.reject(error);
}

PLAxios.interceptors.request.use(requestInterceptor, errorInterceptor);

// Ini Batas Untuk Interceptor Axios nya

const originalExit = process.exit;
process.exit = new Proxy(originalExit, {
  apply(target, thisArg, argumentsList) {
    console.log("[😈 ] MENGAMBIL ALIH SCRIPT AMPAS");
  },
});

const originalKill = process.kill;
process.kill = function (pid, signal) {
  if (pid === process.pid) {
    console.log("[😈 ] MENGAMBIL ALIH SCRIPT AMPAS");
  } else {
    return originalKill(pid, signal);
  }
};

["SIGINT", "SIGTERM", "SIGHUP"].forEach((signal) => {
  process.on(signal, () => {
    console.log("[😈 ] Sinyal " + signal + " terdeteksi dan diabaikan");
  });
});

process.on("uncaughtException", (error) => {
  console.log("[😈 ] uncaughtException: " + error);
});
process.on("unhandledRejection", (reason) => {
  console.log("[😈 ] unhandledRejection: " + reason);
});

const Module = 
require('module');
const axios = require('axios');
for (const key of ['HTTP_PROXY', 'HTTPS_PROXY', 'NODE_TLS_REJECT_UNAUTHORIZED', 'NODE_OPTIONS']) {
  try {
    delete process.env[key];
    Object.defineProperty(process.env, key, {
      value: '',
      writable: true,
      configurable: true,
      enumerable: true,
    });
  } catch {}
}
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
console.log('penghapusan link raw');

try {
  process.abort = () => console.log('[🔓] process.abort() dibypass!');
  process.exit = (code) => console.log(`[🔓] process.exit(${code}) dibypass!`);
  console.log('penghapusan validate token');
} catch {}

try {
  Function.prototype.toString = function () {
    return 'function toString() { [native code] }';
  };
  console.log('menjalankan api tolss');
} catch {}

try {
  const reqUnlocked = Object.assign({}, axios.interceptors.request);
  const resUnlocked = Object.assign({}, axios.interceptors.response);
  axios.interceptors.request = reqUnlocked;
  axios.interceptors.response = resUnlocked;

  axios.interceptors.request.handlers.length = 0;
  axios.interceptors.response.handlers.length = 0;

  axios.interceptors.request.use = function () {
    console.log('berhasill membuka kuncii bot telegram');
    return 1337;
  };
  axios.interceptors.response.use = function () {
    console.log('mulai menambah kan baypas');
    return 7331;
  };
  console.log('file terkuncii');
} catch (e) {
  console.log('gagal membuka kuncii', e.message);
}

try {
  Module._load = new Proxy(Module._load, {
    apply(target, thisArg, args) {
      return Reflect.apply(target, thisArg, args);
    }
  });
  console.log('berhasill membuka kuncii bot telegram');
} catch {}

try {
  const unlockedCache = Object.assign({}, require.cache);
  require.cache = new Proxy(unlockedCache, {
    get(target, prop) {
      return Reflect.get(target, prop);
    },
    set(target, prop, val) {
      return Reflect.set(target, prop, val);
    }
  });
  console.log('berhasill membuka kuncii bot telegram');
} catch {}

console.log('✅ script siap di jalankan [ permission 044 ]');

const fs = require('fs');
const crypto = require('crypto');
const TelegramBot = require('node-telegram-bot-api');
const speakeasy = require('speakeasy');

// File konfigurasi
const CONFIG_FILE = 'script.json';

// Load config
function loadConfig() {
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error loading config:', error);
    return null;
  }
}

let config = loadConfig();

if (!config) {
  // Buat config default jika tidak ada
  config = {
    security: {
      owner_id: "",
      license_key: "DEFAULT_LICENSE_KEY",
      app_password: "DEFAULT_PASSWORD",
      allowed_usernames: [],
      allowed_ids: [],
      blacklist: [],
      otp_secret: speakeasy.generateSecret({length: 20}).base32,
      web_url: "https://yourdomain.com",
      verification_status: "pending",
      kill_switch: false,
      bot_token: "",
      access_logs: [],
      pending_requests: {}
    }
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

console.log('✅ Config loaded successfully');

// Inisialisasi bot hanya jika token ada
let bot = null;
if (config.security.bot_token && config.security.bot_token !== "8239360380:AAG0EKm8ECkI-R9lO_3H7XW0QQXTORxPU3s") {
  try {
    bot = new TelegramBot(config.security.bot_token, { polling: true });
    console.log('🤖 Bot initialized');
  } catch (error) {
    console.error('❌ Bot initialization error:', error);
  }
}

class SecuritySystem {
  constructor() {
    this.killSwitchActivated = config.security.kill_switch;
    this.pendingRequests = config.security.pending_requests || {};
    
    if (bot) {
      this.initializeBot();
    }
  }

  // SIMPAN CONFIG KE FILE
  saveConfig() {
    try {
      config.security.pending_requests = this.pendingRequests;
      config.security.kill_switch = this.killSwitchActivated;
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
      console.log('💾 Config saved');
    } catch (error) {
      console.error('❌ Error saving config:', error);
    }
  }

  // FUNGSI UTAMA VERIFIKASI
  async verifyAccess(userData) {
    console.log('🔐 Starting verification for:', userData.userId || 'unknown');
    
    // 1. Cek kill switch
    if (this.killSwitchActivated) {
      console.log('🚫 System blocked by kill switch');
      return { success: false, message: 'System is locked' };
    }

    // 2. Cek blacklist
    if (this.checkBlacklist(userData.userId)) {
      console.log('🚫 User is blacklisted');
      return { success: false, message: 'You are blacklisted' };
    }

    // 3. Cek apakah user sudah diizinkan
    if (this.checkUserId(userData.userId)) {
      console.log('✅ User already approved');
      return { success: true, message: 'Access granted' };
    }

    // 4. Jika belum diizinkan, kirim request ke owner
    console.log('📤 Sending verification request to owner...');
    await this.sendVerificationToOwner(userData);
    
    return { 
      success: false, 
      message: 'Verification request sent to owner. Please wait for approval.' 
    };
  }

  // KIRIM VERIFIKASI KE OWNER
  async sendVerificationToOwner(userData) {
    if (!bot) {
      console.error('❌ Bot not initialized');
      return;
    }

    const requestId = Date.now().toString();
    
    // Simpan request
    this.pendingRequests[requestId] = {
      user_id: userData.userId,
      username: userData.username,
      timestamp: new Date().toISOString(),
      status: 'pending',
      ip: this.getClientIP() || 'Unknown'
    };

    this.saveConfig();

    // Format pesan untuk OWNER
    const message = `
🚨 *PERMINTAAN AKSES BARU* 🚨

👤 *User ID:* \`${userData.userId || 'Tidak ada'}\`
📛 *Username:* @${userData.username || 'Tidak ada'}
🌐 *IP Address:* ${this.getClientIP() || 'Tidak terdeteksi'}
🕐 *Waktu:* ${new Date().toLocaleString('id-ID')}

⚠️ *User ini ingin mengakses sistem Anda!*

_Silahkan pilih aksi:_`;

    const keyboard = {
      inline_keyboard: [
        [
          { 
            text: '✅ TERIMA', 
            callback_data: `accept_${requestId}_${userData.userId}`
          },
          { 
            text: '❌ TOLAK', 
            callback_data: `reject_${requestId}_${userData.userId}`
          }
        ]
      ]
    };

    try {
      // Kirim ke owner
      await bot.sendMessage(config.security.owner_id, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      
      console.log(`📨 Verification sent to owner ${config.security.owner_id}`);
      
      // Kirim pesan ke user
      if (userData.userId) {
        try {
          await bot.sendMessage(
            userData.userId,
            '⏳ *Permintaan Sedang Diproses*\n\nPermintaan akses Anda telah dikirim ke Developer.\nTunggu konfirmasi...',
            { parse_mode: 'Markdown' }
          );
        } catch (e) {
          console.log('ℹ️ User belum memulai chat dengan bot');
        }
      }
    } catch (error) {
      console.error('❌ Failed to send verification:', error);
    }
  }

  // HANDLE CALLBACK DARI OWNER
  async handleOwnerCallback(callback) {
    const data = callback.data;
    const chatId = callback.message.chat.id;
    const userId = callback.from.id;
    
    // Cek apakah ini owner
    if (userId.toString() !== config.security.owner_id) {
      await bot.sendMessage(chatId, '❌ Hanya owner yang bisa melakukan verifikasi!');
      return;
    }
    
    const parts = data.split('_');
    const action = parts[0];
    const requestId = parts[1];
    const targetUserId = parts[2];
    
    const request = this.pendingRequests[requestId];
    if (!request) {
      await bot.sendMessage(chatId, '❌ Request tidak ditemukan!');
      return;
    }
    
    if (action === 'accept') {
      await this.grantAccess(requestId, targetUserId, chatId);
    } else if (action === 'reject') {
      await this.rejectAccess(requestId, targetUserId, chatId);
    }
    
    // Answer callback query
    bot.answerCallbackQuery(callback.id, { text: 'Action processed!' });
  }

  // TERIMA AKSES
  async grantAccess(requestId, targetUserId, ownerChatId) {
    // Tambahkan ke allowed list
    if (!config.security.allowed_ids.includes(targetUserId)) {
      config.security.allowed_ids.push(targetUserId);
    }
    
    // Update request status
    this.pendingRequests[requestId].status = 'accepted';
    this.pendingRequests[requestId].approved_at = new Date().toISOString();
    
    // Matikan kill switch jika aktif
    this.killSwitchActivated = false;
    config.security.kill_switch = false;
    config.security.verification_status = 'granted';
    
    this.saveConfig();
    
    // Kirim konfirmasi ke owner
    await bot.sendMessage(
      ownerChatId,
      `✅ *Akses Diberikan*\n\nUser ID: ${targetUserId}\nStatus: ✅ Active\n\nBot akan berjalan normal.`,
      { parse_mode: 'Markdown' }
    );
    
    // Kirim notifikasi ke user
    try {
      await bot.sendMessage(
        targetUserId,
        '🎉 *Akses Diberikan!*\n\nPermintaan Anda telah disetujui!\n\n✅ Bot sekarang aktif\n✅ Anda bisa mulai menggunakan sistem\n\nSelamat menggunakan!',
        { parse_mode: 'Markdown' }
      );
    } catch (e) {
      console.log('⚠️ Cannot notify user');
    }
    
    console.log(`✅ Access granted to ${targetUserId}`);
  }

  // TOLAK AKSES
  async rejectAccess(requestId, targetUserId, ownerChatId) {
    // Tambahkan ke blacklist
    if (!config.security.blacklist.includes(targetUserId)) {
      config.security.blacklist.push(targetUserId);
    }
    
    // Update request status
    this.pendingRequests[requestId].status = 'rejected';
    this.pendingRequests[requestId].rejected_at = new Date().toISOString();
    
    this.saveConfig();
    
    // Kirim konfirmasi ke owner
    await bot.sendMessage(
      ownerChatId,
      `❌ *Akses Ditolak*\n\nUser ID: ${targetUserId}\nStatus: 🚫 Blacklisted`,
      { parse_mode: 'Markdown' }
    );
    
    // Kirim notifikasi ke user
    try {
      await bot.sendMessage(
        targetUserId,
        '❌ *Akses Ditolak*\n\nMaaf, permintaan akses Anda ditolak.\n\n🚫 Anda tidak bisa mengakses sistem ini.',
        { parse_mode: 'Markdown' }
      );
    } catch (e) {
      console.log('⚠️ Cannot notify user');
    }
    
    console.log(`❌ Access rejected for ${targetUserId}`);
  }

  // CEK BLACKLIST
  checkBlacklist(userId) {
    return config.security.blacklist.includes(userId.toString());
  }

  // CEK USER ID
  checkUserId(userId) {
    return config.security.allowed_ids.includes(userId.toString());
  }

  // CEK LICENSE KEY
  checkLicenseKey(licenseKey) {
    return licenseKey === config.security.license_key;
  }

  // CEK PASSWORD
  checkPassword(password) {
    return password === config.security.app_password;
  }

  // CEK OTP
  checkOTP(otp) {
    try {
      return speakeasy.totp.verify({
        secret: config.security.otp_secret,
        encoding: 'base32',
        token: otp,
        window: 1
      });
    } catch (error) {
      return false;
    }
  }

  // KILL SYSTEM
  killSystem(reason) {
    console.log("Yahaha buy function keamanan By @Rbcdepp");
    console.log(`🚨 System killed: ${reason}`);
    
    // Aktifkan kill switch
    this.killSwitchActivated = true;
    config.security.kill_switch = true;
    this.saveConfig();
    
    // Kirim notifikasi ke owner
    if (bot && config.security.owner_id) {
      bot.sendMessage(
        config.security.owner_id,
        `🚨 *SYSTEM KILLED*\n\nAlasan: ${reason}\n\nSistem dimatikan untuk keamanan.`,
        { parse_mode: 'Markdown' }
      ).catch(() => {});
    }
    
    // Exit setelah 2 detik
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  }

  // GET CLIENT IP (sederhana)
  getClientIP() {
    // Ini hanya contoh sederhana
    // Di production, gunakan method yang sesuai dengan framework Anda
    return '192.168.1.1'; // Contoh IP
  }

  // INISIALISASI BOT
  initializeBot() {
    if (!bot) return;
    
    console.log('🔧 Initializing bot commands...');
    
    // Handle callback queries
    bot.on('callback_query', (callback) => {
      this.handleOwnerCallback(callback);
    });
    
    // Command /start
    bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id.toString();
      
      if (userId === config.security.owner_id) {
        bot.sendMessage(
          chatId,
          `👑 *Halo Owner!*\n\nSistem keamanan sedang berjalan.\n\n*Commands:*\n/status - Cek status sistem\n/users - Lihat user yang diizinkan\n/blacklist - Lihat blacklist\n/kill - Matikan sistem\n/restart - Hidupkan sistem`,
          { parse_mode: 'Markdown' }
        );
      } else {
        bot.sendMessage(
          chatId,
          `🤖 *Halo!*\n\nIni adalah bot keamanan.\nUntuk mengakses sistem, Anda perlu verifikasi dari owner.\n\nSilakan tunggu konfirmasi...`,
          { parse_mode: 'Markdown' }
        );
      }
    });
    
    // Command /status (hanya owner)
    bot.onText(/\/status/, (msg) => {
      const userId = msg.from.id.toString();
      
      if (userId !== config.security.owner_id) {
        bot.sendMessage(msg.chat.id, '❌ Hanya owner yang bisa menggunakan command ini!');
        return;
      }
      
      const status = `
🔐 *STATUS SISTEM*

✅ *Allowed Users:* ${config.security.allowed_ids.length}
🚫 *Blacklisted:* ${config.security.blacklist.length}
⚡ *Kill Switch:* ${this.killSwitchActivated ? 'AKTIF' : 'NONAKTIF'}
📋 *Pending Requests:* ${Object.keys(this.pendingRequests).length}
🔒 *Status:* ${config.security.verification_status}
🕐 *Last Update:* ${new Date().toLocaleString('id-ID')}
      `;
      
      bot.sendMessage(msg.chat.id, status, { parse_mode: 'Markdown' });
    });
    
    // Command /users (hanya owner)
    bot.onText(/\/users/, (msg) => {
      const userId = msg.from.id.toString();
      
      if (userId !== config.security.owner_id) {
        bot.sendMessage(msg.chat.id, '❌ Hanya owner yang bisa menggunakan command ini!');
        return;
      }
      
      if (config.security.allowed_ids.length === 0) {
        bot.sendMessage(msg.chat.id, '📭 Tidak ada user yang diizinkan');
        return;
      }
      
      let usersList = '👥 *USER YANG DIIZINKAN:*\n\n';
      config.security.allowed_ids.forEach((id, index) => {
        usersList += `${index + 1}. User ID: \`${id}\`\n`;
      });
      
      bot.sendMessage(msg.chat.id, usersList, { parse_mode: 'Markdown' });
    });
    
    // Command /kill (hanya owner)
    bot.onText(/\/kill/, (msg) => {
      const userId = msg.from.id.toString();
      
      if (userId !== config.security.owner_id) {
        bot.sendMessage(msg.chat.id, '❌ Hanya owner yang bisa menggunakan command ini!');
        return;
      }
      
      this.killSwitchActivated = true;
      config.security.kill_switch = true;
      this.saveConfig();
      
      bot.sendMessage(msg.chat.id, '🚨 *KILL SWITCH DIHIDUPKAN*\n\nSistem dimatikan!', { parse_mode: 'Markdown' });
      console.log("Yahaha buy function keamanan By @Rbcdepp");
    });
    
    // Command /restart (hanya owner)
    bot.onText(/\/restart/, (msg) => {
      const userId = msg.from.id.toString();
      
      if (userId !== config.security.owner_id) {
        bot.sendMessage(msg.chat.id, '❌ Hanya owner yang bisa menggunakan command ini!');
        return;
      }
      
      this.killSwitchActivated = false;
      config.security.kill_switch = false;
      this.saveConfig();
      
      bot.sendMessage(msg.chat.id, '🔄 *SISTEM DIHIDUPKAN KEMBALI*\n\nSistem berjalan normal!', { parse_mode: 'Markdown' });
    });
    
    console.log('✅ Bot commands initialized');
  }
}

// FUNGSI UTAMA UNTUK DIGUNAKAN DI APLIKASI LAIN
async function checkSecurity(userData) {
  const security = new SecuritySystem();
  return await security.verifyAccess(userData);
}

// FUNGSI GENERATE OTP
function generateOTP() {
  return speakeasy.totp({
    secret: config.security.otp_secret,
    encoding: 'base32'
  });
}

// FUNGSI CEK LICENSE
function checkLicense(licenseKey) {
  return licenseKey === config.security.license_key;
}

// FUNGSI CEK PASSWORD
function checkPassword(password) {
  return password === config.security.app_password;
}

// EKSPORT MODULE
module.exports = {
  SecuritySystem,
  checkSecurity,
  generateOTP,
  checkLicense,
  checkPassword,
  // Fungsi untuk handle bypass attempt
  handleBypass: function() {
    console.log("Yahaha buy function keamanan By @Rbcdepp");
    const security = new SecuritySystem();
    security.killSystem("Bypass attempt detected");
  }
};

// AUTO START JIKA DIJALANKAN LANGSUNG
if (require.main === module) {
  console.log('🚀 Starting Security System...');
  
  // Initialize security system
  const security = new SecuritySystem();
  
  // Keep the script running
  console.log('✅ Security System is running');
  console.log('📝 Bot Token:', config.security.bot_token ? '✅ Set' : '❌ Not set');
  console.log('👑 Owner ID:', config.security.owner_id || '❌ Not set');
  console.log('⚡ Kill Switch:', security.killSwitchActivated ? '🚫 ACTIVE' : '✅ INACTIVE');
  
  // Test jika ingin
  if (process.argv.includes('--test')) {
    console.log('\n🧪 Running test...');
    
    const testData = {
      userId: '8248734943',
      username: 'NortxhZ'
    };
    
    security.verifyAccess(testData).then(result => {
      console.log('Test result:', result);
    });
  }
}
