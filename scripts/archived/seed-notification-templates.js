/**
 * HASIVU Platform - Notification Templates Seeder
 * Seeds initial notification templates for Epic 6 implementation
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const notificationTemplates = [
  {
    id: 'order_confirmation',
    name: 'Order Confirmation',
    type: 'transactional',
    channels: JSON.stringify(['push', 'email', 'whatsapp']),
    content: JSON.stringify({
      push: {
        body: 'Order {{orderId}} confirmed! Total: ₹{{totalAmount}}. Delivery on {{deliveryDate}}.',
      },
      email: {
        subject: 'Order Confirmation - {{orderId}}',
        body: 'Hi {{recipient.firstName}}, your order {{orderId}} has been confirmed. Total amount: ₹{{totalAmount}}. Expected delivery: {{deliveryDate}}.',
      },
      whatsapp: {
        body: 'Hi {{recipient.firstName}}! 🎉 Your order {{orderId}} is confirmed. Total: ₹{{totalAmount}}. Delivery: {{deliveryDate}}',
      },
      sms: {
        body: 'Order {{orderId}} confirmed. Total: ₹{{totalAmount}}. Delivery: {{deliveryDate}}',
      },
      in_app: {
        body: 'Your order {{orderId}} has been confirmed and is being prepared.',
      },
      socket: {
        body: 'Order {{orderId}} confirmed',
      },
    }),
    variables: JSON.stringify(['orderId', 'totalAmount', 'deliveryDate', 'studentName']),
    conditions: JSON.stringify({}),
    isActive: true,
    isDefault: true,
    priority: 'high',
    createdBy: 'system',
  },
  {
    id: 'order_status_update',
    name: 'Order Status Update',
    type: 'transactional',
    channels: JSON.stringify(['push', 'in_app']),
    content: JSON.stringify({
      push: {
        body: 'Order {{orderId}} is now {{newStatus}}. {{message}}',
      },
      in_app: {
        body: 'Your order {{orderId}} status has been updated to {{newStatus}}. {{message}}',
      },
      email: {
        subject: 'Order Update - {{orderId}}',
        body: 'Your order {{orderId}} status has been updated to {{newStatus}}. {{message}}',
      },
      sms: {
        body: 'Order {{orderId}} status: {{newStatus}}',
      },
      whatsapp: {
        body: '📦 Order {{orderId}} status: {{newStatus}}. {{message}}',
      },
      socket: {
        body: 'Order {{orderId}} status updated',
      },
    }),
    variables: JSON.stringify(['orderId', 'newStatus', 'message']),
    conditions: JSON.stringify({}),
    isActive: true,
    isDefault: true,
    priority: 'normal',
    createdBy: 'system',
  },
  {
    id: 'delivery_verification',
    name: 'Delivery Verification',
    type: 'transactional',
    channels: JSON.stringify(['push', 'whatsapp', 'in_app']),
    content: JSON.stringify({
      push: {
        body: 'Your child has received their meal! Order {{orderId}} delivered successfully.',
      },
      whatsapp: {
        body: '✅ Great news! Your child has received their meal for order {{orderId}}. Bon appétit! 🍽️',
      },
      in_app: {
        body: 'Meal delivery confirmed for order {{orderId}}. Your child has received their food.',
      },
      email: {
        subject: 'Meal Delivered - Order {{orderId}}',
        body: 'Your child has successfully received their meal for order {{orderId}}. Thank you for using HASIVU!',
      },
      sms: {
        body: 'Meal delivered for order {{orderId}}. Thank you!',
      },
      socket: {
        body: 'Delivery verified for order {{orderId}}',
      },
    }),
    variables: JSON.stringify(['orderId', 'studentName', 'deliveryTime']),
    conditions: JSON.stringify({}),
    isActive: true,
    isDefault: true,
    priority: 'high',
    createdBy: 'system',
  },
  {
    id: 'payment_success',
    name: 'Payment Success',
    type: 'transactional',
    channels: JSON.stringify(['push', 'email', 'in_app']),
    content: JSON.stringify({
      push: {
        body: 'Payment of ₹{{amount}} successful for order {{orderId}}',
      },
      email: {
        subject: 'Payment Confirmation - Order {{orderId}}',
        body: 'Your payment of ₹{{amount}} for order {{orderId}} has been processed successfully.',
      },
      in_app: {
        body: 'Payment confirmed for order {{orderId}}. Amount: ₹{{amount}}',
      },
      sms: {
        body: 'Payment successful: ₹{{amount}} for order {{orderId}}',
      },
      whatsapp: {
        body: '💳 Payment successful! ₹{{amount}} for order {{orderId}}',
      },
      socket: {
        body: 'Payment confirmed',
      },
    }),
    variables: JSON.stringify(['orderId', 'amount', 'paymentMethod']),
    conditions: JSON.stringify({}),
    isActive: true,
    isDefault: true,
    priority: 'normal',
    createdBy: 'system',
  },
  {
    id: 'welcome_parent',
    name: 'Welcome New Parent',
    type: 'promotional',
    channels: JSON.stringify(['email', 'push', 'whatsapp']),
    content: JSON.stringify({
      email: {
        subject: 'Welcome to HASIVU - Nutritious Meals Made Easy!',
        body: "Dear {{recipient.firstName}}, welcome to HASIVU! We're excited to help you provide nutritious meals for your child at school. Get started by placing your first order today!",
      },
      push: {
        body: 'Welcome to HASIVU! Start ordering nutritious meals for your child.',
      },
      whatsapp: {
        body: "👋 Welcome to HASIVU! We're here to make school meals nutritious and hassle-free. Ready to get started?",
      },
      sms: {
        body: 'Welcome to HASIVU! Start ordering nutritious school meals today.',
      },
      in_app: {
        body: 'Welcome to HASIVU! Explore our menu and place your first order.',
      },
      socket: {
        body: 'Welcome notification sent',
      },
    }),
    variables: JSON.stringify(['schoolName']),
    conditions: JSON.stringify({}),
    isActive: true,
    isDefault: true,
    priority: 'normal',
    createdBy: 'system',
  },
  {
    id: 'menu_update',
    name: 'Menu Update Notification',
    type: 'informational',
    channels: JSON.stringify(['push', 'in_app', 'email']),
    content: JSON.stringify({
      push: {
        body: "New menu available! Check out today's nutritious options.",
      },
      in_app: {
        body: "Today's menu has been updated with fresh, nutritious options.",
      },
      email: {
        subject: 'Updated Menu Available',
        body: 'Check out our updated menu with fresh, nutritious meal options for today.',
      },
      whatsapp: {
        body: '🍽️ New menu available! Fresh and nutritious options for today.',
      },
      sms: {
        body: "New menu available! Check out today's options.",
      },
      socket: {
        body: 'Menu updated',
      },
    }),
    variables: JSON.stringify(['menuDate', 'specialItems']),
    conditions: JSON.stringify({}),
    isActive: true,
    isDefault: true,
    priority: 'low',
    createdBy: 'system',
  },
];

async function seedNotificationTemplates() {
  console.log('🌱 Seeding notification templates...');

  try {
    for (const template of notificationTemplates) {
      const existing = await prisma.notificationTemplate.findUnique({
        where: { id: template.id },
      });

      if (existing) {
        console.log(`⏭️  Template ${template.id} already exists, skipping...`);
        continue;
      }

      await prisma.notificationTemplate.create({
        data: template,
      });

      console.log(`✅ Created template: ${template.name}`);
    }

    console.log('🎉 Notification templates seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding notification templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
if (require.main === module) {
  seedNotificationTemplates()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedNotificationTemplates, notificationTemplates };
