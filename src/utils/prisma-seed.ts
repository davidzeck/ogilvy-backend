/**
 * Prisma Seed Script
 * Seeds the database using Prisma ORM for proper date handling
 */

import { prisma } from './prisma';
import logger from './logger';

export const seedWithPrisma = async (): Promise<void> => {
  try {
    // Check if data already exists
    const branchCount = await prisma.branch.count();

    if (branchCount > 0) {
      logger.info('Database already contains data, skipping seed');
      return;
    }

    logger.info('Seeding database with Prisma...');

    // Create branches
    const branches = await Promise.all([
      prisma.branch.create({ data: { name: 'Nairobi' } }),
      prisma.branch.create({ data: { name: 'Mombasa' } }),
      prisma.branch.create({ data: { name: 'Kisumu' } }),
      prisma.branch.create({ data: { name: 'Eldoret' } }),
    ]);

    logger.info(`Created ${branches.length} branches`);

    // Create agents
    const agents = await Promise.all([
      prisma.agent.create({ data: { name: 'Jane Doe', branchId: branches[0].id, email: 'jane.doe@example.com' } }),
      prisma.agent.create({ data: { name: 'John Smith', branchId: branches[0].id, email: 'john.smith@example.com' } }),
      prisma.agent.create({ data: { name: 'Alice Johnson', branchId: branches[1].id, email: 'alice.johnson@example.com' } }),
      prisma.agent.create({ data: { name: 'Bob Williams', branchId: branches[1].id, email: 'bob.williams@example.com' } }),
      prisma.agent.create({ data: { name: 'Charlie Brown', branchId: branches[2].id, email: 'charlie.brown@example.com' } }),
    ]);

    logger.info(`Created ${agents.length} agents`);

    // Generate sample leads
    const now = new Date();
    const statuses = ['Open', 'Closed', 'Product/Service Sold', 'To Callback Later'];
    const products = ['Insurance', 'Loan', 'Investment', 'Savings'];
    const segments = ['Premium', 'Standard', 'Basic'];
    const campaigns = ['Summer Campaign', 'Winter Campaign', 'Spring Campaign'];

    const leadsData = [];
    for (let i = 0; i < 500; i++) {
      const daysAgo = Math.floor(Math.random() * 90);
      const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const contactedAt = status !== 'Open' ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null;
      const convertedAt = status === 'Product/Service Sold' && contactedAt ? new Date(contactedAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000) : null;

      leadsData.push({
        branchId: branches[Math.floor(Math.random() * branches.length)].id,
        agentId: agents[Math.floor(Math.random() * agents.length)].id,
        status,
        product: products[Math.floor(Math.random() * products.length)],
        segment: segments[Math.floor(Math.random() * segments.length)],
        campaign: campaigns[Math.floor(Math.random() * campaigns.length)],
        revenue: status === 'Product/Service Sold' ? Math.floor(Math.random() * 100000) + 10000 : 0,
        createdAt,
        contactedAt,
        convertedAt,
      });
    }

    // Insert leads in batches of 100 for better performance
    for (let i = 0; i < leadsData.length; i += 100) {
      const batch = leadsData.slice(i, i + 100);
      await prisma.lead.createMany({
        data: batch,
      });
      logger.info(`Inserted leads ${i + 1}-${Math.min(i + 100, leadsData.length)}`);
    }

    logger.info(`Database seeded successfully with ${leadsData.length} leads`);
  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  seedWithPrisma()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
