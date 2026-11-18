import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const senderPassword = await bcrypt.hash('Sender123!', 10);

  // 1. Create Super Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@smarttracker.com' },
    update: {},
    create: {
      email: 'admin@smarttracker.com',
      name: 'Super Admin',
      mobile: '+15550001111',
      passwordHash: adminPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  // 2. Create Sender
  const sender = await prisma.user.upsert({
    where: { email: 'sender@smarttracker.com' },
    update: {},
    create: {
      email: 'sender@smarttracker.com',
      name: 'Sarah Jenkins',
      mobile: '+15552223333',
      passwordHash: senderPassword,
      role: 'SENDER',
      status: 'ACTIVE',
    },
  });

  // 3. Create Default App Settings
  await prisma.appSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      defaultDurationMinutes: 60,
      maxDurationMinutes: 1440,
      locationRetentionDays: 30,
      imageRetentionDays: 90,
      maxFileSizeMb: 10,
      allowQrSharing: true,
      allowWhatsappSharing: true,
      enable2FA: false,
      mapProvider: 'OpenStreetMap',
      privacyPolicyText:
        'Location sharing requires explicit consent. Your position is tracked only when actively permitted and can be stopped at any time.',
    },
  });

  // 4. Create Sample Images
  const sampleImage1 = await prisma.image.create({
    data: {
      userId: sender.id,
      title: 'Project Blueprints & Site Layout',
      description: 'Architectural blueprint for downtown site meeting',
      campaign: 'Site Operations Q3',
      recipientName: 'Michael Scott',
      internalNotes: 'Share for onsite verification',
      fileUrl: '/samples/sample-blueprint.jpg',
      mimeType: 'image/jpeg',
    },
  });

  const sampleImage2 = await prisma.image.create({
    data: {
      userId: sender.id,
      title: 'Delivery Cargo Package Verification',
      description: 'High-value shipment package photo',
      campaign: 'Logistics Tracker',
      recipientName: 'Courier Team',
      internalNotes: 'Verify delivery dropoff coordinates',
      fileUrl: '/samples/sample-delivery.jpg',
      mimeType: 'image/jpeg',
    },
  });

  // 5. Create Sample Tracking Session
  const sampleSession = await prisma.trackingSession.create({
    data: {
      userId: sender.id,
      imageId: sampleImage1.id,
      publicSessionId: 'LOC-A8F4X92',
      secureToken: 'A8F4X92-sample-secure-token-9988',
      recipientLabel: 'Michael Scott (Site Lead)',
      purpose: 'Onsite Construction Inspection',
      durationMinutes: 60,
      status: 'CREATED',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  // 6. Create Initial Audit Log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SYSTEM_SEED',
      entityType: 'System',
      entityId: 'SEED_001',
      details: JSON.stringify({ message: 'Initial seed data populated successfully' }),
    },
  });

  console.log('Database seeded successfully!');
  console.log('Admin: admin@smarttracker.com / Admin123!');
  console.log('Sender: sender@smarttracker.com / Sender123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
