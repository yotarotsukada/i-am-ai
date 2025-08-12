# I Am AI - Real-time Chat Application

A real-time chat application where users take turns sending messages with live typing indicators.

## Features

- **Room Creation**: Create rooms with unique UUIDs
- **Room Joining**: Join existing rooms via URL or room ID
- **Real-time Typing**: See what the other person is typing in real-time
- **Turn-based Messaging**: Users alternate between sending and receiving modes
- **Message History**: View completed messages in chronological order
- **Connection Management**: Automatic cleanup when users disconnect

## Architecture

- **Monorepo**: Turborepo for efficient build and development workflows
- **Frontend**: React + TypeScript + Tailwind CSS + React Router
- **Backend**: Node.js + Express + Socket.io
- **Real-time Communication**: WebSocket connections via Socket.io
- **State Management**: Server-authoritative state with client synchronization

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository and install dependencies:

```bash
# Install all dependencies using npm workspaces
npm install
```

### Running the Application

1. Start both server and client in development mode using Turborepo:

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend client on `http://localhost:3000`

### Other Commands

```bash
# Build all apps
npm run build

# Type check all apps
npm run type-check

# Lint all apps
npm run lint

# Clean all build artifacts
npm run clean
```

### Usage

1. **Create a Room**:
   - Go to `http://localhost:3000`
   - Enter your name
   - Click "Create Room"
   - Share the generated room URL with another person

2. **Join a Room**:
   - Use the shared room URL, or
   - Enter the room ID and your name on the home page
   - Click "Join Room"

3. **Chat**:
   - The room creator starts in "sending mode"
   - Type in the text area - the other person sees your typing in real-time
   - Click "Complete Message" to finish your message and switch turns
   - The other person can now type their response

## API Endpoints

### REST API

- `POST /api/rooms` - Create a new room
- `GET /api/rooms/:roomId` - Get room state

### WebSocket Events

#### Client → Server
- `join-room` - Join a room with username
- `update-typing` - Send real-time typing updates
- `complete-message` - Complete and send a message

#### Server → Client
- `room-state` - Room state updates
- `typing` - Real-time typing data from other user
- `error` - Error messages

## Project Structure

```
i-am-ai/                    # Turborepo monorepo root
├── apps/                   # Applications
│   ├── server/            # Backend Node.js application
│   │   ├── src/
│   │   │   ├── index.ts   # Main server file
│   │   │   └── types.ts   # TypeScript type definitions
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── client/            # Frontend React application
│       ├── src/
│       │   ├── components/ # React components
│       │   ├── hooks/     # Custom React hooks
│       │   ├── types.ts   # TypeScript type definitions
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── package.json
│       └── vite.config.ts
├── packages/              # Shared packages (future use)
├── turbo.json            # Turborepo configuration
├── package.json          # Root package.json with workspaces
└── README.md
```

## Technical Details

### State Management

The application uses a server-authoritative architecture:
- Server maintains the single source of truth for all room states
- Clients send action requests to the server
- Server validates requests and broadcasts state updates to all connected clients

### Real-time Communication

- WebSocket connections via Socket.io for low-latency communication
- Typing updates are sent character-by-character in real-time
- Message completion triggers mode switching between users

### Room Management

- Rooms support exactly 2 users (parent + child)
- Parent user is the room creator, child user joins via URL/ID
- Rooms are automatically cleaned up when all users disconnect
- UUIDs ensure unique room identification

## Deployment

For production deployment, consider:
- Using PostgreSQL instead of in-memory storage
- Setting up proper environment variables
- Using a WebSocket-capable hosting service (Railway, Render, etc.)
- Configuring CORS for your production domain

## License

MIT