import { getAPIURL } from '@/utils/APIutils';
import { handleTokenExpiration } from './authService';

const API_URL = getAPIURL('notes');

const getAuthToken = () => localStorage.getItem('token');

export interface Note {
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export const createNote = async (body: string): Promise<Note> => {
  const token = getAuthToken();
  if (!token) throw new Error('No authentication token found');

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  });

  if (!response.ok) {
    if (response.status === 401) handleTokenExpiration();
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create note');
  }

  return response.json();
};

export const getNotes = async (): Promise<Note[]> => {
  const token = getAuthToken();
  if (!token) throw new Error('No authentication token found');

  const response = await fetch(API_URL, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    if (response.status === 401) handleTokenExpiration();
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch notes');
  }

  return response.json();
};

export const deleteNote = async (id: string): Promise<void> => {
  const token = getAuthToken();
  if (!token) throw new Error('No authentication token found');

  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    if (response.status === 401) handleTokenExpiration();
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete note');
  }
};
