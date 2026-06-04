const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

function extractAssetIds(items) {
  const ids = [];
  if (!items || typeof items !== 'object') return ids;
  Object.values(items).forEach((item) => {
    if (item?.props?.assetId) ids.push(item.props.assetId);
  });
  return ids;
}

async function backfill() {
  try {
    console.log('Starting ProjectAsset backfill...');

    const projects = await prisma.project.findMany({
      select: { id: true, items: true },
    });

    console.log(`Found ${projects.length} projects to process.`);

    let linked = 0;
    let skipped = 0;

    for (const project of projects) {
      const assetIds = extractAssetIds(project.items);

      if (assetIds.length === 0) {
        skipped++;
        continue;
      }

      // Verify all assetIds exist before linking (guard against stale JSON)
      const existingAssets = await prisma.asset.findMany({
        where: { id: { in: assetIds } },
        select: { id: true },
      });
      const validIds = existingAssets.map((a) => a.id);

      await prisma.projectAsset.deleteMany({ where: { projectId: project.id } });

      if (validIds.length > 0) {
        await prisma.projectAsset.createMany({
          data: validIds.map((assetId) => ({ projectId: project.id, assetId })),
          skipDuplicates: true,
        });
      }

      console.log(`  Project ${project.id}: linked ${validIds.length} asset(s) (${assetIds.length - validIds.length} stale IDs skipped)`);
      linked += validIds.length;
    }

    console.log(`\nDone. ${linked} ProjectAsset row(s) created across ${projects.length - skipped} project(s).`);
  } catch (error) {
    console.error('Backfill failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backfill();
