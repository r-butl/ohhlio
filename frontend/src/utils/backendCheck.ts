import { getAPIURL } from './APIutils';

export interface BackendStatus {
  isConnected: boolean;
  corsWorking: boolean;
  healthStatus: 'ok' | 'error' | 'unknown';
  error?: string;
}

export const checkBackendConnectivity = async (): Promise<BackendStatus> => {
  const baseURL = getAPIURL('').replace('/api', ''); // Get base URL without /api
  
  try {
    // Test basic connectivity
    const pingResponse = await fetch(`${baseURL}/api/ping`);
    const isConnected = pingResponse.ok;
    
    // Test CORS
    const corsResponse = await fetch(`${baseURL}/api/cors-test`);
    const corsWorking = corsResponse.ok;
    
    // Test health endpoint
    const healthResponse = await fetch(`${baseURL}/api/health`);
    const healthStatus = healthResponse.ok ? 'ok' : 'error';
    
    return {
      isConnected,
      corsWorking,
      healthStatus,
    };
  } catch (error) {
    console.error('Backend connectivity check failed:', error);
    return {
      isConnected: false,
      corsWorking: false,
      healthStatus: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

export const testBackendEndpoints = async () => {
  console.log('🔍 Testing backend connectivity...');
  
  const status = await checkBackendConnectivity();
  
  console.log('📊 Backend Status:', status);
  
  if (!status.isConnected) {
    console.error('❌ Backend is not reachable');
    return false;
  }
  
  if (!status.corsWorking) {
    console.error('❌ CORS is not working properly');
    return false;
  }
  
  if (status.healthStatus !== 'ok') {
    console.error('❌ Health check failed');
    return false;
  }
  
  console.log('✅ Backend is working correctly');
  return true;
}; 