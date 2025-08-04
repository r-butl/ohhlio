import { PrismaClient } from '../../generated/prisma';

declare global {
  var prisma: PrismaClient;
}

/**
 * Augment the NodeJS global type to include `prisma`
 */
// @ts-ignore
if (!globalThis.prisma) {
  // @ts-ignore
  globalThis.prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Add connection pooling for serverless
    log: ['query', 'info', 'warn', 'error'],
  });
  
  // Test query when database loads
  async function testConnection() {
    try {
      // Try to count users as a simple test query
      const userCount = await globalThis.prisma.user.count();
      console.log('✅ Database connection successful');
      console.log(`Found ${userCount} users in database`);
    } catch (error) {
      console.error('❌ Database connection failed:', error);
    }
  }

  // Run the test
  testConnection();
}
// @ts-ignore
module.exports = globalThis.prisma;