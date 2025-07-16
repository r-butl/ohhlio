const API_URL = 'http://localhost:3001/api/projects';

// Helper function to get the auth token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('token');
};

interface ProjectData {
    title: string;
    description?: string;
    items: any; // The JSON content of the editor
    isPublic?: boolean;
}

// Create a new project
export const createProject = async (projectData: ProjectData) => {
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
export const updateProject = async (id: string, projectData: Partial<ProjectData>) => {
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