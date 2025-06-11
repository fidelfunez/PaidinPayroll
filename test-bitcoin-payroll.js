// Test script for Bitcoin payroll functionality
const baseUrl = 'http://localhost:5000';

// Test 1: Update employee withdrawal method to Lightning address
async function testUpdateWithdrawalMethod() {
  console.log('🔧 Testing withdrawal method update...');
  
  const response = await fetch(`${baseUrl}/api/user/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': process.env.ADMIN_COOKIES || ''
    },
    body: JSON.stringify({
      withdrawalMethod: 'bitcoin',
      btcAddress: 'test@getalby.com' // Test Lightning address
    })
  });
  
  const result = await response.json();
  console.log('Withdrawal method update:', response.status, result);
  return response.ok;
}

// Test 2: Create a test payroll payment
async function testCreatePayrollPayment() {
  console.log('💰 Testing payroll payment creation...');
  
  const response = await fetch(`${baseUrl}/api/payroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': process.env.ADMIN_COOKIES || ''
    },
    body: JSON.stringify({
      userId: 1, // Admin user for testing
      amountUsd: '1.00', // Small test amount
      scheduledDate: new Date().toISOString()
    })
  });
  
  const result = await response.json();
  console.log('Payroll payment creation:', response.status, result);
  return { success: response.ok, paymentId: result.id };
}

// Test 3: Process Bitcoin payment via LNbits
async function testProcessBitcoinPayment(paymentId) {
  console.log('⚡ Testing Bitcoin payment processing...');
  
  const response = await fetch(`${baseUrl}/api/payroll/${paymentId}/process-bitcoin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': process.env.ADMIN_COOKIES || ''
    },
    body: JSON.stringify({})
  });
  
  const result = await response.json();
  console.log('Bitcoin payment processing:', response.status, result);
  return response.ok;
}

// Test 4: Check payment status
async function testCheckPaymentStatus(paymentId) {
  console.log('📊 Testing payment status check...');
  
  const response = await fetch(`${baseUrl}/api/payroll/${paymentId}/bitcoin-status`, {
    headers: {
      'Cookie': process.env.ADMIN_COOKIES || ''
    }
  });
  
  const result = await response.json();
  console.log('Payment status:', response.status, result);
  return response.ok;
}

// Run comprehensive test
async function runBitcoinPayrollTest() {
  console.log('🚀 Starting Bitcoin Payroll Integration Test\n');
  
  try {
    // Step 1: Update withdrawal method
    const withdrawalSuccess = await testUpdateWithdrawalMethod();
    if (!withdrawalSuccess) {
      console.log('❌ Withdrawal method update failed');
      return;
    }
    
    console.log('✅ Withdrawal method updated successfully\n');
    
    // Step 2: Create payroll payment
    const { success: payrollSuccess, paymentId } = await testCreatePayrollPayment();
    if (!payrollSuccess || !paymentId) {
      console.log('❌ Payroll payment creation failed');
      return;
    }
    
    console.log(`✅ Payroll payment created with ID: ${paymentId}\n`);
    
    // Step 3: Process Bitcoin payment
    const bitcoinSuccess = await testProcessBitcoinPayment(paymentId);
    if (!bitcoinSuccess) {
      console.log('❌ Bitcoin payment processing failed (this is expected if wallet has no balance)');
    } else {
      console.log('✅ Bitcoin payment processed successfully\n');
      
      // Step 4: Check payment status
      await testCheckPaymentStatus(paymentId);
    }
    
    console.log('\n🎉 Bitcoin Payroll Test Completed!');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runBitcoinPayrollTest };
} else {
  runBitcoinPayrollTest();
}