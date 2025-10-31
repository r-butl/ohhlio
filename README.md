# Ohhlio - Portfolio Creator Platform

A full-stack web application for creating and sharing digital portfolios with a drag-and-drop editor interface.

## Architecture Overview

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **File Storage**: AWS S3
- **Authentication**: JWT tokens
- **State Management**: Zustand + Immer
- **UI**: Tailwind CSS + Radix UI components
- **Deployment**: Docker + Vercel

### Project Structure

```
ohhlio/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/    # Business logic handlers
│   │   ├── middleware/      # Auth & validation
│   │   ├── models/         # Database models
│   │   ├── services/       # External services (S3)
│   │   └── utils/          # JWT utilities
│   ├── api/                # Route definitions
│   ├── prisma/             # Database schema & migrations
│   └── generated/           # Prisma client
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React contexts (Auth, User, Editor)
│   │   ├── pages/          # Route components
│   │   ├── services/       # API service layer
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Utility functions
│   └── dist/               # Built assets
└── docker-compose.yml      # Development environment
```

## Core Features

### 1. User Management
- **Authentication**: JWT-based login/register
- **Profile Management**: Avatar upload, description editing
- **Public Profiles**: View other users' portfolios

### 2. Project Editor
- **Drag-and-Drop Interface**: Grid-based layout system
- **Content Types**: Text blocks and image uploads
- **Real-time Editing**: Live preview with undo/redo
- **Asset Management**: File uploads with S3 integration

### 3. Portfolio Display
- **Public Viewing**: Shareable portfolio URLs
- **Responsive Design**: Mobile-optimized layouts
- **Project Cards**: Visual project previews

## Database Schema

### Core Models
- **User**: Authentication, profile data, relationships
- **Project**: Portfolio projects with JSON content items
- **Asset**: File metadata and S3 references

### Key Relationships
- User → Projects (1:many)
- User → Assets (1:many)
- Project → Assets (1:many, via JSON items)

## API Architecture

### Backend Routes
- `/api/auth` - Authentication endpoints
- `/api/users` - User profile management
- `/api/projects` - Project CRUD operations
- `/api/assets` - File upload/download

### Authentication Flow
1. User registers/logs in
2. JWT token stored in localStorage
3. Protected routes require Bearer token
4. Public routes accessible without auth

## Frontend Architecture

### State Management
- **Zustand Store**: Global application state
- **Immer Integration**: Immutable state updates
- **History System**: Undo/redo functionality

### Key Components
- **EditorController**: Main editing interface
- **ProjectInfo**: Project metadata management
- **FileUploadBox**: Asset upload handling
- **ProfileOverview**: User portfolio display

### Context Providers
- **AuthContext**: User authentication state
- **UserContext**: Profile data management
- **EditorStore**: Project editing state

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL
- AWS S3 account (for file storage)

### Local Development
```bash
# Start all services
docker-compose up

# Or run individually
cd backend && npm run dev
cd frontend && npm run dev
```

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection
- `JWT_SECRET`: Token signing key
- `AWS_*`: S3 configuration
- `UPLOAD_DIR`: Local file storage path

## Deployment

### Production Build
- Backend: TypeScript compilation to `dist/`
- Frontend: Vite build to `dist/`
- Database: Prisma migrations
- File Storage: AWS S3 integration

### Vercel Configuration
- Serverless functions for API routes
- Static site hosting for frontend
- Environment variable management

## Key Design Decisions

1. **Simplified Architecture**: Monolithic structure for easier maintenance
2. **JSON Content Storage**: Flexible project content in database
3. **Asset Management**: S3 integration with signed URLs for security
4. **Public/Private Routes**: Unauthenticated portfolio viewing
5. **Mobile-First**: Responsive design with mobile optimizations

## Complexity Assessment

**Low-Medium Complexity**:
- Straightforward CRUD operations
- Standard authentication patterns
- Simple state management
- Well-structured component hierarchy
- Clear separation of concerns

The codebase follows modern React patterns with a clean backend API, making it maintainable and scalable for a portfolio creation platform.
