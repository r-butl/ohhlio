// Environment setup for tests
process.env.NODE_ENV = 'test';
process.env.UPLOAD_DIR = './test-uploads';
process.env.PORT = '3002';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'; 