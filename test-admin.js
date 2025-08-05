const bcrypt = require('bcrypt');

const testPassword = 'Sye$2025';

console.log('🔍 GENERATING AND TESTING HASH FOR:', testPassword);
console.log('=====================================');

// Generate a new hash
bcrypt.hash(testPassword, 12)
  .then(hash => {
    console.log('✅ Generated hash:', hash);
    
    // Test that this hash actually works
    return bcrypt.compare(testPassword, hash);
  })
  .then(isValid => {
    console.log('✅ Hash verification test:', isValid);
    
    if (isValid) {
      console.log('\n🎯 SUCCESS! Use this hash in Railway:');
      console.log('ADMIN_PASSWORD_HASH=' + hash);
    } else {
      console.log('❌ Hash verification failed!');
    }
  })
  .catch(error => {
    console.error('❌ Error:', error);
  }); 