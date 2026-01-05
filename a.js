const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// ==================== KONFIGURASI ====================
const CONFIG_PATH = path.join(__dirname, 'script.json');

// Load config dengan error handling
function loadConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      console.error('❌ File script.json tidak ditemukan!');
      console.log('📝 Membuat file config baru...');
      
      const defaultConfig = {
        owner: { telegram_id: "7807425271", username: "@Rbcdepp" },
        security: {
          license_key: "AAAA-6666-7777",
          password: "1",
          allowed_users: [],
          allowed_usernames: [],
          blacklist: [],
          otp_secret: "676767",
          status: "active",
          kill_switch: false,
          last_check: "",
          admin_ids: [],
          verification_status: "active",
          pending_requests: {}
        },
        bot: { token: "8239360380:AAG0EKm8ECkI-R9lO_3H7XW0QQXTORxPU3s" }
      };
      
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    }
    
    const data = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = JSON.parse(data);
    
    // Set default values jika tidak ada
    config.owner = config.owner || {};
    config.owner.telegram_id = config.owner.telegram_id || "7807425271";
    config.owner.username = config.owner.username || "@Rbcdepp";
    
    config.security = config.security || {};
    config.security.allowed_users = config.security.allowed_users || [];
    config.security.allowed_usernames = config.security.allowed_usernames || [];
    config.security.blacklist = config.security.blacklist || [];
    config.security.status = config.security.status || "active";
    config.security.kill_switch = config.security.kill_switch || false;
    config.security.admin_ids = config.security.admin_ids || [];
    config.security.pending_requests = config.security.pending_requests || {};
    
    config.bot = config.bot || {};
    config.bot.token = config.bot.token || "8239360380:AAG0EKm8ECkI-R9lO_3H7XW0QQXTORxPU3s";
    
    return config;
  } catch (error) {
    console.error('❌ Error loading config:', error.message);
    process.exit(1);
  }
}

let config = loadConfig();

// ==================== INISIALISASI BOT ====================
console.log('🔧 Inisialisasi Bot Security System...');
console.log(`👑 Owner: ${config.owner.username} (${config.owner.telegram_id})`);

// Validasi token bot
if (!config.bot.token || config.bot.token.includes("YOUR_BOT_TOKEN_HERE")) {
  console.error('❌ Token bot tidak valid! Update di script.json');
  process.exit(1);
}

const bot = new TelegramBot(config.bot.token, {
  polling: true,
  request: {
    timeout: 60000,
    proxy: process.env.PROXY || null
  }
});

// ==================== SISTEM KEAMANAN ====================
class RealSecuritySystem {
  constructor() {
    this.killSwitch = config.security.kill_switch;
    this.pendingRequests = config.security.pending_requests || {};
    this.initBot();
  }

  // Simpan konfigurasi
  saveConfig() {
    try {
      config.security.last_check = new Date().toISOString();
      config.security.kill_switch = this.killSwitch;
      config.security.pending_requests = this.pendingRequests;
      
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
      console.log('💾 Config saved');
    } catch (error) {
      console.error('❌ Error saving config:', error.message);
    }
  }

  // Inisialisasi bot
  initBot() {
    console.log('🤖 Starting Telegram Bot...');
    
    // Handle polling errors
    bot.on('polling_error', (error) => {
      console.error('⚠️ Polling error:', error.message);
    });

    bot.on('error', (error) => {
      console.error('⚠️ Bot error:', error.message);
    });

    // ============= COMMAND HANDLERS =============
    
    // Command /start
    bot.onText(/\/start/, (msg) => {
      const userId = msg.from.id.toString();
      const username = msg.from.username || 'No Username';
      
      console.log(`📥 /start dari ${username} (${userId})`);
      
      // Jika user adalah owner
      if (userId === config.owner.telegram_id) {
        bot.sendMessage(
          msg.chat.id,
          `👑 *SELAMAT DATANG OWNER* 👑\n\n` +
          `*ID:* \`${userId}\`\n` +
          `*Username:* @${username}\n` +
          `*Status:* ${config.security.status}\n` +
          `*Kill Switch:* ${this.killSwitch ? '🚫 AKTIF' : '✅ NONAKTIF'}\n\n` +
          `*Commands Tersedia:*\n` +
          `/status - Status sistem\n` +
          `/verify - Verifikasi akses\n` +
          `/users - Lihat user diizinkan\n` +
          `/blacklist - Lihat blacklist\n` +
          `/killon - Aktifkan kill switch\n` +
          `/killoff - Nonaktifkan kill switch\n` +
          `/test - Test notifikasi`,
          { parse_mode: 'Markdown' }
        );
      } else {
        bot.sendMessage(
          msg.chat.id,
          `👋 *HALO!* 👋\n\n` +
          `Saya adalah *Security System Bot*\n` +
          `Owner: ${config.owner.username}\n\n` +
          `Untuk mendapatkan akses, gunakan:\n` +
          `/verify license password otp\n\n` +
          `Contoh: /verify AAAA-6666-7777 1 676767`,
          { parse_mode: 'Markdown' }
        );
      }
    });

    // Command /verify - VERIFIKASI UTAMA
    bot.onText(/\/verify (.+)/, async (msg, match) => {
      const userId = msg.from.id.toString();
      const username = msg.from.username || 'NoUsername';
      const chatId = msg.chat.id;
      
      console.log(`🔍 Verifikasi dari ${username} (${userId})`);
      
      // Cek kill switch
      if (this.killSwitch) {
        bot.sendMessage(chatId, '🚫 *SISTEM DIMATIKAN*\n\nKill switch aktif. Hubungi owner.');
        return;
      }
      
      // Cek blacklist
      if (config.security.blacklist.includes(userId)) {
        bot.sendMessage(chatId, '🚫 *AKSES DITOLAK*\n\nAnda dalam blacklist!');
        this.handleBypassAttempt(`Blacklisted user: ${userId}`);
        return;
      }
      
      // Cek apakah sudah diizinkan
      if (config.security.allowed_users.includes(userId) || 
          config.security.allowed_usernames.includes(username)) {
        bot.sendMessage(chatId, '✅ *SUDAH TERVERIFIKASI*\n\nAnda sudah memiliki akses!');
        return;
      }
      
      // Parse input
      const args = match[1].split(' ');
      if (args.length < 3) {
        bot.sendMessage(
          chatId,
          '❌ *FORMAT SALAH*\n\n' +
          'Gunakan: /verify license_key password otp\n' +
          'Contoh: /verify AAAA-6666-7777 1 676767',
          { parse_mode: 'Markdown' }
        );
        return;
      }
      
      const [licenseKey, password, otp] = args;
      
      // Proses verifikasi
      const result = await this.processVerification({
        userId,
        username,
        licenseKey,
        password,
        otp,
        chatId
      });
      
      // Kirim hasil ke user
      if (result.success) {
        bot.sendMessage(chatId, result.message, { parse_mode: 'Markdown' });
      } else {
        bot.sendMessage(chatId, result.message, { parse_mode: 'Markdown' });
      }
    });

    // Command /status - hanya untuk owner
    bot.onText(/\/status/, (msg) => {
      const userId = msg.from.id.toString();
      
      if (userId === config.owner.telegram_id) {
        this.sendStatus(msg.chat.id);
      }
    });

    // Command /users - lihat user diizinkan
    bot.onText(/\/users/, (msg) => {
      const userId = msg.from.id.toString();
      
      if (userId === config.owner.telegram_id) {
        const allowedUsers = config.security.allowed_users;
        const allowedUsernames = config.security.allowed_usernames;
        
        let message = `👥 *USER YANG DIIZINKAN*\n\n`;
        message += `*Total Users:* ${allowedUsers.length}\n`;
        message += `*Total Usernames:* ${allowedUsernames.length}\n\n`;
        
        if (allowedUsers.length > 0) {
          message += `*User IDs:*\n`;
          allowedUsers.forEach((id, index) => {
            message += `${index + 1}. \`${id}\`\n`;
          });
        }
        
        if (allowedUsernames.length > 0) {
          message += `\n*Usernames:*\n`;
          allowedUsernames.forEach((uname, index) => {
            message += `${index + 1}. @${uname}\n`;
          });
        }
        
        bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
      }
    });

    // Command /blacklist
    bot.onText(/\/blacklist/, (msg) => {
      const userId = msg.from.id.toString();
      
      if (userId === config.owner.telegram_id) {
        const blacklist = config.security.blacklist;
        
        let message = `🚫 *BLACKLISTED USERS*\n\n`;
        message += `Total: ${blacklist.length} user\n\n`;
        
        if (blacklist.length > 0) {
          blacklist.forEach((id, index) => {
            message += `${index + 1}. \`${id}\`\n`;
          });
        } else {
          message += `Blacklist kosong.`;
        }
        
        bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
      }
    });

    // Command /killon - aktifkan kill switch
    bot.onText(/\/killon/, (msg) => {
      const userId = msg.from.id.toString();
      
      if (userId === config.owner.telegram_id) {
        this.killSwitch = true;
        config.security.kill_switch = true;
        this.saveConfig();
        
        bot.sendMessage(
          msg.chat.id,
          '🚨 *KILL SWITCH DIHIDUPKAN*\n\n' +
          'Semua akses diblokir.\n' +
          'Sistem dimatikan.',
          { parse_mode: 'Markdown' }
        );
        
        console.log("Yahaha buy function keamanan By @Rbcdepp");
      }
    });

    // Command /killoff - matikan kill switch
    bot.onText(/\/killoff/, (msg) => {
      const userId = msg.from.id.toString();
      
      if (userId === config.owner.telegram_id) {
        this.killSwitch = false;
        config.security.kill_switch = false;
        this.saveConfig();
        
        bot.sendMessage(
          msg.chat.id,
          '✅ *KILL SWITCH DIMATIKAN*\n\n' +
          'Sistem kembali aktif.\n' +
          'Akses normal.',
          { parse_mode: 'Markdown' }
        );
      }
    });

    // Command /test - test notifikasi
    bot.onText(/\/test/, (msg) => {
      const userId = msg.from.id.toString();
      
      if (userId === config.owner.telegram_id) {
        this.sendTestNotification();
        bot.sendMessage(msg.chat.id, '✅ Test notification sent!');
      }
    });

    // Handle callback queries (untuk button accept/reject)
    bot.on('callback_query', async (callbackQuery) => {
      await this.handleCallback(callbackQuery);
    });

    console.log('✅ Bot Security System Ready!');
  }

  // ============= FUNGSI UTAMA =============
  
  async processVerification(userData) {
    try {
      const { userId, username, licenseKey, password, otp, chatId } = userData;
      
      console.log(`🔐 Verifikasi untuk ${username}:`);
      console.log(`   License: ${licenseKey}`);
      console.log(`   Password: ${password}`);
      console.log(`   OTP: ${otp}`);
      
      // Validasi data
      let validChecks = 0;
      let failedChecks = [];
      
      // 1. Cek license key
      if (licenseKey === config.security.license_key) {
        validChecks++;
      } else {
        failedChecks.push('license');
      }
      
      // 2. Cek password
      if (password === config.security.password) {
        validChecks++;
      } else {
        failedChecks.push('password');
      }
      
      // 3. Cek OTP (static untuk sekarang)
      if (otp === config.security.otp_secret) {
        validChecks++;
      } else {
        failedChecks.push('otp');
      }
      
      // Jika semua valid (3/3)
      if (validChecks === 3) {
        console.log(`✅ AUTO ACCEPT: ${username} (${userId})`);
        
        // Tambahkan ke allowed lists
        if (!config.security.allowed_users.includes(userId)) {
          config.security.allowed_users.push(userId);
        }
        
        if (username !== 'NoUsername' && !config.security.allowed_usernames.includes(username)) {
          config.security.allowed_usernames.push(username);
        }
        
        this.saveConfig();
        
        // Kirim notifikasi ke owner
        bot.sendMessage(
          config.owner.telegram_id,
          `✅ *AUTO VERIFIED*\n\n` +
          `User: @${username}\n` +
          `ID: ${userId}\n` +
          `Waktu: ${new Date().toLocaleString('id-ID')}`,
          { parse_mode: 'Markdown' }
        );
        
        return {
          success: true,
          message: '🎉 *VERIFIKASI BERHASIL!*\n\nSemua data valid. Akses diberikan!'
        };
      }
      
      // Jika 2 dari 3 valid
      if (validChecks >= 2) {
        console.log(`⚠️ Manual verify needed: ${username} (${validChecks}/3)`);
        
        // Kirim ke owner untuk verifikasi manual
        const requestId = Date.now();
        
        this.pendingRequests[requestId] = {
          userId,
          username,
          licenseKey,
          password,
          otp,
          timestamp: new Date().toISOString(),
          validChecks,
          failedChecks
        };
        
        this.saveConfig();
        
        // Kirim ke owner dengan button
        const message = `🔔 *PERMINTAAN VERIFIKASI* 🔔\n\n` +
          `👤 User: @${username}\n` +
          `🆔 ID: \`${userId}\`\n` +
          `📊 Status: ${validChecks}/3 valid\n` +
          `❌ Gagal: ${failedChecks.join(', ') || 'tidak ada'}\n\n` +
          `📅 Waktu: ${new Date().toLocaleString('id-ID')}\n` +
          `📍 Request ID: ${requestId}`;
        
        const keyboard = {
          inline_keyboard: [
            [
              { text: '✅ ACCEPT', callback_data: `accept_${userId}_${requestId}` },
              { text: '❌ REJECT', callback_data: `reject_${userId}_${requestId}` }
            ]
          ]
        };
        
        await bot.sendMessage(config.owner.telegram_id, message, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });
        
        return {
          success: false,
          message: '⏳ *MENUNGGU VERIFIKASI*\n\n' +
                   'Data Anda telah dikirim ke owner untuk verifikasi manual.\n' +
                   'Anda akan mendapat notifikasi jika disetujui.'
        };
      }
      
      // Jika kurang dari 2 valid
      console.log(`❌ Verification failed: ${username} (${validChecks}/3)`);
      
      // Kirim ke owner untuk review (tidak ada button, hanya info)
      bot.sendMessage(
        config.owner.telegram_id,
        `⚠️ *VERIFIKASI GAGAL*\n\n` +
        `User: @${username}\n` +
        `ID: ${userId}\n` +
        `Status: ${validChecks}/3 valid\n` +
        `Gagal: ${failedChecks.join(', ')}\n` +
        `Waktu: ${new Date().toLocaleString('id-ID')}`,
        { parse_mode: 'Markdown' }
      );
      
      return {
        success: false,
        message: '❌ *VERIFIKASI GAGAL*\n\n' +
                 'Data tidak valid. Hubungi owner untuk bantuan.'
      };
      
    } catch (error) {
      console.error('❌ Error in processVerification:', error);
      this.handleBypassAttempt(error);
      
      return {
        success: false,
        message: '❌ *ERROR SISTEM*\n\nTerjadi kesalahan. Coba lagi nanti.'
      };
    }
  }

  // Handle callback dari owner
  async handleCallback(callbackQuery) {
    try {
      const data = callbackQuery.data;
      const [action, userId, requestId] = data.split('_');
      const ownerId = callbackQuery.from.id.toString();
      
      // Verifikasi owner
      if (ownerId !== config.owner.telegram_id) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: '❌ Hanya owner yang bisa!',
          show_alert: true
        });
        return;
      }
      
      const request = this.pendingRequests[requestId];
      if (!request) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: '❌ Request tidak ditemukan!',
          show_alert: true
        });
        return;
      }
      
      if (action === 'accept') {
        // Terima user
        if (!config.security.allowed_users.includes(userId)) {
          config.security.allowed_users.push(userId);
        }
        
        if (!config.security.allowed_usernames.includes(request.username)) {
          config.security.allowed_usernames.push(request.username);
        }
        
        // Hapus dari pending
        delete this.pendingRequests[requestId];
        this.saveConfig();
        
        // Update pesan di owner
        await bot.editMessageText(
          `✅ *DITERIMA*\n\n` +
          `User: @${request.username}\n` +
          `ID: ${userId}\n` +
          `Status: ✅ Akses diberikan\n` +
          `Waktu: ${new Date().toLocaleString('id-ID')}`,
          {
            chat_id: callbackQuery.message.chat.id,
            message_id: callbackQuery.message.message_id,
            parse_mode: 'Markdown'
          }
        );
        
        // Kirim ke user
        try {
          await bot.sendMessage(
            userId,
            '🎉 *PERMINTAAN DITERIMA!*\n\n' +
            'Owner telah menyetujui permintaan akses Anda.\n' +
            'Sekarang Anda dapat menggunakan sistem.',
            { parse_mode: 'Markdown' }
          );
        } catch (e) {
          console.log('⚠️ Tidak bisa kirim ke user');
        }
        
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: '✅ User diterima!',
          show_alert: false
        });
        
      } else if (action === 'reject') {
        // Tolak user
        if (!config.security.blacklist.includes(userId)) {
          config.security.blacklist.push(userId);
        }
        
        // Hapus dari pending
        delete this.pendingRequests[requestId];
        this.saveConfig();
        
        // Update pesan di owner
        await bot.editMessageText(
          `❌ *DITOLAK*\n\n` +
          `User: @${request.username}\n` +
          `ID: ${userId}\n` +
          `Status: ❌ Di-blacklist\n` +
          `Waktu: ${new Date().toLocaleString('id-ID')}`,
          {
            chat_id: callbackQuery.message.chat.id,
            message_id: callbackQuery.message.message_id,
            parse_mode: 'Markdown'
          }
        );
        
        // Kirim ke user
        try {
          await bot.sendMessage(
            userId,
            '❌ *PERMINTAAN DITOLAK!*\n\n' +
            'Owner telah menolak permintaan akses Anda.\n' +
            'ID Anda telah dimasukkan ke blacklist.',
            { parse_mode: 'Markdown' }
          );
        } catch (e) {
          console.log('⚠️ Tidak bisa kirim ke user');
        }
        
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: '❌ User ditolak!',
          show_alert: false
        });
      }
      
    } catch (error) {
      console.error('❌ Error in handleCallback:', error);
      try {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: '❌ Error processing!',
          show_alert: false
        });
      } catch (e) {
        // Ignore
      }
    }
  }

  // Kirim status sistem
  async sendStatus(chatId) {
    const status = `🔐 *STATUS SISTEM* 🔐\n\n` +
      `⚡ Status: ${config.security.status}\n` +
      `🚫 Kill Switch: ${this.killSwitch ? 'AKTIF' : 'NONAKTIF'}\n` +
      `👑 Owner: ${config.owner.username}\n` +
      `🔑 License Key: ${config.security.license_key}\n` +
      `🔐 Password: ${config.security.password}\n` +
      `🔢 OTP Secret: ${config.security.otp_secret}\n\n` +
      `📊 STATISTIK:\n` +
      `✅ User Diizinkan: ${config.security.allowed_users.length}\n` +
      `✅ Username Diizinkan: ${config.security.allowed_usernames.length}\n` +
      `🚫 Blacklist: ${config.security.blacklist.length}\n` +
      `⏳ Pending Requests: ${Object.keys(this.pendingRequests).length}\n\n` +
      `📅 Last Update: ${config.security.last_check || 'Never'}`;
    
    await bot.sendMessage(chatId, status, { parse_mode: 'Markdown' });
  }

  // Kirim test notifikasi
  sendTestNotification() {
    const testData = {
      userId: '999888777',
      username: 'testuser',
      licenseKey: 'AAAA-6666-7777',
      password: '1',
      otp: '676767'
    };
    
    this.processVerification({
      ...testData,
      chatId: config.owner.telegram_id
    });
  }

  // Handle bypass attempt
  handleBypassAttempt(error) {
    console.log("\n" + "=".repeat(50));
    console.log("Yahaha buy function keamanan By @Rbcdepp");
    console.log("=".repeat(50));
    
    // Aktifkan kill switch
    this.killSwitch = true;
    config.security.kill_switch = true;
    config.security.status = 'compromised';
    
    // Kirim notifikasi ke owner
    bot.sendMessage(
      config.owner.telegram_id,
      '🚨 *BYBASS ATTEMPT DETECTED* 🚨\n\n' +
      'Terjadi percobaan bypass sistem!\n' +
      'Kill switch diaktifkan otomatis.\n\n' +
      `Error: ${error.message || 'Unknown'}\n` +
      `Time: ${new Date().toLocaleString('id-ID')}`,
      { parse_mode: 'Markdown' }
    );
    
    this.saveConfig();
    console.log('🚨 Sistem dimatikan karena bypass attempt!');
  }
}

// ==================== START SYSTEM ====================
console.log('\n' + '='.repeat(50));
console.log('🚀 STARTING REAL SECURITY SYSTEM');
console.log('👑 Owner:', config.owner.username);
console.log('🔑 License:', config.security.license_key);
console.log('🔐 Password:', config.security.password);
console.log('🔢 OTP Secret:', config.security.otp_secret);
console.log('='.repeat(50) + '\n');

// Jalankan sistem
const securitySystem = new RealSecuritySystem();

// Keep alive
setInterval(() => {
  config.security.last_check = new Date().toISOString();
  securitySystem.saveConfig();
}, 30000); // Update setiap 30 detik

// Handle exit
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down security system...');
  securitySystem.saveConfig();
  process.exit(0);
});
