# OmniRambles - Quick Setup Summary

Your specific configuration for reference.

## Services Status

### PostgreSQL (Docker)
- **Container**: `authsample-postgres`
- **Port**: 5432
- **User**: authuser
- **Database**: omnirambles (created alongside authdb)

### Ollama (Docker)
- **Container**: `ollama`
- **Port**: 11435 (note: non-standard port)
- **Model**: llama3.2:3b (~2GB)

### Application
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:5173
- **Mobile Access**: http://192.168.1.156:5173

## Configuration Files

### backend/.env
```env
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=omnirambles
DB_USER=authuser
DB_PASSWORD=authpass

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11435
```

### frontend/vite.config.ts
- Configured with `host: '0.0.0.0'` for network access
- Port: 5173
- API proxy to backend on 3001

## Useful Commands

### Start Development
```bash
# Terminal 1 - Backend
cd ~/Coding/omnirambles/backend
npm run dev

# Terminal 2 - Frontend
cd ~/Coding/omnirambles/frontend
npm run dev
```

### Database Access
```bash
# Access database
docker exec -it authsample-postgres psql -U authuser -d omnirambles

# Common queries
SELECT * FROM notes ORDER BY created_at DESC LIMIT 10;
SELECT * FROM tags;
SELECT n.content, t.name as tag FROM notes n
  JOIN note_tags nt ON n.id = nt.note_id
  JOIN tags t ON nt.tag_id = t.id;
```

### Ollama
```bash
# Check models
docker exec ollama ollama list

# Test AI generation
curl -X POST http://localhost:11435/api/generate \
  -d '{"model": "llama3.2:3b", "prompt": "Hello", "stream": false}'
```

### Check Running Services
```bash
docker ps
# Should see: authsample-postgres and ollama

curl http://localhost:3001/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

## Project Structure
```
omnirambles/
├── backend/
│   ├── src/
│   │   ├── index.ts       # Express server + API routes
│   │   ├── db.ts          # PostgreSQL connection
│   │   ├── notes.ts       # CRUD operations
│   │   ├── ollama.ts      # AI categorization
│   │   └── types.ts       # TypeScript types
│   ├── db/
│   │   └── init.sql       # Database schema
│   ├── .env               # Configuration (not in git)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx        # Main component
│   │   ├── App.css        # Styles (dark theme)
│   │   ├── api.ts         # API client
│   │   ├── types.ts       # TypeScript types
│   │   └── components/
│   │       ├── NoteForm.tsx
│   │       ├── NoteCard.tsx
│   │       └── FilterControls.tsx
│   ├── vite.config.ts     # Vite configuration
│   └── package.json
└── README.md              # Full documentation
```

## Common Issues & Solutions

### "Failed to load notes"
- Check backend is running: `curl http://localhost:3001/api/health`
- Check database connection in backend logs
- Verify .env credentials match PostgreSQL

### AI categorization not working
- Model error: Check `docker exec ollama ollama list` shows llama3.2:3b
- Port error: Verify Ollama port (11435) in backend/.env
- Slow response: Normal, AI tagging takes 2-5 seconds

### Can't access from mobile
- Verify frontend shows Network URL in terminal
- Check firewall allows port 5173
- Use correct IP address (192.168.1.156:5173)

## API Examples

### Create Note
```bash
curl -X POST http://localhost:3001/api/notes \
  -H "Content-Type: application/json" \
  -d '{"content": "Buy groceries: milk, eggs, bread"}'
```

### Get Notes
```bash
# All notes
curl http://localhost:3001/api/notes

# Filter by tags
curl "http://localhost:3001/api/notes?tags=shopping,food"

# Sort oldest first
curl "http://localhost:3001/api/notes?sortOrder=asc"
```

### Get All Tags
```bash
curl http://localhost:3001/api/tags
```

### Delete Note
```bash
curl -X DELETE http://localhost:3001/api/notes/1
```

## Backup & Restore

### Backup Database
```bash
docker exec authsample-postgres pg_dump -U authuser omnirambles > backup.sql
```

### Restore Database
```bash
docker exec -i authsample-postgres psql -U authuser omnirambles < backup.sql
```

## Stopping Services

```bash
# Stop dev servers (Ctrl+C in terminals)

# Services keep running (PostgreSQL, Ollama)
# They're shared with other apps
```
