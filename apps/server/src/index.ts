import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();
import {
  Room,
  Message,
  UserSession,
  JoinRoomData,
  SetUsernameData,
  UpdateTypingData,
  CompleteMessageData,
  RoomStateData
} from './types';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const rooms = new Map<string, Room>();
const userSocketMap = new Map<string, UserSession>();

function getRoomState(room: Room, forSocketId?: string): RoomStateData {
  const baseRoomState: RoomStateData = {
    roomId: room.id,
    parentUser: room.parentUser,
    childUser: room.childUser,
    currentSender: room.currentSender,
    isRoomFull: !!(room.parentUser && room.childUser),
    completedMessages: room.completedMessages,
    currentUser: undefined
  };

  // 特定のソケットID用の場合、そのユーザーの情報を追加
  if (forSocketId) {
    const userSession = userSocketMap.get(forSocketId);
    if (userSession && userSession.userName) {
      baseRoomState.currentUser = {
        userType: userSession.userType,
        userName: userSession.userName
      };
    }
  }

  return baseRoomState;
}

function broadcastRoomState(roomId: string) {
  const room = rooms.get(roomId);
  if (room) {
    // ルームにいる各ユーザーに個別のroom-stateを送信
    const roomSessions = Array.from(userSocketMap.values()).filter(session => session.roomId === roomId);
    
    roomSessions.forEach(session => {
      const socket = io.sockets.sockets.get(session.socketId);
      if (socket) {
        const roomState = getRoomState(room, session.socketId);
        socket.emit('room-state', roomState);
      }
    });
  }
}

app.post('/api/rooms', (req, res) => {
  const roomId = uuidv4();
  const room: Room = {
    id: roomId,
    parentUser: '', // 空文字列のまま（後でユーザー名を設定）
    currentSender: 'parent',
    completedMessages: []
  };
  rooms.set(roomId, room);
  console.log('Room created:', { roomId, totalRooms: rooms.size });
  
  res.json({ roomId });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json(getRoomState(room));
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (data: JoinRoomData) => {
    const { roomId } = data;
    console.log('Join room request:', { roomId, availableRooms: Array.from(rooms.keys()) });
    const room = rooms.get(roomId);
    
    if (!room) {
      console.log('Room not found:', roomId);
      socket.emit('error', 'Room not found');
      return;
    }
    
    console.log('Room found:', room);

    // 既にこのソケットが登録されているかチェック
    const existingSession = userSocketMap.get(socket.id);
    if (existingSession && existingSession.roomId === roomId) {
      console.log('Socket already registered for this room:', socket.id);
      socket.emit('join-success', {
        userType: existingSession.userType,
        roomId
      });
      socket.emit('request-username');
      return;
    }

    // 現在のルームにいるユーザーセッションを確認
    const roomSessions = Array.from(userSocketMap.values()).filter(session => session.roomId === roomId);
    const parentExists = roomSessions.some(session => session.userType === 'parent');
    const childExists = roomSessions.some(session => session.userType === 'child');
    
    console.log('Room session check:', { parentExists, childExists, totalSessions: roomSessions.length });

    let userType: 'parent' | 'child';
    
    if (!parentExists) {
      userType = 'parent';
      console.log('Assigning as parent user');
    } else if (!childExists) {
      userType = 'child';
      console.log('Assigning as child user');
    } else {
      console.log('Room is full - both parent and child exist');
      socket.emit('error', 'Room is full');
      return;
    }

    console.log('Assigning user type:', userType);

    // 仮登録（ユーザー名未設定）
    const userSession = {
      socketId: socket.id,
      roomId,
      userType,
      userName: undefined
    };
    userSocketMap.set(socket.id, userSession);
    console.log('User session created:', userSession);

    socket.join(roomId);
    
    socket.emit('join-success', {
      userType,
      roomId
    });
    
    // ユーザー名入力を要求
    socket.emit('request-username');
  });

  socket.on('set-username', (data: SetUsernameData) => {
    const { roomId, userName } = data;
    console.log('Set username request:', { roomId, userName, socketId: socket.id });
    const userSession = userSocketMap.get(socket.id);
    console.log('User session:', userSession);
    console.log('Available rooms:', Array.from(rooms.keys()));
    
    if (!userSession || userSession.roomId !== roomId) {
      console.log('Invalid session:', { userSession, requestedRoomId: roomId });
      socket.emit('error', 'Invalid session');
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      console.log('Room not found for set-username:', roomId);
      socket.emit('error', 'Room not found');
      return;
    }
    
    console.log('Setting username successfully:', { roomId, userName, userType: userSession.userType });

    // ユーザー名を設定
    userSession.userName = userName;
    
    if (userSession.userType === 'parent') {
      room.parentUser = userName;
    } else {
      room.childUser = userName;
    }

    socket.emit('username-set', { success: true });
    broadcastRoomState(roomId);
  });

  socket.on('update-typing', (data: UpdateTypingData) => {
    const userSession = userSocketMap.get(socket.id);
    if (!userSession) return;

    const room = rooms.get(userSession.roomId);
    if (!room || room.currentSender !== userSession.userType) return;

    // 既存の未完了メッセージを削除
    room.completedMessages = room.completedMessages.filter(msg => msg.isCompleted);
    
    // 新しい未完了メッセージを追加（空でない場合のみ）
    if (data.currentText.trim()) {
      room.completedMessages.push({
        contentText: data.currentText,
        sender: userSession.userType,
        isCompleted: false
      });
    }
    
    broadcastRoomState(userSession.roomId);
  });

  socket.on('complete-message', (data: CompleteMessageData) => {
    const userSession = userSocketMap.get(socket.id);
    if (!userSession) return;

    const room = rooms.get(userSession.roomId);
    if (!room || room.currentSender !== userSession.userType) return;

    // 未完了メッセージを削除
    room.completedMessages = room.completedMessages.filter(msg => msg.isCompleted);
    
    // 完了メッセージを追加（空でない場合のみ）
    if (data.finalText.trim()) {
      room.completedMessages.push({
        contentText: data.finalText,
        sender: userSession.userType,
        isCompleted: true
      });
    }

    room.currentSender = room.currentSender === 'parent' ? 'child' : 'parent';
    
    broadcastRoomState(userSession.roomId);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const userSession = userSocketMap.get(socket.id);
    console.log('Disconnected user session:', userSession);
    
    if (userSession) {
      const room = rooms.get(userSession.roomId);
      if (room) {
        // ユーザーセッションを削除することで、そのユーザータイプは利用可能になる
        if (userSession.userType === 'parent') {
          room.parentUser = '';
        } else {
          room.childUser = undefined;
        }
        
        if (!room.parentUser && !room.childUser) {
          rooms.delete(userSession.roomId);
        } else {
          broadcastRoomState(userSession.roomId);
        }
      }
      
      userSocketMap.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});