const SecuritySystem = require('./a.js');

// Inisialisasi sistem
const security = new SecuritySystem();

// Contoh penggunaan
async function testVerification() {
  console.log('\n🔍 Testing Verification System\n');
  
  // Contoh data user
  const userData = {
    "owner_id": "7807425271",
    "owner_username": "@Rbcdepp",
    "admin_ids": ["admin1_id", "admin2_id"],
    "license_key": "AAAA-6666-7777",
    "app_password": "1",
    "allowed_usernames": ["NortxhZ"],
    "allowed_ids": ["8248734943"],
    "blacklist": [],
    "otp_secret": "676767",
    "web_url": "https://yourdomain.com",
    "verification_status": "pending",
    "kill_switch": false,
    "bot_token": "8239360380:AAG0EKm8ECkI-R9lO_3H7XW0QQXTORxPU3s",
    "access_logs": [],
    "pending_requests": {}
  };

  console.log('📝 Data user untuk verifikasi:');
  console.log(userData);

  // Lakukan verifikasi
  const result = await security.verifyAccess(userData);
  
  console.log('\n📊 Hasil verifikasi:');
  console.log(result);
  
  if (result.success) {
    console.log('✅ Akses diberikan!');
  } else {
    console.log('⏳ Menunggu verifikasi owner...');
    console.log('📱 Owner akan mendapatkan notifikasi di Telegram');
  }
}

// Jalankan test
testVerification();
