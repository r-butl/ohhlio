# Ohhlio Backend

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ohhlio"

# Upload Configuration
UPLOAD_DIR="./uploads"
UPLOAD_MAX_SIZE=10485760

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Upload Directory Configuration

The `UPLOAD_DIR` environment variable controls where uploaded files are stored:

- **Default**: `./uploads` (relative to project root)
- **Custom**: Set to any absolute or relative path
- **Examples**:
  - `./uploads` - Project root uploads folder
  - `/var/www/uploads` - Absolute path
  - `../shared-uploads` - Relative to project root

### File Storage

Uploaded files are stored in the configured upload directory with unique filenames:
- Format: `{uuid}-{original-filename}`
- Example: `123e4567-e89b-12d3-a456-426614174000-image.jpg`

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and configure
3. Run database migrations: `npx prisma migrate dev`
4. Start the server: `npm run dev` 