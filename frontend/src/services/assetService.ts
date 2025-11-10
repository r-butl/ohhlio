import { getAPIURL } from '@/utils/APIutils';
import { handleTokenExpiration } from './authService';

const API_URL = getAPIURL("assets");

// Simple in-memory cache for assets
const assetCache = new Map<string, { data: string; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Helper function to get the auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Process project items: upload assets and replace with asset IDs
export const processProjectAssets = async (items: any, projectId?: string) => {
    // Deep copy to avoid immutability issues with Immer
    const processedItems = JSON.parse(JSON.stringify(items));
    
    // Collect all upload promises
    const uploadPromises: Promise<{ itemId: string; asset: any } | null>[] = [];
    
    for (const [itemId, item] of Object.entries(processedItems)) {
        const typedItem = item as any;
        if (typedItem.type === 'image' && typedItem.props.originalImage && !typedItem.props.assetId) {
            // Create upload promise for this item
            const uploadPromise = (async () => {
                try {
                    // Convert base64 to file
                    const base64Data = typedItem.props.originalImage;
                    const mimeType = base64Data.split(',')[0].split(':')[1].split(';')[0];
                    const response = await fetch(base64Data);
                    const blob = await response.blob();

                    // Create file with proper MIME type and size check
                    const file = new File([blob], `image-${itemId}`, { type: mimeType });
                    
                    // Check file size before upload
                    if (file.size > 10 * 1024 * 1024) { // 10MB limit
                        console.warn(`File ${itemId} is too large (${(file.size / 1024 / 1024).toFixed(1)}MB), skipping upload`);
                        return null;
                    }
                    
                    // Upload file
                    const asset = await uploadAsset(file, projectId);
                    
                    return { itemId, asset };
                    
                } catch (error) {
                    console.error(`Failed to upload asset for item ${itemId}:`, error);
                    return null;
                }
            })();
            
            uploadPromises.push(uploadPromise);
        }
    }
    
    // Wait for all uploads to complete in parallel
    const results = await Promise.all(uploadPromises);
    
    // Update processed items with results
    results.forEach(result => {
        if (result) {
            const { itemId, asset } = result;
            processedItems[itemId].props.assetId = asset.id;
            processedItems[itemId].props.isUploading = false;
            
            // Remove base64 data after successful upload to reduce payload size
            delete processedItems[itemId].props.originalImage;
            processedItems[itemId].props.isUploaded = true;
        }
    });
    
    return processedItems;
};


// Upload a file and return asset data
export const uploadAsset = async (file: File, projectId?: string) => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    const formData = new FormData();
    formData.append('file', file);
    if (projectId) {
        formData.append('projectId', projectId);
    }

    const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        if (response.status === 401) {
            handleTokenExpiration();
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to upload file');
    }

    return response.json();
};

// Get asset by ID
export const getAssetById = async (id: string) => {
    console.log(`Attempting to grab ${id}`);
    
    // Check cache first
    const cached = assetCache.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`Cache hit for asset ${id}`);
        return cached.data;
    }
    
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/${id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            handleTokenExpiration();
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch asset');
    }

    // Get the asset data with signed URL
    const assetData = await response.json();
    
    // Cache the result
    assetCache.set(id, {
        data: assetData.filePath,
        timestamp: Date.now()
    });
    
    console.log(`Success grabbing item ${id} and caching it.`);
    return assetData.filePath; // Return the signed URL
};

// Get public asset by ID (no auth)
export const getPublicAssetById = async (id: string) => {
    const { getAPIURL } = await import('@/utils/APIutils');
    const API_URL = getAPIURL('assets');
    const response = await fetch(`${API_URL}/public/${id}`, {
        method: 'GET'
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch public asset');
    }
    const assetData = await response.json();
    // Return the signed URL or path
    return assetData.filePath;
};

// Delete asset
export const deleteAsset = async (id: string): Promise<void> => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            handleTokenExpiration();
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete asset');
    }
    
    // Remove from cache if it exists
    assetCache.delete(id);
};

// Clear the asset cache
export const clearAssetCache = () => {
    assetCache.clear();
    console.log('Asset cache cleared');
};

// Get cache statistics
export const getCacheStats = () => {
    return {
        size: assetCache.size,
        entries: Array.from(assetCache.keys())
    };
}; 