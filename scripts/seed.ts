import { PrismaClient, SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Sample users with different subscription tiers
const users = [
  {
    email: 'free@example.com',
    name: 'Free User',
    password: 'password123',
    subscriptionTier: SubscriptionTier.FREE,
  },
  {
    email: 'pro@example.com',
    name: 'Pro User',
    password: 'password123',
    subscriptionTier: SubscriptionTier.PRO,
    subscriptionStatus: SubscriptionStatus.active,
  },
  {
    email: 'family@example.com',
    name: 'Family User',
    password: 'password123',
    subscriptionTier: SubscriptionTier.FAMILY,
    subscriptionStatus: SubscriptionStatus.active,
  },
  {
    email: 'dealer@example.com',
    name: 'Dealer User',
    password: 'password123',
    subscriptionTier: SubscriptionTier.DEALER,
    subscriptionStatus: SubscriptionStatus.active,
  },
];

// Sample vehicles with real VINs
const vehicles = [
  {
    vin: '1HGBH41JXMN109186',
    make: 'Honda',
    model: 'Accord',
    year: 2021,
    trim: 'Sport',
    nickname: 'Daily Driver',
  },
  {
    vin: '1FA6P8TH5L5100001',
    make: 'Ford',
    model: 'Mustang',
    year: 2020,
    trim: 'GT',
    nickname: 'Weekend Warrior',
  },
  {
    vin: '5YJSA1E26MF000001',
    make: 'Tesla',
    model: 'Model S',
    year: 2021,
    trim: 'Long Range',
    nickname: 'Electric Dream',
  },
  {
    vin: 'WVWZZZ3CZWE000001',
    make: 'Volkswagen',
    model: 'Golf',
    year: 2022,
    trim: 'GTI',
    nickname: 'Hot Hatch',
  },
  {
    vin: 'JN1TANT31U0000001',
    make: 'Nissan',
    model: 'Altima',
    year: 2020,
    trim: 'SR',
  },
];

// Sample chat sessions and messages
const chatTemplates = [
  {
    title: 'Check engine light question',
    messages: [
      { role: 'user', content: 'My check engine light came on. What should I do?' },
      {
        role: 'assistant',
        content:
          "I understand that can be concerning! A check engine light can indicate various issues from minor to serious. Here's what I recommend:\n\n1. **Check for obvious issues** - Make sure your gas cap is tight\n2. **Note any symptoms** - Is the car running differently?\n3. **Get the code read** - Most auto parts stores offer free OBD-II scanning\n\nWould you like me to help you understand what specific code you're seeing, or would you like me to find a nearby shop that can diagnose it?",
      },
      { role: 'user', content: 'The code is P0420. What does that mean?' },
      {
        role: 'assistant',
        content:
          "P0420 is one of the most common codes - it means 'Catalyst System Efficiency Below Threshold (Bank 1)'\n\n**What it means:**\nYour car's catalytic converter isn't working as efficiently as it should.\n\n**Common causes:**\n- Failing catalytic converter (most common)\n- Oxygen sensor issues\n- Exhaust leaks\n- Engine misfires\n\n**Estimated repair costs:**\n- Catalytic converter replacement: $500-$2,500\n- Oxygen sensor: $150-$500\n- Exhaust repair: $100-$500\n\nWould you like me to help you find a trusted repair shop nearby, or do you have any other questions about this code?",
      },
    ],
  },
  {
    title: 'Maintenance schedule inquiry',
    messages: [
      { role: 'user', content: 'When should I change my oil?' },
      {
        role: 'assistant',
        content:
          "Great question! Oil change intervals depend on several factors:\n\n**For your vehicle, I recommend:**\n- **Conventional oil:** Every 3,000-5,000 miles\n- **Synthetic oil:** Every 7,500-10,000 miles\n- **Full synthetic:** Up to 15,000 miles (check manufacturer specs)\n\n**Signs you need an oil change:**\n- Dark, gritty oil on the dipstick\n- Oil change light illuminated\n- Engine running louder than usual\n- Decreased fuel efficiency\n\nWhen was your last oil change? I can help you set up a maintenance schedule.",
      },
    ],
  },
];

async function seed() {
  console.log('🌱 Starting seed...\n');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.diagnosticSession.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.vinLookup.deleteMany();
  await prisma.subscriptionEvent.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log('\nCreating users...');
  const createdUsers = [];
  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        passwordHash: hashedPassword,
        subscriptionTier: userData.subscriptionTier,
        subscriptionStatus: userData.subscriptionStatus,
        emailVerified: true,
        preferences: {
          emailNotifications: true,
          recallNotifications: true,
          maintenanceReminders: true,
          theme: 'system',
        },
        usageData: {
          questionsAsked: Math.floor(Math.random() * 20),
          vinLookups: Math.floor(Math.random() * 10),
          diagnosticSessions: Math.floor(Math.random() * 5),
          imageAnalyses: Math.floor(Math.random() * 3),
        },
      },
    });
    createdUsers.push(user);
    console.log(`  ✓ Created user: ${user.email} (${user.subscriptionTier})`);
  }

  // Create vehicles for users
  console.log('\nCreating vehicles...');
  const vehicleAssignments = [
    { userIndex: 0, vehicleIndices: [0] }, // Free user gets 1 vehicle
    { userIndex: 1, vehicleIndices: [1, 2] }, // Pro user gets 2 vehicles
    { userIndex: 2, vehicleIndices: [3, 4] }, // Family user gets 2 vehicles
    { userIndex: 3, vehicleIndices: [0, 1, 2, 3, 4] }, // Dealer gets all vehicles
  ];

  const createdVehicles: any[] = [];
  for (const assignment of vehicleAssignments) {
    const user = createdUsers[assignment.userIndex];
    for (const vehicleIndex of assignment.vehicleIndices) {
      const vehicleData = vehicles[vehicleIndex];
      const vehicle = await prisma.vehicle.create({
        data: {
          ...vehicleData,
          userId: user.id,
          specifications: {
            engine: '2.0L 4-Cylinder',
            transmission: 'Automatic',
            driveType: 'FWD',
            fuelType: 'Gasoline',
          },
          recallData: {
            recalls: [],
            lastChecked: new Date().toISOString(),
          },
        },
      });
      createdVehicles.push({ vehicle, user });
      console.log(`  ✓ Created vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model} for ${user.name}`);
    }
  }

  // Create chat sessions and messages
  console.log('\nCreating chat sessions...');
  for (let i = 0; i < Math.min(createdVehicles.length, chatTemplates.length); i++) {
    const { vehicle, user } = createdVehicles[i];
    const template = chatTemplates[i];

    const session = await prisma.chatSession.create({
      data: {
        userId: user.id,
        vehicleId: vehicle.id,
        title: template.title,
        messageCount: template.messages.length,
      },
    });

    for (const msg of template.messages) {
      await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        },
      });
    }

    console.log(`  ✓ Created chat session: "${template.title}" with ${template.messages.length} messages`);
  }

  // Create some VIN lookups
  console.log('\nCreating VIN lookups...');
  for (const { vehicle, user } of createdVehicles.slice(0, 3)) {
    await prisma.vinLookup.create({
      data: {
        vin: vehicle.vin,
        userId: user.id,
        source: 'api',
        decodedData: {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          trim: vehicle.trim,
        },
      },
    });
    console.log(`  ✓ Created VIN lookup for ${vehicle.vin}`);
  }

  // Create maintenance records
  console.log('\nCreating maintenance records...');
  const maintenanceTypes = [
    { type: 'oil_change', description: 'Full synthetic oil change', cost: 75 },
    { type: 'tire_rotation', description: 'Tire rotation and balance', cost: 50 },
    { type: 'brake_service', description: 'Front brake pad replacement', cost: 350 },
    { type: 'air_filter', description: 'Engine air filter replacement', cost: 30 },
  ];

  for (const { vehicle } of createdVehicles.slice(0, 4)) {
    const maintenance = maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)];
    await prisma.maintenanceRecord.create({
      data: {
        vehicleId: vehicle.id,
        type: maintenance.type,
        description: maintenance.description,
        cost: maintenance.cost,
        mileage: 25000 + Math.floor(Math.random() * 50000),
        serviceDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000), // Random date in last 6 months
      },
    });
    console.log(`  ✓ Created maintenance record: ${maintenance.description} for ${vehicle.year} ${vehicle.make}`);
  }

  console.log('\n✅ Seed completed successfully!\n');
  console.log('Test accounts:');
  console.log('  free@example.com / password123 (Free tier)');
  console.log('  pro@example.com / password123 (Pro tier)');
  console.log('  family@example.com / password123 (Family tier)');
  console.log('  dealer@example.com / password123 (Dealer tier)');
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
