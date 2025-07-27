const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/projects` : 'http://localhost:3001/api/projects';

import { processProjectAssets } from "./assetService";

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
export const updateProject = async (projectId: string, projectData: Partial<{ title: string; description?: string; items: any; isPublic?: boolean }>) => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    // First, upload the items
    const processedItems = await processProjectAssets(projectData.items, projectId);

    projectData.items = processedItems;

    // Update the project
    const response = await fetch(`${API_URL}/${projectId}`, {
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


 