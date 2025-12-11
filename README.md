# Job Tracker API

A RESTful API server for managing job applications, companies, and contacts.

## Prerequisites

- Node.js (v18 or higher)
- pnpm (v10.13.1 or compatible)
- SQLite3 (included with better-sqlite3)

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. (Optional) Create a `.env` file in the project root:
```bash
PORT=3000
DATABASE_PATH=./data/database.db
```

## Database Setup

The server automatically runs migrations on startup. To manually manage the database:

### Run Migrations
```bash
# Run all pending migrations
pnpm run migrate

# Run migrations up
pnpm run migrate:up

# Run migrations down (rollback)
pnpm run migrate:down

# Check migration status
pnpm run migrate:status

# Create a new migration
pnpm run migrate:create

# Reset database (WARNING: deletes all data)
pnpm run migrate:reset

# Validate migrations
pnpm run migrate:validate
```

### Seed Database
```bash
# Seed the database with sample data
pnpm run seed
```

### Reset Database
```bash
# Delete database and recreate with migrations + seed data
pnpm run db:reset
```

## Running the Server

### Development Mode
```bash
# Run with auto-reload on file changes
pnpm run watch

# Or run once
pnpm run dev
```

### Production Mode
```bash
# Build TypeScript
pnpm run build

# Start the server
pnpm start
```

The server will start on `http://localhost:3000` (or the port specified in `PORT` environment variable).

## API Endpoints

### Health Check
```bash
GET /health
```

### Root
```bash
GET /
```
Returns API information and available endpoints.

### Applications
- `GET /applications` - List all job applications
- `GET /applications/:id` - Get a specific application
- `POST /applications` - Create a new application
- `PUT /applications/:id` - Update an application
- `PATCH /applications/:id` - Partially update an application
- `DELETE /applications/:id` - Delete an application

### Companies
- `GET /companies` - List all companies
- `GET /companies/:id` - Get a specific company
- `POST /companies` - Create a new company
- `PUT /companies/:id` - Update a company
- `PATCH /companies/:id` - Partially update a company
- `DELETE /companies/:id` - Delete a company

### Contacts
- `GET /contacts` - List all contacts
- `GET /contacts/:id` - Get a specific contact
- `POST /contacts` - Create a new contact
- `PUT /contacts/:id` - Update a contact
- `PATCH /contacts/:id` - Partially update a contact
- `DELETE /contacts/:id` - Delete a contact

## Authentication

The API requires authentication for all endpoints. Currently, the authentication system supports:

### Testing Mode (Development Only)
For testing purposes, you can use the `user-id` header:
```bash
curl -H "user-id: 1" http://localhost:3000/companies
```

### JWT Authentication
```bash
curl -H "Authorization: Bearer <your-jwt-token>" http://localhost:3000/companies
```

### Session Authentication
```bash
# Via cookie
curl -H "Cookie: session-id=<session-id>" http://localhost:3000/companies

# Via header (for testing)
curl -H "x-session-id: <session-id>" http://localhost:3000/companies
```

**Note:** The current authentication implementation includes placeholder/testing code. For production use, implement proper JWT verification and session management.

## Project Structure

```
job-tracker/
├── src/
│   ├── database/          # Database connection, migrations, repositories
│   ├── middleware/        # Express middleware (auth, error handling)
│   ├── routes/            # API route handlers
│   ├── utils/             # Utility functions
│   ├── validation/        # Input validation
│   └── index.ts           # Server entry point
├── migrations/            # SQL migration files
├── data/                  # Database file location
├── dist/                  # Compiled JavaScript (after build)
└── package.json
```

## Development

### Available Scripts

- `pnpm run dev` - Run server in development mode
- `pnpm run watch` - Run server with auto-reload
- `pnpm run build` - Compile TypeScript to JavaScript
- `pnpm start` - Run compiled server
- `pnpm run migrate` - Run database migrations
- `pnpm run seed` - Seed database with sample data
- `pnpm run db:reset` - Reset database (delete + migrate + seed)

### TypeScript Configuration

The project uses TypeScript with strict type checking. Configuration is in `tsconfig.json`.

## Troubleshooting

### Database Connection Issues
- Ensure the `data/` directory exists and is writable
- Check `DATABASE_PATH` environment variable if using custom path
- Verify SQLite3 is properly installed

### Port Already in Use
- Change the `PORT` environment variable
- Or stop the process using port 3000

### Migration Errors
- Check migration files in `migrations/` directory
- Use `pnpm run migrate:status` to see current state
- Use `pnpm run migrate:validate` to check for issues

## License

ISC


