import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  await prisma.salesChallanItem.deleteMany();
  await prisma.salesChallan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.customerFollowUp.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const commonPassword = await bcrypt.hash('password123', 10);

  // 1. Create Users for all 4 roles
  const adminUser = await prisma.user.create({
    data: {
      name: 'Global Admin',
      email: 'admin@minierp.com',
      passwordHash: commonPassword,
      role: 'ADMIN',
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      name: 'Sarah Sales Manager',
      email: 'sales@minierp.com',
      passwordHash: commonPassword,
      role: 'SALES',
    },
  });

  const warehouseUser = await prisma.user.create({
    data: {
      name: 'Walter Warehouse lead',
      email: 'warehouse@minierp.com',
      passwordHash: commonPassword,
      role: 'WAREHOUSE',
    },
  });

  const accountsUser = await prisma.user.create({
    data: {
      name: 'Alice Accounts Lead',
      email: 'accounts@minierp.com',
      passwordHash: commonPassword,
      role: 'ACCOUNTS',
    },
  });

  console.log('✅ Users seeded successfully:');
  console.log('   - Admin: admin@minierp.com / password123');
  console.log('   - Sales: sales@minierp.com / password123');
  console.log('   - Warehouse: warehouse@minierp.com / password123');
  console.log('   - Accounts: accounts@minierp.com / password123');

  // 2. Create Sample Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Rajesh Sharma',
      mobile: '+91 9876543210',
      email: 'rajesh@apexdistributors.com',
      businessName: 'Apex Wholesale Traders',
      gstNumber: '07AAAAA0000A1Z5',
      customerType: 'WHOLESALE',
      address: 'Plot 42, Okhla Industrial Area Phase 3, New Delhi',
      status: 'ACTIVE',
      followUpDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
      notes: 'Key distributor for Northern region. Bulk pricing tier 1.',
      createdById: salesUser.id,
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Priya Patel',
      mobile: '+91 9123456789',
      email: 'priya@metroretail.com',
      businessName: 'Metro Supermart Pvt Ltd',
      gstNumber: '27BBBCA1111B1Z2',
      customerType: 'RETAIL',
      address: 'Shop 12-14, Commercial Hub, Bandra West, Mumbai',
      status: 'LEAD',
      followUpDate: new Date(Date.now() + 86400000 * 1), // tomorrow
      notes: 'Requested sample catalog for electronics & hardware line.',
      createdById: salesUser.id,
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Anil Kumar',
      mobile: '+91 9988776655',
      email: 'anil@southtrade.in',
      businessName: 'South Zone Supply Chains',
      gstNumber: '33CCCCD2222C1Z9',
      customerType: 'DISTRIBUTOR',
      address: '104 Mount Road, Guindy, Chennai',
      status: 'ACTIVE',
      createdById: salesUser.id,
    },
  });

  // Follow-up Notes
  await prisma.customerFollowUp.create({
    data: {
      customerId: customer1.id,
      note: 'Discussed Q3 inventory requirement. Customer requested 10% credit discount.',
      followUpDate: new Date(Date.now() + 86400000 * 3),
      createdById: salesUser.id,
    },
  });

  await prisma.customerFollowUp.create({
    data: {
      customerId: customer2.id,
      note: 'Initial intro call completed. Sent product specs via email.',
      followUpDate: new Date(Date.now() + 86400000 * 1),
      createdById: salesUser.id,
    },
  });

  console.log('✅ Customers & Follow-up logs seeded.');

  // 3. Create Sample Products
  const prod1 = await prisma.product.create({
    data: {
      name: 'Industrial Heavy Duty Drill 850W',
      sku: 'PRD-DRL-850',
      category: 'Power Tools',
      unitPrice: 129.99,
      currentStock: 45,
      minStockAlert: 10,
      location: 'Warehouse Rack A-12',
    },
  });

  const prod2 = await prisma.product.create({
    data: {
      name: 'High Precision Laser Distance Meter 50m',
      sku: 'PRD-LSR-050',
      category: 'Measuring Instruments',
      unitPrice: 79.50,
      currentStock: 5, // Low stock trigger
      minStockAlert: 8,
      location: 'Warehouse Rack B-04',
    },
  });

  const prod3 = await prisma.product.create({
    data: {
      name: 'Stainless Steel Fastener Kit (1000 Pcs)',
      sku: 'PRD-FST-1000',
      category: 'Hardware Supplies',
      unitPrice: 45.00,
      currentStock: 120,
      minStockAlert: 25,
      location: 'Warehouse Rack C-09',
    },
  });

  const prod4 = await prisma.product.create({
    data: {
      name: 'Ergonomic Safety Helmet - Yellow',
      sku: 'PRD-HLM-YEL',
      category: 'Safety Equipment',
      unitPrice: 18.75,
      currentStock: 3, // Critical stock alert
      minStockAlert: 15,
      location: 'Warehouse Rack D-01',
    },
  });

  // Initial Stock Movements
  await prisma.stockMovement.createMany({
    data: [
      {
        productId: prod1.id,
        quantityChanged: 45,
        movementType: 'IN',
        reason: 'Initial Vendor Bulk Shipment',
        createdById: warehouseUser.id,
      },
      {
        productId: prod2.id,
        quantityChanged: 5,
        movementType: 'IN',
        reason: 'Initial Stock On Hand',
        createdById: warehouseUser.id,
      },
      {
        productId: prod3.id,
        quantityChanged: 120,
        movementType: 'IN',
        reason: 'Initial Stock On Hand',
        createdById: warehouseUser.id,
      },
      {
        productId: prod4.id,
        quantityChanged: 3,
        movementType: 'IN',
        reason: 'Initial Stock On Hand',
        createdById: warehouseUser.id,
      },
    ],
  });

  console.log('✅ Products & Stock Movements seeded.');

  // 4. Create Sample Sales Challans
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  // Challan 1: Confirmed
  const challan1 = await prisma.salesChallan.create({
    data: {
      challanNumber: `CH-${todayStr}-0001`,
      customerId: customer1.id,
      customerSnapshot: JSON.stringify({
        id: customer1.id,
        name: customer1.name,
        mobile: customer1.mobile,
        email: customer1.email,
        businessName: customer1.businessName,
        gstNumber: customer1.gstNumber,
        address: customer1.address,
      }),
      totalQuantity: 10,
      totalAmount: 1299.90,
      status: 'CONFIRMED',
      createdById: salesUser.id,
      items: {
        create: [
          {
            productId: prod1.id,
            productSnapshot: JSON.stringify({ id: prod1.id, name: prod1.name, sku: prod1.sku, category: prod1.category }),
            unitPrice: 129.99,
            quantity: 10,
            subtotal: 1299.90,
          },
        ],
      },
    },
  });

  // Deduct stock for confirmed challan1
  await prisma.product.update({
    where: { id: prod1.id },
    data: { currentStock: { decrement: 10 } },
  });

  await prisma.stockMovement.create({
    data: {
      productId: prod1.id,
      quantityChanged: 10,
      movementType: 'OUT',
      reason: `Sales Challan #${challan1.challanNumber} Confirmed`,
      createdById: salesUser.id,
    },
  });

  // Challan 2: Draft
  await prisma.salesChallan.create({
    data: {
      challanNumber: `CH-${todayStr}-0002`,
      customerId: customer2.id,
      customerSnapshot: JSON.stringify({
        id: customer2.id,
        name: customer2.name,
        mobile: customer2.mobile,
        email: customer2.email,
        businessName: customer2.businessName,
        gstNumber: customer2.gstNumber,
        address: customer2.address,
      }),
      totalQuantity: 5,
      totalAmount: 225.00,
      status: 'DRAFT',
      createdById: salesUser.id,
      items: {
        create: [
          {
            productId: prod3.id,
            productSnapshot: JSON.stringify({ id: prod3.id, name: prod3.name, sku: prod3.sku, category: prod3.category }),
            unitPrice: 45.00,
            quantity: 5,
            subtotal: 225.00,
          },
        ],
      },
    },
  });

  console.log('✅ Sales Challans seeded.');
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
