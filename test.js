const SecuritySystem = require('./bot_security');

// Inisialisasi sistem
const security = new SecuritySystem();

// Contoh penggunaan
async function testVerification() {
  console.log('\n🔍 Testing Verification System\n');
  
  // Contoh data user
  const userData = {
    userId: '987654321',
    username: 'testuser',
    licenseKey: 'YOUR_LICENSE_KEY_HERE', // Ganti dengan yang benar
    password: 'YOUR_PASSWORD_HERE',     // Ganti dengan yang benar
    otp: '123456'
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
