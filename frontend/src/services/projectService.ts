import { uploadAsset, getAssetById } from './assetService';

const API_URL = 'http://localhost:3001/api/projects';

const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Create a new project
export const createProject = async (projectData: { title: string; description?: string; items: any; isPublic?: boolean }) => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create project');
    }

    return response.json();
};

// Update an existing project
export const updateProject = async (id: string, projectData: Partial<{ title: string; description?: string; items: any; isPublic?: boolean }>) => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update project');
    }

    return response.json();
};

// Get all projects for the current user
export const getProjects = async () => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch projects');
    }

    return response.json();
};

// Get a single project by its ID
export const getProjectById = async (id: string) => {
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
        throw new Error(errorData.message || 'Failed to fetch project');
    }

    return response.json();
};

// Delete a project by its ID
export const deleteProject = async (id: string) => {
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
        throw new Error(errorData.message || 'Failed to delete project');
    }

    // DELETE requests might not return a body, so we check for that
    if (response.status === 204) {
        return { message: 'Project deleted successfully' };
    }

    return response.json();
};

// Get all public projects (for browsing)
export const getPublicProjects = async () => {
    const response = await fetch(`${API_URL}/public`, {
        method: 'GET',
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch public projects');
    }

    return response.json();
};

// Get a public project by ID (no authentication required)
export const getPublicProjectById = async (id: string) => {
    const response = await fetch(`${API_URL}/public/${id}`, {
        method: 'GET',
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch public project');
    }

    return response.json();
};

// Process project items: upload assets and replace with asset IDs
export const processProjectItems = async (items: any, projectId?: string) => {
    // Deep copy to avoid immutability issues with Immer
    const processedItems = JSON.parse(JSON.stringify(items));
    
    for (const [itemId, item] of Object.entries(processedItems)) {
        const typedItem = item as any;
        if (typedItem.type === 'image' && typedItem.props.originalImage && !typedItem.props.assetId) {
            try {
                // Convert base64 to file
                const base64Data = typedItem.props.originalImage;
                const response = await fetch(base64Data);
                const blob = await response.blob();
                const file = new File([blob], `image-${itemId}.jpg`, { type: 'image/jpeg' });
                
                // Upload file
                const asset = await uploadAsset(file, projectId);
                
                // Update item with asset ID
                processedItems[itemId].props.assetId = asset.id;
                processedItems[itemId].props.isUploading = false;
                
                // Keep originalImage for preview, but remove from props to reduce size
                delete processedItems[itemId].props.originalImage;
                delete processedItems[itemId].props.croppedImage;
            } catch (error) {
                console.error('Failed to upload asset:', error);
                processedItems[itemId].props.isUploading = false;
            }
        }
    }
    
    return processedItems;
};

// Load assets for project items
export const loadProjectAssets = async (items: any, projectId: string) => {
    try {
        const processedItems = { ...items };
        
        for (const [itemId, item] of Object.entries(processedItems)) {
            const typedItem = item as any;
            console.log(`Grabbing asset: ${typedItem.props.assetId}}`)

            if (typedItem.type === 'image' && typedItem.props.assetId) {
                try {
                    const asset = await getAssetById(typedItem.props.assetId);

                    processedItems[itemId].props.assetUrl = `http://localhost:3001${asset.filePath}`;

                } catch (error) {
                    console.error(`Failed to load asset ${typedItem.props.assetId}:`, error);
                }
            }
        }
        
        return processedItems;
    } catch (error) {
        console.error('Failed to load project assets:', error);
        return items;
    }
}; 