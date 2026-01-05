const fs = require('fs');
const crypto = require('crypto');
const TelegramBot = require('node-telegram-bot-api');
const speakeasy = require('speakeasy');

// Load konfigurasi
const CONFIG_FILE = 'script.json';
let config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

// Bot Telegram
const bot = new TelegramBot(config.security.bot_token, { polling: true });

class SecuritySystem {
  constructor() {
    this.killSwitchActivated = config.security.kill_switch;
    this.pendingRequests = config.security.pending_requests || {};
    this.initializeBot();
  }

  // Fungsi utama untuk mengecek semua keamanan
  async checkAllSecurity(userData) {
    try {
      // Cek jika kill switch aktif
      if (this.killSwitchActivated) {
        console.log("🚫 Kill switch aktif, sistem dimatikan");
        return false;
      }

      // Cek blacklist
      if (this.checkBlacklist(userData.userId)) {
        this.killSystem(`User ${userData.userId} dalam blacklist`);
        return false;
      }

      // Validasi semua
      const checks = {
        license: this.checkLicenseKey(userData.licenseKey),
        password: this.checkPassword(userData.password),
        username: this.checkUsername(userData.username),
        token: this.checkToken(userData.token),
        otp: this.checkOTP(userData.otp),
        userId: this.checkUserId(userData.userId)
      };

      const allPassed = Object.values(checks).every(check => check === true);

      if (allPassed) {
        console.log("✅ Semua verifikasi berhasil, akses diberikan");
        return true;
      } else {
        console.log("⏳ Verifikasi gagal, mengirim notifikasi ke OWNER...");
        await this.sendVerificationRequestToOwner(userData);
        return false;
      }
    } catch (error) {
      this.handleBypassAttempt(error);
      return false;
    }
  }

  // KIRIM NOTIFIKASI KE OWNER BOT (Developer)
  async sendVerificationRequestToOwner(userData) {
    const requestId = crypto.randomBytes(8).toString('hex');
    
    // Simpan request pending
    this.pendingRequests[requestId] = {
      ...userData,
      timestamp: new Date().toISOString(),
      ip: this.getClientIP(),
      status: 'pending'
    };

    // Format pesan untuk OWNER
    const message = `🔔 *HALLO DEV - PERMINTAAN AKSES BARU* 🔔\n\n` +
      `📅 *Tanggal:* ${new Date().toLocaleString('id-ID')}\n` +
      `⏰ *Waktu:* ${new Date().toLocaleTimeString('id-ID')}\n\n` +
      `📋 *DATA PENGGUNA:*\n` +
      `🆔 *User ID:* \`${userData.userId || 'Tidak ada'}\`\n` +
      `👤 *Username:* @${userData.username || 'Tidak ada'}\n` +
      `🌐 *IP Address:* ${this.getClientIP() || 'Tidak terdeteksi'}\n\n` +
      `🔑 *DATA VERIFIKASI:*\n` +
      `🗝️ *License Key:* ${userData.licenseKey ? '✅ Ada' : '❌ Tidak ada'}\n` +
      `🔐 *Bot Token:* ${userData.token ? '✅ Ada' : '❌ Tidak ada'}\n` +
      `🔢 *OTP:* ${userData.otp ? '✅ Ada' : '❌ Tidak ada'}\n\n` +
      `📊 *STATUS SISTEM:*\n` +
      `⚡ Kill Switch: ${this.killSwitchActivated ? '🚫 AKTIF' : '✅ NONAKTIF'}\n` +
      `🔒 Verifikasi: ${config.security.verification_status}\n\n` +
      `📍 *Request ID:* \`${requestId}\`\n\n` +
      `_Pilih aksi di bawah ini:_`;

    // Keyboard untuk OWNER
    const keyboard = {
      inline_keyboard: [
        [
          { 
            text: '✅ ACCEPT & GRANT ACCESS', 
            callback_data: `accept_${requestId}_${userData.userId}`
          },
          { 
            text: '❌ REJECT & BLACKLIST', 
            callback_data: `reject_${requestId}_${userData.userId}`
          }
        ],
        [
          { 
            text: '👁️ VIEW DETAILS', 
            callback_data: `details_${requestId}_${userData.userId}`
          },
          { 
            text: '📊 SYSTEM STATUS', 
            callback_data: `status_${requestId}`
          }
        ],
        [
          { 
            text: '🚫 KILL SWITCH ON', 
            callback_data: `kill_${requestId}`
          },
          { 
            text: '🔄 RESTART SYSTEM', 
            callback_data: `restart_${requestId}`
          }
        ]
      ]
    };

    try {
      // Kirim ke OWNER ID
      await bot.sendMessage(config.security.owner_id, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
        disable_notification: false // Pastikan notifikasi aktif
      });

      console.log(`📤 Notifikasi dikirim ke OWNER: ${config.security.owner_id}`);

      // Kirim juga ke semua admin jika ada
      if (config.security.admin_ids && config.security.admin_ids.length > 0) {
        for (const adminId of config.security.admin_ids) {
          if (adminId !== config.security.owner_id) {
            await bot.sendMessage(adminId, `📢 *Notifikasi Admin:* Ada permintaan akses baru menunggu verifikasi Owner.`, {
              parse_mode: 'Markdown'
            });
          }
        }
      }

      // Update config
      config.security.verification_status = 'waiting_owner_approval';
      config.security.pending_requests = this.pendingRequests;
      this.saveConfig();

      // Kirim pesan ke pengguna (bukan verifikasi, hanya info)
      if (userData.userId) {
        try {
          await bot.sendMessage(
            userData.userId,
            '⏳ *Permintaan Akses Dikirim*\n\n' +
            'Permintaan akses Anda telah dikirim ke Developer/Owner untuk verifikasi.\n' +
            'Anda akan mendapatkan notifikasi jika disetujui.\n\n' +
            '⏱️ Mohon tunggu...',
            { parse_mode: 'Markdown' }
          );
        } catch (e) {
          console.log('⚠️ Tidak bisa mengirim pesan ke pengguna (mungkin belum start bot)');
        }
      }

    } catch (error) {
      console.error('❌ Gagal mengirim notifikasi ke OWNER:', error);
    }
  }

  // HANDLE CALLBACK DARI OWNER
  async handleOwnerCallback(callback) {
    const callbackData = callback.data;
    const chatId = callback.message.chat.id;
    const ownerId = callback.from.id.toString();

    // Verifikasi bahwa yang menekan adalah OWNER
    if (ownerId !== config.security.owner_id && 
        !config.security.admin_ids.includes(ownerId)) {
      await bot.sendMessage(chatId, '❌ *Akses Ditolak*\n\nHanya Owner/Admin yang dapat melakukan verifikasi.');
      return;
    }

    const parts = callbackData.split('_');
    const action = parts[0];
    const requestId = parts[1];
    const userId = parts[2];

    console.log(`🔄 Action dari Owner: ${action}, Request: ${requestId}, User: ${userId}`);

    switch (action) {
      case 'accept':
        await this.grantAccessByOwner(requestId, userId, chatId);
        break;
      case 'reject':
        await this.rejectAndBlacklistByOwner(requestId, userId, chatId);
        break;
      case 'details':
        await this.showRequestDetails(requestId, chatId);
        break;
      case 'status':
        await this.showSystemStatus(chatId);
        break;
      case 'kill':
        await this.activateKillSwitch(chatId);
        break;
      case 'restart':
        await this.restartSystem(chatId);
        break;
    }

    // Jawab callback query
    bot.answerCallbackQuery(callback.id);
  }

  // OWNER MENERIMA AKSES
  async grantAccessByOwner(requestId, userId, ownerChatId) {
    const request = this.pendingRequests[requestId];
    
    if (!request) {
      await bot.sendMessage(ownerChatId, '❌ Request tidak ditemukan atau sudah expired.');
      return;
    }

    // Tambahkan ke allowed IDs
    if (userId && !config.security.allowed_ids.includes(userId)) {
      config.security.allowed_ids.push(userId);
    }

    // Tambahkan username jika ada
    if (request.username && !config.security.allowed_usernames.includes(request.username)) {
      config.security.allowed_usernames.push(request.username);
    }

    // Update status
    config.security.verification_status = 'granted';
    config.security.kill_switch = false;
    this.killSwitchActivated = false;
    
    // Update request status
    this.pendingRequests[requestId].status = 'accepted';
    this.pendingRequests[requestId].approved_by = ownerChatId;
    this.pendingRequests[requestId].approved_at = new Date().toISOString();

    this.saveConfig();

    // Kirim konfirmasi ke OWNER
    const ownerMessage = `✅ *ACCESS GRANTED*\n\n` +
      `📋 *Detail:*\n` +
      `👤 User: @${request.username || 'N/A'}\n` +
      `🆔 ID: ${userId}\n` +
      `📍 IP: ${request.ip}\n` +
      `⏰ Waktu: ${new Date().toLocaleString('id-ID')}\n\n` +
      `🔄 *Sistem akan berjalan normal.*`;

    await bot.sendMessage(ownerChatId, ownerMessage, { parse_mode: 'Markdown' });

    // Kirim notifikasi ke semua admin
    for (const adminId of config.security.admin_ids) {
      if (adminId !== ownerChatId.toString()) {
        await bot.sendMessage(
          adminId,
          `📢 *INFO ADMIN:*\nAkses diberikan kepada User ID: ${userId}`,
          { parse_mode: 'Markdown' }
        );
      }
    }

    // Kirim konfirmasi ke USER yang meminta
    if (userId) {
      try {
        await bot.sendMessage(
          userId,
          '🎉 *SELAMAT! AKSES DIBERIKAN* 🎉\n\n' +
          'Permintaan akses Anda telah *DITERIMA* oleh Developer/Owner.\n\n' +
          '✅ Bot sekarang aktif dan siap digunakan.\n' +
          '✅ Semua fitur sudah terbuka.\n' +
          '✅ Anda dapat mulai menggunakan sistem.\n\n' +
          'Terima kasih telah menunggu! 😊',
          { parse_mode: 'Markdown' }
        );
      } catch (e) {
        console.log('⚠️ Tidak bisa mengirim notifikasi ke user');
      }
    }

    // Restart sistem
    this.restartSystem();
  }

  // OWNER MENOLAK AKSES
  async rejectAndBlacklistByOwner(requestId, userId, ownerChatId) {
    const request = this.pendingRequests[requestId];
    
    if (!request) {
      await bot.sendMessage(ownerChatId, '❌ Request tidak ditemukan.');
      return;
    }

    // Tambahkan ke blacklist
    if (userId && !config.security.blacklist.includes(userId)) {
      config.security.blacklist.push(userId);
    }

    // Update request status
    this.pendingRequests[requestId].status = 'rejected';
    this.pendingRequests[requestId].rejected_by = ownerChatId;
    this.pendingRequests[requestId].rejected_at = new Date().toISOString();

    this.saveConfig();

    // Kirim konfirmasi ke OWNER
    const ownerMessage = `❌ *ACCESS REJECTED*\n\n` +
      `📋 *Detail:*\n` +
      `👤 User: @${request.username || 'N/A'}\n` +
      `🆔 ID: ${userId}\n` +
      `📍 IP: ${request.ip}\n` +
      `⏰ Waktu: ${new Date().toLocaleString('id-ID')}\n\n` +
      `🚫 *User telah ditambahkan ke blacklist.*`;

    await bot.sendMessage(ownerChatId, ownerMessage, { parse_mode: 'Markdown' });

    // Kirim notifikasi ke semua admin
    for (const adminId of config.security.admin_ids) {
      if (adminId !== ownerChatId.toString()) {
        await bot.sendMessage(
          adminId,
          `📢 *INFO ADMIN:*\nAkses DITOLAK untuk User ID: ${userId}`,
          { parse_mode: 'Markdown' }
        );
      }
    }

    // Kirim pemberitahuan ke USER yang ditolak
    if (userId) {
      try {
        await bot.sendMessage(
          userId,
          '❌ *MAAF, AKSES DITOLAK*\n\n' +
          'Permintaan akses Anda telah *DITOLAK* oleh Developer/Owner.\n\n' +
          '🚫 Anda tidak dapat mengakses sistem.\n' +
          '🚫 ID Anda telah dimasukkan ke blacklist.\n' +
          '🚫 Semua akses diblokir.\n\n' +
          'Untuk informasi lebih lanjut, hubungi Admin.',
          { parse_mode: 'Markdown' }
        );
      } catch (e) {
        console.log('⚠️ Tidak bisa mengirim notifikasi penolakan ke user');
      }
    }
  }

  // TAMPILKAN DETAIL REQUEST
  async showRequestDetails(requestId, chatId) {
    const request = this.pendingRequests[requestId];
    
    if (!request) {
      await bot.sendMessage(chatId, '❌ Request tidak ditemukan.');
      return;
    }

    const details = `📊 *REQUEST DETAILS*\n\n` +
      `🆔 Request ID: ${requestId}\n` +
      `👤 User ID: ${request.userId}\n` +
      `📛 Username: @${request.username}\n` +
      `🌐 IP Address: ${request.ip}\n` +
      `🕐 Request Time: ${new Date(request.timestamp).toLocaleString('id-ID')}\n` +
      `📡 User Agent: ${request.userAgent || 'N/A'}\n` +
      `🔑 License Key: ${request.licenseKey ? '✅' : '❌'}\n` +
      `🔐 Bot Token: ${request.token ? '✅' : '❌'}\n` +
      `🔢 OTP Provided: ${request.otp ? '✅' : '❌'}\n` +
      `📊 Status: ${request.status || 'pending'}`;

    await bot.sendMessage(chatId, details, { parse_mode: 'Markdown' });
  }

  // TAMPILKAN STATUS SISTEM
  async showSystemStatus(chatId) {
    const status = `🔐 *SECURITY SYSTEM STATUS*\n\n` +
      `⚡ Kill Switch: ${this.killSwitchActivated ? '🚫 AKTIF' : '✅ NONAKTIF'}\n` +
      `🔒 Verification Status: ${config.security.verification_status}\n` +
      `👑 Owner ID: ${config.security.owner_id}\n` +
      `👥 Admin Count: ${config.security.admin_ids.length}\n` +
      `✅ Allowed Users: ${config.security.allowed_ids.length}\n` +
      `🚫 Blacklisted Users: ${config.security.blacklist.length}\n` +
      `⏳ Pending Requests: ${Object.keys(this.pendingRequests).length}\n` +
      `📅 Last Update: ${new Date().toLocaleString('id-ID')}\n\n` +
      `_Sistem berjalan normal_`;

    await bot.sendMessage(chatId, status, { parse_mode: 'Markdown' });
  }

  // AKTIFKAN KILL SWITCH
  async activateKillSwitch(chatId) {
    config.security.kill_switch = true;
    this.killSwitchActivated = true;
    this.saveConfig();

    await bot.sendMessage(chatId, '🚨 *KILL SWITCH DIHIDUPKAN*\n\nSemua akses diblokir. Sistem dimatikan.');
    console.log("Yahaha buy function keamanan By @Rbcdepp");
    
    // Matikan sistem setelah 3 detik
    setTimeout(() => {
      process.exit(1);
    }, 3000);
  }

  // RESTART SISTEM
  async restartSystem(chatId = null) {
    if (chatId) {
      await bot.sendMessage(chatId, '🔄 *SYSTEM RESTARTING...*\n\nSistem akan restart dalam 3 detik.');
    }

    console.log('🔄 Restarting security system...');
    
    setTimeout(() => {
      console.log('✅ System restarted successfully');
      // Implementasi restart sesuai kebutuhan
      // Contoh: reload config
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      this.killSwitchActivated = config.security.kill_switch;
      this.pendingRequests = config.security.pending_requests;
    }, 3000);
  }

  // FUNGSI KEAMANAN LAINNYA (tetap sama seperti sebelumnya)
  checkLicenseKey(license) {
    return license === config.security.license_key;
  }

  checkPassword(password) {
    return password === config.security.app_password;
  }

  checkUsername(username) {
    return config.security.allowed_usernames.includes(username);
  }

  checkToken(token) {
    return token === config.security.bot_token;
  }

  checkOTP(otp) {
    return speakeasy.totp.verify({
      secret: config.security.otp_secret,
      encoding: 'base32',
      token: otp,
      window: 2
    });
  }

  checkUserId(userId) {
    return config.security.allowed_ids.includes(userId.toString());
  }

  checkBlacklist(userId) {
    return config.security.blacklist.includes(userId.toString());
  }

  killSystem(reason) {
    console.log("Yahaha buy function keamanan By @Rbcdepp");
    console.log(`🚨 System Killed: ${reason}`);

    // Log event
    this.logSecurityEvent('SYSTEM_KILLED', reason);

    // Auto blacklist
    const attackerId = this.getCurrentUserId();
    if (attackerId && !config.security.blacklist.includes(attackerId)) {
      config.security.blacklist.push(attackerId);
    }

    // Blacklist token jika berbeda
    const token = this.getCurrentToken();
    if (token && token !== config.security.bot_token) {
      config.security.blacklist.push(`TOKEN_${token.substring(0, 10)}`);
    }

    config.security.kill_switch = true;
    this.killSwitchActivated = true;
    this.saveConfig();

    // Kirim notifikasi ke owner
    this.sendKillNotificationToOwner(reason);

    // Keluar dari proses
    setTimeout(() => {
      process.exit(1);
    }, 2000);
  }

  // KIRIM NOTIFIKASI KILL KE OWNER
  async sendKillNotificationToOwner(reason) {
    try {
      await bot.sendMessage(
        config.security.owner_id,
        `🚨 *SYSTEM KILLED* 🚨\n\n` +
        `❌ *Alasan:* ${reason}\n` +
        `🕐 *Waktu:* ${new Date().toLocaleString('id-ID')}\n` +
        `🌐 *IP:* ${this.getClientIP()}\n\n` +
        `⚠️ Sistem dimatikan karena aktivitas mencurigakan.`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Gagal mengirim notifikasi kill ke owner:', error);
    }
  }

  handleBypassAttempt(error) {
    console.log("Yahaha buy function keamanan By @Rbcdepp");
    
    const bypassData = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      ip: this.getClientIP(),
      userAgent: this.getUserAgent()
    };

    this.logSecurityEvent('BYPASS_ATTEMPT', JSON.stringify(bypassData));
    
    // Kirim notifikasi bypass attempt ke owner
    this.sendBypassNotificationToOwner(bypassData);
    
    this.killSystem('Bypass attempt detected');
  }

  // KIRIM NOTIFIKASI BYPASS KE OWNER
  async sendBypassNotificationToOwner(bypassData) {
    try {
      await bot.sendMessage(
        config.security.owner_id,
        `🚨 *BYBASS ATTEMPT DETECTED* 🚨\n\n` +
        `⚠️ Ada yang mencoba bypass sistem!\n` +
        `🕐 Waktu: ${new Date(bypassData.timestamp).toLocaleString('id-ID')}\n` +
        `🌐 IP: ${bypassData.ip}\n` +
        `🔧 User Agent: ${bypassData.userAgent}\n\n` +
        `Sistem akan dimatikan otomatis.`,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Gagal mengirim notifikasi bypass ke owner:', error);
    }
  }

  // HELPER FUNCTIONS
  logSecurityEvent(event, data) {
    config.security.access_logs.push({
      event,
      data,
      timestamp: new Date().toISOString(),
      ip: this.getClientIP()
    });
    this.saveConfig();
  }

  saveConfig() {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  }

  getClientIP() {
    // Implementasi mendapatkan IP client
    // Untuk Node.js dengan Express:
    // return req.ip || req.connection.remoteAddress;
    return 'IP_NOT_IMPLEMENTED';
  }

  getUserAgent() {
    // Implementasi mendapatkan User Agent
    // return req.headers['user-agent'];
    return 'UA_NOT_IMPLEMENTED';
  }

  getCurrentUserId() {
    // Implementasi mendapatkan user ID saat ini
    return null;
  }

  getCurrentToken() {
    // Implementasi mendapatkan token saat ini
    return null;
  }

  // INISIALISASI BOT
  initializeBot() {
    console.log('🤖 Bot Security System Initializing...');

    // Handle callback queries dari OWNER
    bot.on('callback_query', (callback) => {
      this.handleOwnerCallback(callback);
    });

    // Command manual untuk owner
    bot.onText(/\/start/, (msg) => {
      const userId = msg.from.id.toString();
      
      if (userId === config.security.owner_id) {
        bot.sendMessage(
          msg.chat.id,
          `👑 *WELCOME OWNER* 👑\n\n` +
          `Anda adalah Owner dari sistem keamanan ini.\n` +
          `ID Anda: ${userId}\n\n` +
          `*Commands yang tersedia:*\n` +
          `/status - Cek status sistem\n` +
          `/users - Lihat daftar pengguna\n` +
          `/blacklist - Lihat blacklist\n` +
          `/pending - Lihat pending requests\n` +
          `/kill - Aktifkan kill switch\n` +
          `/restart - Restart sistem\n\n` +
          `Sistem akan mengirim notifikasi ke Anda saat ada permintaan akses.`,
          { parse_mode: 'Markdown' }
        );
      }
    });

    // Command untuk cek status (hanya owner/admin)
    bot.onText(/\/status/, (msg) => {
      const userId = msg.from.id.toString();
      
      if (userId === config.security.owner_id || config.security.admin_ids.includes(userId)) {
        this.showSystemStatus(msg.chat.id);
      } else {
        bot.sendMessage(msg.chat.id, '❌ Hanya Owner/Admin yang bisa menggunakan command ini.');
      }
    });

    // Command untuk lihat pending requests
    bot.onText(/\/pending/, (msg) => {
      const userId = msg.from.id.toString();
      
      if (userId === config.security.owner_id || config.security.admin_ids.includes(userId)) {
        const pendingCount = Object.keys(this.pendingRequests).length;
        
        if (pendingCount === 0) {
          bot.sendMessage(msg.chat.id, '✅ Tidak ada pending requests.');
        } else {
          let message = `📋 *PENDING REQUESTS (${pendingCount})*\n\n`;
          
          Object.entries(this.pendingRequests).forEach(([id, req], index) => {
            if (req.status === 'pending') {
              message += `${index + 1}. ID: ${id}\n`;
              message += `   👤 User: @${req.username || 'N/A'}\n`;
              message += `   🆔 User ID: ${req.userId}\n`;
              message += `   🕐 Time: ${new Date(req.timestamp).toLocaleTimeString('id-ID')}\n\n`;
            }
          });
          
          bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
        }
      } else {
        bot.sendMessage(msg.chat.id, '❌ Hanya Owner/Admin yang bisa menggunakan command ini.');
      }
    });

    console.log('✅ Security System Ready!');
    console.log(`📞 Notifikasi akan dikirim ke Owner ID: ${config.security.owner_id}`);
  }
}

// Export module
module.exports = {
  SecuritySystem,
  generateOTP: () => {
    return speakeasy.totp({
      secret: config.security.otp_secret,
      encoding: 'base32'
    });
  },
  checkAccess: async (userData) => {
    const security = new SecuritySystem();
    return await security.checkAllSecurity(userData);
  }
};

// Auto start jika file dijalankan langsung
if (require.main === module) {
  const security = new SecuritySystem();
  console.log('🔒 Security System is running...');
  
  // Test: Simulasi permintaan akses
  // const testData = {
  //   userId: '123456789',
  //   username: 'testuser',
  //   licenseKey: 'WRONG_KEY',
  //   password: 'WRONG_PASS',
  //   token: 'WRONG_TOKEN',
  //   otp: '123456'
  // };
  // security.checkAllSecurity(testData);
}
