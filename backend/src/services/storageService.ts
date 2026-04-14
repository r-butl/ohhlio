import { deleteFileFromS3 } from './s3Service';
const prisma = require('../models/db');

/**
 * Deletes an asset from S3 and removes its database record.
 * Safe to call with any assetId; logs and returns if the asset does not exist.
 */
export const deleteAsset = async (assetId: string): Promise<void> => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      console.log(`Asset ${assetId} not found in database`);
      return;
    }

    // The filePath column stores the S3 key
    const s3Key = asset.filePath;

    // Delete from S3
    await deleteFileFromS3(s3Key);

    // Delete the database record
    await prisma.asset.delete({
      where: { id: assetId },
    });

    console.log(`Deleted asset ${assetId} from database`);
  } catch (error) {
    console.error(`Error deleting asset ${assetId}:`, error);
  }
};
