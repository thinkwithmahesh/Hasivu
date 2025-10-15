/**
 * HASIVU Platform - External Services Test Script
 * Tests WhatsApp Business API and SMS gateway integration
 */

const { WhatsAppService } = require('../dist/services/whatsapp.service');
const { SMSService } = require('../dist/services/sms.service');

async function testExternalServices() {
  console.log('🧪 Testing HASIVU External Services Integration\n');

  // Test WhatsApp Service
  console.log('📱 Testing WhatsApp Business API Service...');
  try {
    const whatsappService = WhatsAppService.getInstance();
    const config = whatsappService.getConfiguration();

    console.log('✅ WhatsApp Service initialized');
    console.log(`   Access Token: ${config.accessToken ? 'Configured' : 'Not configured'}`);
    console.log(`   Phone Number ID: ${config.phoneNumberId}`);
    console.log(`   Business Account ID: ${config.businessAccountId}`);

    // Test template retrieval (will fail if not configured, but shows service is working)
    try {
      const templates = await whatsappService.getMessageTemplates();
      console.log(`✅ Retrieved ${templates.length} WhatsApp templates`);
    } catch (error) {
      console.log(`⚠️  WhatsApp templates not accessible: ${error.message}`);
      console.log('   This is expected if WhatsApp Business API is not configured yet');
    }
  } catch (error) {
    console.log(`❌ WhatsApp Service failed: ${error.message}`);
  }

  console.log('');

  // Test SMS Service
  console.log('📞 Testing SMS Service (Twilio)...');
  try {
    const smsService = SMSService.getInstance();
    const config = smsService.getConfiguration();

    console.log('✅ SMS Service initialized');
    console.log(`   Account SID: ${config.accountSid ? 'Configured' : 'Not configured'}`);
    console.log(`   Phone Number: ${config.phoneNumber}`);
    console.log(`   Service Configured: ${smsService.isConfigured() ? 'Yes' : 'No'}`);

    // Test delivery metrics (will show empty results if no messages sent)
    try {
      const metrics = await smsService.getDeliveryMetrics(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        new Date()
      );
      console.log(`✅ SMS metrics retrieved:`);
      console.log(`   Total Sent: ${metrics.totalSent}`);
      console.log(`   Delivery Rate: ${metrics.deliveryRate}%`);
      console.log(`   Total Cost: ₹${metrics.totalCost}`);
    } catch (error) {
      console.log(`❌ SMS metrics failed: ${error.message}`);
    }
  } catch (error) {
    console.log(`❌ SMS Service failed: ${error.message}`);
  }

  console.log('\n📋 Configuration Status Summary:');
  console.log('');

  // Check environment variables
  const requiredEnvVars = [
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_BUSINESS_ACCOUNT_ID',
    'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
  ];

  console.log('🔧 Environment Variables Status:');
  requiredEnvVars.forEach(envVar => {
    const isSet = process.env[envVar] ? '✅ Set' : '❌ Not set';
    console.log(`   ${envVar}: ${isSet}`);
  });

  console.log('');
  console.log('📝 Next Steps:');
  console.log('');
  console.log('1. WhatsApp Business API Setup:');
  console.log('   - Create Meta Business account');
  console.log('   - Set up WhatsApp Business API');
  console.log(
    '   - Configure webhook URL: https://your-domain.com/api/v1/notifications/webhooks/whatsapp'
  );
  console.log(
    '   - Set environment variables: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, etc.'
  );
  console.log('');
  console.log('2. SMS Service Setup (Twilio):');
  console.log('   - Create Twilio account');
  console.log('   - Purchase Indian phone number');
  console.log(
    '   - Configure webhook URL: https://your-domain.com/api/v1/notifications/webhooks/sms'
  );
  console.log(
    '   - Set environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER'
  );
  console.log('');
  console.log('3. Email Service Setup (SendGrid):');
  console.log('   - Create SendGrid account');
  console.log('   - Set environment variables: SENDGRID_API_KEY, SENDGRID_FROM_EMAIL');
  console.log('');
  console.log('4. Testing:');
  console.log('   - Run this script again after configuration');
  console.log('   - Test actual message sending with configured services');
  console.log('   - Verify webhook endpoints are receiving updates');
  console.log('');

  console.log('🎯 External services integration test completed!');
}

// Run the test
if (require.main === module) {
  testExternalServices().catch(console.error);
}

module.exports = { testExternalServices };
