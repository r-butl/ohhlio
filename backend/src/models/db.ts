const { PrismaClient } = require('../generated/prisma/index');

/**
 * Augment the NodeJS global type to include `prisma`
 */
// @ts-ignore
if (!globalThis.prisma) {
  // @ts-ignore
  globalThis.prisma = new PrismaClient();
}
// @ts-ignore
const prisma = globalThis.prisma;
module.exports = prisma;