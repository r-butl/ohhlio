import { getAPIURL } from '@/utils/APIutils';
import { handleTokenExpiration } from './authService';

const API_URL = getAPIURL("projects");

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
        if (response.status === 401) {
            handleTokenExpiration();
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create project');
    }

    return response.json();
};

// Update an existing project
export const updateProject = async (projectId: string, projectData: Partial<{ title: string; description?: string; items: any; isPublic?: boolean; headerPhotoId?: string }>) => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    // Only process assets if items are provided
    if (projectData.items !== undefined) {
        const processedItems = await processProjectAssets(projectData.items, projectId);
        projectData.items = processedItems;
    }

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
        if (response.status === 401) {
            handleTokenExpiration();
        }
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
        if (response.status === 401) {
            handleTokenExpiration();
        }
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
        if (response.status === 401) {
            handleTokenExpiration();
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch project');
    }

    return response.json();
};


// Unified project fetch (auth-optional)
export const getUnifiedProjectById = async (id: string) => {
    const token = localStorage.getItem('token');

    const fetchProject = async (withAuth: boolean) => {
        const headers: Record<string, string> = {};
        if (withAuth && token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'GET',
            headers
        });
        return response;
    };

    let response = await fetchProject(Boolean(token));

    if (response.status === 401 && token) {
        handleTokenExpiration();
        response = await fetchProject(false);
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err = new Error(errorData.message || 'Failed to fetch project') as Error & { status: number };
        err.status = response.status;
        throw err;
    }

    return response.json();
};

// (Deprecated public project endpoints removed; use unified endpoints instead)

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
        if (response.status === 401) {
            handleTokenExpiration();
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete project');
    }

    // DELETE requests might not return a body, so we check for that
    if (response.status === 204) {
        return { message: 'Project deleted successfully' };
    }

    return response.json();
};



 