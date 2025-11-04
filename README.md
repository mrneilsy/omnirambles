# OmniRambles - AI-Powered Note Taking App

A modern note-taking application with AI-powered automatic categorization using Ollama. Take quick notes and let the AI organize them with relevant tags.

## Features

- **Plain Text Notes**: Simple, distraction-free note-taking
- **AI Categorization**: Automatic tagging using Ollama (gpt-oss:120b-cloud)
- **Version History**: Track all edits with full version history (v1, v2, v3...)
- **Enhanced Tag Management**:
  - Add/remove tags manually or via AI
  - Visual distinction between AI-generated (blue) and Self-created (green) tags
  - Browse and reuse existing tags
- **Smart Filtering**: Filter notes by tags
- **Flexible Sorting**: Sort by creation or update date
- **Mobile Responsive**: Works seamlessly on mobile and desktop
- **Modern Stack**: React + TypeScript + Node.js + PostgreSQL
- **Systemd Service**: Run as a production system service

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
- Ollama (gpt-oss:120b-cloud or llama3.2:3b)
- Systemd (optional, for production deployment)

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL (running locally, in Docker, or remotely)
- Ollama (running locally or in Docker with gpt-oss:120b-cloud or llama3.2:3b model)

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

## Production Deployment (Systemd Service)

To run OmniRambles as a system service that starts automatically on boot:

### 1. Build the Applications

```bash
# Build backend
cd backend
npm install
npm run build

# Build frontend
cd ../frontend
npm install
npm run build
```

### 2. Install and Start the Service

The service configuration is already set up to serve both the API and frontend:

```bash
# Install the service
cd /home/neil/Coding/omnirambles
./install-service.sh

# Check service status
sudo systemctl status omnirambles-backend

# View logs
journalctl -u omnirambles-backend -f
```

### 3. Service Management

```bash
# Start service
sudo systemctl start omnirambles-backend

# Stop service
sudo systemctl stop omnirambles-backend

# Restart service (after making changes)
sudo systemctl restart omnirambles-backend

# Or use the convenience script
./restart-service.sh

# Disable auto-start on boot
sudo systemctl disable omnirambles-backend
```

The app will be available at `http://localhost:3001` (backend serves frontend static files).

**Note:** The systemd service runs the backend which serves both the API at `/api/*` and the frontend static files at the root.

## Usage

1. Open the app in your browser:
   - Development: `http://localhost:5173` (frontend dev server)
   - Production: `http://localhost:3001` (systemd service)
2. **Create a Note**: Type in the text area and click "Save Note"
   - AI automatically analyzes and tags your note
3. **Edit a Note**: Click any note card to open the editor
   - Modify content and click "Save as New Version" (creates v2, v3, etc.)
   - View previous versions by clicking version buttons (v1, v2, v3)
4. **Manage Tags**:
   - Click "+ Add Tag" to add tags manually
   - Choose from existing tags or create new ones
   - Tags are marked as "Self" (green) vs AI-generated (blue)
   - Click × to remove tags
5. **Filter & Sort**: Use filter controls to filter by tags or sort by date
6. **Delete Notes**: Click the trash icon on any note card

## API Endpoints

### Notes
- `POST /api/notes` - Create a new note (with AI tagging, creates v1)
- `GET /api/notes` - Get all notes (supports filtering and sorting)
- `GET /api/notes/:id` - Get a specific note
- `PUT /api/notes/:id` - Update a note (creates new version)
- `DELETE /api/notes/:id` - Delete a note

### Tags
- `GET /api/tags` - Get all tags
- `POST /api/notes/:id/tags` - Add a tag to a note (body: `{tagName, source: 'AI'|'Self'}`)
- `DELETE /api/notes/:id/tags/:tagId` - Remove a tag from a note

### Version History
- `GET /api/notes/:id/versions` - Get all versions of a note
- `GET /api/notes/:id/versions/:version` - Get a specific version of a note

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
- `content` - Text content of the note (current version)
- `created_at` - Timestamp with timezone
- `updated_at` - Timestamp with timezone

**tags**
- `id` - Serial primary key
- `name` - Unique tag name (case-insensitive)
- `source` - Tag origin: 'AI' or 'Self'

**note_tags**
- `note_id` - Foreign key to notes
- `tag_id` - Foreign key to tags
- Composite primary key

**note_versions** (Version History)
- `id` - Serial primary key
- `note_id` - Foreign key to notes
- `version` - Version number (1, 2, 3...)
- `content` - Content snapshot at this version
- `created_at` - Timestamp when version was created
- Unique constraint on (note_id, version)

**note_version_tags** (Version-specific tags)
- `note_version_id` - Foreign key to note_versions
- `tag_id` - Foreign key to tags
- Composite primary key

### Migration

If you have an existing database, run the migration to add version history:

```bash
# Docker PostgreSQL
docker exec -i <postgres-container> psql -U <username> -d omnirambles < backend/db/migrate_versions.sql

# Standalone PostgreSQL
psql -U postgres -d omnirambles -f backend/db/migrate_versions.sql
```

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

- [x] ~~Version history tracking~~ ✅ Implemented
- [x] ~~Manual tag management~~ ✅ Implemented
- [x] ~~Systemd service setup~~ ✅ Implemented
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
