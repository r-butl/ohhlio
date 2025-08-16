const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

async function migrateAssets() {
  try {
    console.log('Starting asset migration...');
    
    // Get all assets that have URLs instead of keys
    const assets = await prisma.asset.findMany({
      where: {
        filePath: {
          startsWith: 'https://'
        }
      }
    });

    console.log(`Found ${assets.length} assets to migrate`);

    for (const asset of assets) {
      try {
        // Extract S3 key from URL
        // URL format: https://bucket-name.s3.amazonaws.com/key
        const urlParts = asset.filePath.split('.com/');
        if (urlParts.length === 2) {
          const s3Key = urlParts[1];
          
          // Update the asset to store the key instead of URL
          await prisma.asset.update({
            where: { id: asset.id },
            data: { filePath: s3Key }
          });
          
          console.log(`Migrated asset ${asset.id}: ${asset.filename}`);
        } else {
          console.warn(`Could not parse URL for asset ${asset.id}: ${asset.filePath}`);
        }
      } catch (error) {
        console.error(`Failed to migrate asset ${asset.id}:`, error);
      }
    }

    console.log('Asset migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateAssets();
}

module.exports = { migrateAssets };
