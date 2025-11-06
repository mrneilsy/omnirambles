# OmniRambles - Note Taking App

A modern note-taking application with manual tagging. Take quick notes and organize them with your own tags.

## Features

- **Streamlined Note-Taking Experience**:
  - Three floating action buttons (FABs) for quick access: Filter, Tags, and New Note
  - Full-screen writing mode activates instantly
  - Save/Cancel buttons always visible - no hidden UI
  - Clean, minimal interface - no clutter
  - Distraction-free focus on your content
- **Manual Tagging**: Add tags through an intuitive tag selector modal
- **Version History**: Track all edits with full version history (v1, v2, v3...)
  - Automatically returns to main screen after saving new versions
  - Versions displayed newest to oldest
  - Clean version list without duplicate tag displays
  - Optimized header layout prevents cutoff with growing version numbers
- **Advanced Tag Management**:
  - Comprehensive tag manager with CRUD operations (create, rename, delete)
  - Accessible via FAB button
  - Add/remove tags manually when saving notes
  - Create new tags on-the-fly
  - Browse and reuse existing tags
  - Sort tags alphabetically or by popularity
  - Tag usage counters
  - Clean flyout panels with styled close buttons
- **Smart Filtering**:
  - Filter notes by tags via FAB button
  - Intuitive flyout panel with styled close button
- **Interactive Sort Controls**:
  - Quick toggle between Created/Updated sorting
  - Up/down arrow indicators for sort direction
  - Note count display
- **Compact Note Previews**: Each note shows maximum 4 lines in the list view
- **Mobile Responsive**: Optimized experience on mobile and desktop
- **Modern Stack**: React + TypeScript + Node.js + PostgreSQL
- **Systemd Service**: Run as a production system service
- **Network Access**: Backend configured to accept connections from local network

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

### Infrastructure
- PostgreSQL (Docker or standalone)
- Systemd (optional, for production deployment)

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL (running locally, in Docker, or remotely)

## Quick Start

### 1. Ensure PostgreSQL is Running

Make sure you have PostgreSQL running and accessible (Docker, system service, etc.)

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

Edit `.env` and update your PostgreSQL settings:
```
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=omnirambles
DB_USER=your_postgres_user
DB_PASSWORD=your_password
```

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
   - Network: `http://YOUR_IP:3001` (from mobile devices on same network)

2. **Create a Note**:
   - Click the blue note icon FAB (rightmost floating button)
   - App instantly enters immersive full-screen writing mode
   - Save and Cancel buttons are immediately visible
   - Type your note content in the large text area
   - Click "💾 Save Note" to save (tag selector appears automatically)
   - Click "✕ Cancel" to discard and return to main screen
   - After saving, select or create tags in the modal that appears
   - Click "Save Tags" or "Skip" to return to the main screen

3. **View Your Notes**:
   - Your notes are always visible on the main screen
   - Each note shows up to 4 lines of preview text
   - Use the "Created" or "Updated" buttons to toggle sort order
   - Click a button to reverse the sort direction (up/down arrow shows direction)
   - Note count displays next to sort buttons (e.g., "5 notes")

4. **Edit a Note**:
   - Click any note card to open the editor
   - Modify content and click "Save as New Version" (creates v2, v3, etc.)
   - Automatically returns to main screen after saving
   - View previous versions by clicking version buttons
   - Versions display newest to oldest (latest version first)

5. **Manage Tags**:
   - Click the tag icon FAB (middle floating button)
   - Add new tags with the text input
   - Rename tags by clicking the pencil icon
   - Delete tags by clicking the trash icon
   - Sort tags alphabetically or by popularity
   - View usage count for each tag
   - Or add tags in the note editor with "+ Add Tag"
   - Click the red × button to close the tag manager

6. **Filter Notes**:
   - Click the filter icon FAB (leftmost floating button)
   - Filter by one or more tags
   - Sort by creation or update date (newest/oldest first)
   - Click "Apply Filters" to update the view
   - Click the red × button to close the filter panel

7. **Delete Notes**: Click the trash icon on any note card

## API Endpoints

### Notes
- `POST /api/notes` - Create a new note (creates v1, no tags)
- `GET /api/notes` - Get all notes (supports filtering and sorting)
- `GET /api/notes/:id` - Get a specific note
- `PUT /api/notes/:id` - Update a note (creates new version)
- `DELETE /api/notes/:id` - Delete a note

### Tags
- `GET /api/tags` - Get all tags
- `POST /api/notes/:id/tags` - Add a tag to a note (body: `{tagName, source: 'Self'}`)
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
- `source` - Tag origin: 'Self' (manual tags only)

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

## Troubleshooting

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
   # Development mode
   http://YOUR_IP:5173

   # Production mode (systemd service)
   http://YOUR_IP:3001
   ```

   Example: `http://192.168.1.156:3001`

**Note:**
- The `vite.config.ts` is configured with `host: '0.0.0.0'` for dev server network access
- The backend is configured to listen on `0.0.0.0` for production network access
- Make sure your firewall allows connections on the appropriate port

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   Browser   │─────▶│   Frontend  │─────▶│   Backend    │
│ (React UI)  │      │   (Vite)    │      │  (Express)   │
└─────────────┘      └─────────────┘      └──────┬───────┘
                                                  │
                                                  ▼
                                          ┌─────────────┐
                                          │ PostgreSQL  │
                                          │  Database   │
                                          └─────────────┘
```

## Configuration Notes

### Using Existing PostgreSQL Instances

This project is designed to work with existing PostgreSQL instances:
- No need for separate Docker Compose setup if you already have PostgreSQL
- Simply configure the connection details in `backend/.env`
- The app creates its own `omnirambles` database alongside your existing databases

### Performance

- **Database**: PostgreSQL indexes ensure fast filtering and sorting even with thousands of notes
- **Tag Management**: Manual tagging provides instant response with no AI processing delay

## Past Features (Removed)

### AI-Powered Automatic Categorization (Removed in dev/manual-tagging branch)

**Why it was removed**: The AI auto-tagging feature was creating too many tags automatically, leading to tag proliferation and reduced control over organization.

**What it did**:
- Integrated with Ollama (gpt-oss:120b-cloud or llama3.2:3b models)
- Automatically analyzed note content when saving
- Generated 1-5 relevant tags using AI
- Marked tags with 'AI' source vs 'Self' source
- Visual distinction with blue badges for AI tags, green for manual tags
- Required Ollama installation and configuration

**What replaced it**:
- **Manual Tag Selector Modal**: After saving a note, a modal appears prompting you to add tags
- **Instant Response**: No AI processing delay
- **Full Control**: Only tags you explicitly create are added
- **Simpler Architecture**: No Ollama dependency
- **Tag Creation On-the-Fly**: Create new tags right in the selector
- **Existing Tag Reuse**: Browse and select from all existing tags

**Technical Changes**:
- Removed `ollama.ts` backend module
- Removed `categorizeTags()` function and AI prompting logic
- Changed tag source type from `'AI' | 'Self'` to `'Self'` only
- Removed OLLAMA_BASE_URL configuration
- Removed extraction and keyword fallback logic
- Simplified note creation to not call AI services

**Migration Note**: Existing AI-generated tags in the database remain but can be managed manually. All future tags are manual only.

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

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
