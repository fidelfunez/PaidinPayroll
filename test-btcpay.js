#!/usr/bin/env node

// Test script for BTCPay Server integration
// Usage: node test-btcpay.js

import { btcpayService } from './server/btcpay.js';

async function testBTCPay() {
  console.log('🧪 Testing BTCPay Server integration...\n');

  try {
    // Test 1: Check configuration
    console.log('1. Checking BTCPay configuration...');
    try {
      btcpayService.checkConfiguration();
      console.log('✅ BTCPay configuration is valid');
    } catch (error) {
      console.log('❌ BTCPay configuration error:', error.message);
      console.log('   Please set BTCPAY_URL, BTCPAY_API_KEY, and BTCPAY_STORE_ID environment variables');
      return;
    }

    // Test 2: Get store info
    console.log('\n2. Fetching store information...');
    try {
      const storeInfo = await btcpayService.getStoreInfo();
      console.log('✅ Store info retrieved:', {
        name: storeInfo.name,
        website: storeInfo.website,
        defaultCurrency: storeInfo.defaultCurrency
      });
    } catch (error) {
      console.log('❌ Failed to get store info:', error.message);
    }

    // Test 3: Get payment methods
    console.log('\n3. Fetching payment methods...');
    try {
      const paymentMethods = await btcpayService.getPaymentMethods();
      console.log('✅ Payment methods retrieved:', paymentMethods.length, 'methods available');
    } catch (error) {
      console.log('❌ Failed to get payment methods:', error.message);
    }

    // Test 4: Create a test invoice
    console.log('\n4. Creating test invoice...');
    try {
      const testInvoice = await btcpayService.createInvoice({
        amount: 10.00,
        currency: 'USD',
        description: 'Test invoice from PaidIn',
        orderId: `test_${Date.now()}`,
        customerEmail: 'test@example.com',
        customerName: 'Test User'
      });
      
      console.log('✅ Test invoice created:', {
        id: testInvoice.id,
        amount: testInvoice.amount,
        status: testInvoice.status,
        paymentUrl: testInvoice.paymentUrls.BIP21
      });

      // Test 5: Get invoice status
      console.log('\n5. Fetching invoice status...');
      try {
        const status = await btcpayService.getInvoiceStatus(testInvoice.id);
        console.log('✅ Invoice status retrieved:', {
          status: status.status,
          amount: status.amount,
          transactions: status.transactions?.length || 0
        });
      } catch (error) {
        console.log('❌ Failed to get invoice status:', error.message);
      }

    } catch (error) {
      console.log('❌ Failed to create test invoice:', error.message);
    }

    console.log('\n🎉 BTCPay integration test completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Set up your BTCPay Server instance');
    console.log('   2. Configure the environment variables');
    console.log('   3. Test the API endpoints in your application');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBTCPay().catch(console.error); 