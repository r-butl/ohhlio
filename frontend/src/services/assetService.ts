const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/assets` : 'http://localhost:3001/api/assets';

// Helper function to get the auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Process project items: upload assets and replace with asset IDs
export const processProjectAssets = async (items: any, projectId?: string) => {
    // Deep copy to avoid immutability issues with Immer
    const processedItems = JSON.parse(JSON.stringify(items));
    
    for (const [itemId, item] of Object.entries(processedItems)) {
        const typedItem = item as any;
        if (typedItem.type === 'image' && typedItem.props.originalImage && !typedItem.props.assetId) {
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
                    continue;
                }
                
                // Upload file
                const asset = await uploadAsset(file, projectId);
                
                // Update item with asset ID
                processedItems[itemId].props.assetId = asset.id;
                processedItems[itemId].props.isUploading = false;
                
                // Remove base64 data after successful upload to reduce payload size
                delete processedItems[itemId].props.originalImage;
                processedItems[itemId].props.isUploaded = true;
                
            } catch (error) {
                console.error('Failed to upload asset:', error);
                processedItems[itemId].props.isUploading = false;
            }
        }
    }
    
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload file');
    }

    return response.json();
};

// Get asset by ID
export const getAssetById = async (id: string) => {
    console.log(`Attempting to grab ${id}`);
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch asset');
    }

    // Get the file as a blob
    const blob = await response.blob();
    
    // Create a blob URL for the file
    const blobUrl = URL.createObjectURL(blob);
    
    console.log('Success grabbing item.');
    return blobUrl;
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete asset');
    }
}; 