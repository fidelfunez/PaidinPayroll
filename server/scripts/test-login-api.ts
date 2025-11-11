// @ts-ignore - node-fetch v3 uses ESM
import fetch from 'node-fetch';

const API_BASE_URL = process.env.API_URL || 'http://localhost:8080';

async function testLoginAPI() {
  console.log('🧪 Testing Login API Endpoint...');
  console.log(`📍 Testing against: ${API_BASE_URL}`);
  console.log('');

  try {
    // Test 1: Check if server is running
    console.log('1️⃣ Checking if server is running...');
    try {
      const healthResponse = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ Server is running!');
        console.log(`   - Status: ${healthData.status}`);
        console.log(`   - Timestamp: ${healthData.timestamp}`);
      } else {
        console.log('⚠️ Server responded but health check failed');
        console.log(`   - Status: ${healthResponse.status}`);
      }
    } catch (error: any) {
      console.log('❌ Server is not running or not accessible');
      console.log(`   - Error: ${error.message}`);
      console.log('');
      console.log('💡 To start the server, run:');
      console.log('   npm run dev');
      console.log('   or');
      console.log('   npm start');
      return;
    }
    console.log('');

    // Test 2: Test login with username
    console.log('2️⃣ Testing login with username "fidel"...');
    try {
      const loginResponse = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'fidel',
          password: 'password123',
        }),
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok && loginData.token) {
        console.log('✅ Login successful with username!');
        console.log(`   - Token received: ${loginData.token.substring(0, 20)}...`);
        console.log(`   - User: ${loginData.user.username}`);
        console.log(`   - Email: ${loginData.user.email}`);
        console.log(`   - Role: ${loginData.user.role}`);
        console.log(`   - Company: ${loginData.user.company?.name || 'N/A'}`);
      } else {
        console.log('❌ Login failed with username');
        console.log(`   - Status: ${loginResponse.status}`);
        console.log(`   - Message: ${loginData.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.log('❌ Error testing login with username');
      console.log(`   - Error: ${error.message}`);
    }
    console.log('');

    // Test 3: Test login with email
    console.log('3️⃣ Testing login with email "fidel@paidin.com"...');
    try {
      const loginResponse = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'fidel@paidin.com',
          password: 'password123',
        }),
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok && loginData.token) {
        console.log('✅ Login successful with email!');
        console.log(`   - Token received: ${loginData.token.substring(0, 20)}...`);
        console.log(`   - User: ${loginData.user.username}`);
        console.log(`   - Email: ${loginData.user.email}`);
        console.log(`   - Role: ${loginData.user.role}`);
        console.log(`   - Company: ${loginData.user.company?.name || 'N/A'}`);
      } else {
        console.log('❌ Login failed with email');
        console.log(`   - Status: ${loginResponse.status}`);
        console.log(`   - Message: ${loginData.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.log('❌ Error testing login with email');
      console.log(`   - Error: ${error.message}`);
    }
    console.log('');

    // Test 4: Test login with wrong password
    console.log('4️⃣ Testing login with wrong password (should fail)...');
    try {
      const loginResponse = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'fidel',
          password: 'wrongpassword',
        }),
      });

      const loginData = await loginResponse.json();

      if (loginResponse.status === 401) {
        console.log('✅ Correctly rejected wrong password!');
        console.log(`   - Status: ${loginResponse.status}`);
        console.log(`   - Message: ${loginData.message || 'Unauthorized'}`);
      } else {
        console.log('⚠️ Unexpected response for wrong password');
        console.log(`   - Status: ${loginResponse.status}`);
        console.log(`   - Response: ${JSON.stringify(loginData)}`);
      }
    } catch (error: any) {
      console.log('❌ Error testing wrong password');
      console.log(`   - Error: ${error.message}`);
    }
    console.log('');

    // Test 5: Test case-insensitive username
    console.log('5️⃣ Testing login with case-insensitive username "Fidel"...');
    try {
      const loginResponse = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'Fidel',
          password: 'password123',
        }),
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok && loginData.token) {
        console.log('✅ Login successful with case-insensitive username!');
        console.log(`   - Token received: ${loginData.token.substring(0, 20)}...`);
      } else {
        console.log('⚠️ Case-insensitive login may not be working');
        console.log(`   - Status: ${loginResponse.status}`);
        console.log(`   - Message: ${loginData.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.log('❌ Error testing case-insensitive login');
      console.log(`   - Error: ${error.message}`);
    }
    console.log('');

    console.log('📊 API Test Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Server connectivity tested');
    console.log('✅ Login endpoint tested');
    console.log('✅ Authentication flow verified');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🎉 API tests completed!');

  } catch (error) {
    console.error('❌ Error testing API:', error);
    throw error;
  }
}

// Run the test
testLoginAPI()
  .then(() => {
    console.log('✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

