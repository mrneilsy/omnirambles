# OmniRambles - AI-Powered Note Taking App

A modern note-taking application with AI-powered automatic categorization using Ollama. Take quick notes and let the AI organize them with relevant tags.

## Features

- **Plain Text Notes**: Simple, distraction-free note-taking
- **AI Categorization**: Automatic tagging using Ollama (llama3.2:3b)
- **Smart Filtering**: Filter notes by tags
- **Flexible Sorting**: Sort by creation or update date
- **Mobile Responsive**: Works seamlessly on mobile and desktop
- **Modern Stack**: React + TypeScript + Node.js + PostgreSQL

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Axios

### Backend
- Node.js
- Express
- TypeScript
- PostgreSQL
- Ollama Integration

### Infrastructure
- PostgreSQL (Docker or standalone)
- Ollama (llama3.2:3b)

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL (running locally, in Docker, or remotely)
- Ollama (running locally or in Docker with llama3.2:3b model)

## Quick Start

### 1. Ensure PostgreSQL and Ollama are Running

Make sure you have:
- PostgreSQL running and accessible (Docker, system service, etc.)
- Ollama running with the llama3.2:3b model:
  ```bash
  # If running locally
  ollama pull llama3.2:3b

  # If running in Docker
  docker exec -it <ollama-container> ollama pull llama3.2:3b
  ```

### 2. Set Up Database

**If using standalone PostgreSQL:**

```bash
cd backend/db
./setup.sh
```

Or manually:
```bash
psql -U postgres -c "CREATE DATABASE omnirambles;"
psql -U postgres -d omnirambles -f init.sql
```

**If PostgreSQL is in Docker:**

```bash
# Find your PostgreSQL container name
docker ps | grep postgres

# Create database
docker exec <postgres-container> psql -U <username> -d <existing-db> -c "CREATE DATABASE omnirambles;"

# Load schema
docker exec -i <postgres-container> psql -U <username> -d omnirambles < backend/db/init.sql
```

Example:
```bash
docker exec authsample-postgres psql -U authuser -d authdb -c "CREATE DATABASE omnirambles;"
docker exec -i authsample-postgres psql -U authuser -d omnirambles < backend/db/init.sql
```

### 3. Set Up Backend

```bash
cd backend
npm install
```

Create and configure `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and update your PostgreSQL and Ollama settings:
```
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=omnirambles
DB_USER=your_postgres_user
DB_PASSWORD=your_password

# Ollama Configuration
# Update port if your Ollama runs on a different port
OLLAMA_BASE_URL=http://localhost:11434
```

**Note:** If your Ollama container runs on a different port (check with `docker ps`), update the `OLLAMA_BASE_URL` accordingly.

Start the backend in development mode:

```bash
npm run dev
```

The backend will be available at `http://localhost:3001`

### 4. Set Up Frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

1. Open `http://localhost:5173` in your browser
2. Type a note in the text area
3. Click "Save Note" - the AI will automatically analyze and tag your note
4. Use the filter controls to filter by tags or sort by date
5. Click the trash icon to delete notes

## API Endpoints

### Notes
- `POST /api/notes` - Create a new note (with AI tagging)
- `GET /api/notes` - Get all notes (supports filtering and sorting)
- `GET /api/notes/:id` - Get a specific note
- `PUT /api/notes/:id` - Update a note
- `DELETE /api/notes/:id` - Delete a note

### Tags
- `GET /api/tags` - Get all tags

### Query Parameters for GET /api/notes:
- `tags` - Filter by comma-separated tag names
- `sortBy` - Sort by `created_at` or `updated_at` (default: `created_at`)
- `sortOrder` - `asc` or `desc` (default: `desc`)
- `limit` - Maximum number of notes to return (default: 100)
- `offset` - Number of notes to skip (default: 0)

## Database Schema

### Tables

**notes**
- `id` - Serial primary key
- `content` - Text content of the note
- `created_at` - Timestamp with timezone
- `updated_at` - Timestamp with timezone

**tags**
- `id` - Serial primary key
- `name` - Unique tag name

**note_tags**
- `note_id` - Foreign key to notes
- `tag_id` - Foreign key to tags
- Composite primary key

## Development

### Backend Build

```bash
cd backend
npm run build
npm start
```

### Frontend Build

```bash
cd frontend
npm run build
npm run preview
```

### Database Access

**Standalone PostgreSQL:**
```bash
psql -U postgres -d omnirambles
```

**Docker PostgreSQL:**
```bash
docker exec -it <postgres-container> psql -U <username> -d omnirambles
```

### Ollama Access

**Standalone Ollama:**
```bash
ollama list
```

**Docker Ollama:**
```bash
docker exec -it <ollama-container> ollama list
```

## Troubleshooting

### Ollama Not Responding

If AI categorization isn't working:

1. Check if Ollama is running:
   ```bash
   # Standalone
   ollama list

   # Docker
   docker exec -it <ollama-container> ollama list
   ```

2. Verify the llama3.2:3b model is available:
   ```bash
   # Should show llama3.2:3b in the list
   ollama list

   # If not, pull it
   ollama pull llama3.2:3b
   ```

3. Check Ollama port and test connection:
   ```bash
   # Check which port Ollama is using
   docker ps | grep ollama

   # Test Ollama (adjust port if needed)
   curl http://localhost:11434/api/tags
   ```

4. Update backend/.env if Ollama is on a different port:
   ```
   OLLAMA_BASE_URL=http://localhost:11435  # or whatever port
   ```

### Database Connection Issues

1. Check if PostgreSQL is running:
   ```bash
   # System PostgreSQL
   pg_isready

   # Docker PostgreSQL
   docker ps | grep postgres
   ```

2. Verify database exists:
   ```bash
   # Standalone
   psql -U postgres -l | grep omnirambles

   # Docker
   docker exec <postgres-container> psql -U <username> -l | grep omnirambles
   ```

3. Check credentials in `backend/.env` file match your PostgreSQL setup

4. Test connection:
   ```bash
   # Check backend logs for connection errors
   # Backend should show "✅ Database connected successfully" on startup
   ```

### Port Conflicts

If ports are already in use, modify:
- **Frontend** (default 5173): Change `port` in `frontend/vite.config.ts`
- **Backend** (default 3001): Change `PORT` in `backend/.env`
- **PostgreSQL** (default 5432): If using Docker, modify port mapping
- **Ollama** (default 11434): Update `OLLAMA_BASE_URL` in `backend/.env` if different

## Mobile Access

The app is already configured for mobile/network access!

1. Find your computer's local IP address:
   ```bash
   # Linux
   ip addr show | grep "inet " | grep -v "127.0.0.1"

   # Mac
   ifconfig | grep "inet " | grep -v "127.0.0.1"
   ```

2. Access from your mobile device:
   ```
   http://YOUR_IP:5173
   ```

   Example: `http://192.168.1.156:5173`

**Note:** The `vite.config.ts` is already configured with `host: '0.0.0.0'` to allow network access. Make sure your firewall allows connections on port 5173.

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   Browser   │─────▶│   Frontend  │─────▶│   Backend    │
│ (React UI)  │      │   (Vite)    │      │  (Express)   │
└─────────────┘      └─────────────┘      └──────┬───────┘
                                                  │
                                    ┌─────────────┴──────────┐
                                    │                        │
                              ┌─────▼──────┐        ┌───────▼────┐
                              │ PostgreSQL │        │   Ollama   │
                              │  Database  │        │  (AI Tags) │
                              └────────────┘        └────────────┘
```

## Configuration Notes

### Using Existing PostgreSQL/Ollama Instances

This project is designed to work with existing PostgreSQL and Ollama instances:
- No need for separate Docker Compose setup if you already have these services
- Simply configure the connection details in `backend/.env`
- The app creates its own `omnirambles` database alongside your existing databases
- Uses the llama3.2:3b model (lightweight, ~2GB)

### Performance

- **Ollama Response Time**: AI tagging typically takes 2-5 seconds depending on your hardware
- **Model Size**: llama3.2:3b requires ~2GB RAM
- **Database**: PostgreSQL indexes ensure fast filtering and sorting even with thousands of notes

## Future Enhancements

- [ ] Search notes by content (full-text search)
- [ ] Rich text editing (Markdown support)
- [ ] Note attachments and images
- [ ] Export/import notes (JSON, Markdown)
- [ ] Light theme option (currently dark mode only)
- [ ] PWA support for offline access
- [ ] User authentication and multi-user support
- [ ] Collaborative notes and sharing
- [ ] Note pinning and favorites
- [ ] Customizable AI prompts for tagging

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
