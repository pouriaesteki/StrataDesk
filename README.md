# StrataDesk Backend

A Node.js + Express backend with Prisma ORM for the StrataDesk application.

## Features

- User authentication with JWT
- Role-based access control (Owner, Concierge, Council, StrataManager)
- PostgreSQL database with Prisma ORM
- RESTful API endpoints

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn

## Local Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd stratadesk
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
DATABASE_URL="postgresql://user:password@localhost:5432/stratadesk?schema=public"
JWT_SECRET="your-secret-key-here"
PORT=3000
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

5. Start the development server:
```bash
npm run dev
```

The server will start on http://localhost:3000

## API Endpoints

### Authentication
- POST /auth/register - Register a new user
- POST /auth/login - Login user
- GET /auth/me - Get current user info

## Deployment to Railway

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add the following environment variables in Railway:
   - DATABASE_URL
   - JWT_SECRET
   - PORT

4. Railway will automatically deploy your application when you push to the main branch

## Database Schema

The application uses Prisma with the following models:

- User
  - id: String (UUID)
  - email: String (unique)
  - password: String (hashed)
  - role: UserRole (enum)
  - createdAt: DateTime
  - updatedAt: DateTime

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot reload
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed the database with initial data 