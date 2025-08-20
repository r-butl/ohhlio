import { getAPIURL } from '@/utils/APIutils';


const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Get current user profile
export const getCurrentUser = async () => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }
    const API_URL = getAPIURL("users/profile");

    const response = await fetch(`${API_URL}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch user profile');
    }

    return response.json();
};

// Update user profile
export const updateUserProfile = async (profileData: { profileImageId?: string; description?: string }) => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }
    
    const API_URL = getAPIURL("users/profile");

    const response = await fetch(`${API_URL}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user profile');
    }

    return response.json();
};

// Upload profile image
export const uploadProfileImage = async (file: File) => {
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    const formData = new FormData();
    formData.append('file', file);

    const API_URL = getAPIURL("assets/profile-image")
    const response = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload profile image');
    }

    return response.json();
};
