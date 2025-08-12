import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { RoomState } from '../types';

interface SocketContextType {
  socket: Socket | null;
  roomState: RoomState | null;
  error: string | null;
  userType: 'parent' | 'child' | null;
  isConnected: boolean;
  isUsernameRequested: boolean;
  isUsernameSet: boolean;
  joinRoom: (roomId: string, userName?: string) => void;
  setUsername: (roomId: string, userName: string) => Promise<void>;
  updateTyping: (roomId: string, currentText: string) => void;
  completeMessage: (roomId: string, finalText: string) => void;
  setError: (error: string | null) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<'parent' | 'child' | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isUsernameRequested, setIsUsernameRequested] = useState(false);
  const [isUsernameSet, setIsUsernameSet] = useState(false);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('WebSocket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('room-state', (data: RoomState) => {
      console.log('Received room-state:', data);
      setRoomState(data);
    });

    newSocket.on('join-success', (data: { userType: 'parent' | 'child', roomId: string }) => {
      console.log('Received join-success:', data);
      setUserType(data.userType);
    });

    newSocket.on('request-username', () => {
      console.log('Username requested by server');
      setIsUsernameRequested(true);
    });

    newSocket.on('username-set', (data: { success: boolean }) => {
      console.log('Username set result:', data);
      if (data.success) {
        setIsUsernameRequested(false);
        setIsUsernameSet(true);
      }
    });

    newSocket.on('error', (errorMessage: string) => {
      console.log('WebSocket error:', errorMessage);
      setError(errorMessage);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);

  const joinRoom = (roomId: string, userName?: string) => {
    if (socket && isConnected) {
      // 重複参加を防ぐ
      if (joinedRoomId === roomId && userType) {
        console.log('Already joined this room:', { roomId, userType });
        return;
      }

      if (userName) {
        // 旧式の直接参加（後方互換性のため）
        console.log('Attempting to join room with username:', { roomId, userName });
        socket.emit('join-room', { roomId });
        setJoinedRoomId(roomId);
        // すぐにユーザー名を設定
        setTimeout(() => {
          socket.emit('set-username', { roomId, userName });
        }, 100);
      } else {
        // 新式の匿名参加
        console.log('Attempting to join room anonymously:', { roomId });
        socket.emit('join-room', { roomId });
        setJoinedRoomId(roomId);
      }
    } else {
      console.log('Socket not connected when trying to join room', { socket: !!socket, isConnected });
    }
  };

  const setUsername = (roomId: string, userName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (socket && isConnected) {
        console.log('Setting username:', { roomId, userName });
        
        const handleUsernameSet = (data: { success: boolean }) => {
          socket.off('username-set', handleUsernameSet);
          socket.off('error', handleError);
          
          if (data.success) {
            resolve();
          } else {
            reject(new Error('Failed to set username'));
          }
        };
        
        const handleError = (errorMessage: string) => {
          socket.off('username-set', handleUsernameSet);
          socket.off('error', handleError);
          reject(new Error(errorMessage));
        };
        
        socket.on('username-set', handleUsernameSet);
        socket.on('error', handleError);
        socket.emit('set-username', { roomId, userName });
      } else {
        reject(new Error('Socket not connected'));
      }
    });
  };

  const updateTyping = (roomId: string, currentText: string) => {
    if (socket) {
      socket.emit('update-typing', { roomId, currentText });
    }
  };

  const completeMessage = (roomId: string, finalText: string) => {
    if (socket) {
      socket.emit('complete-message', { roomId, finalText });
    }
  };

  const value: SocketContextType = {
    socket,
    roomState,
    error,
    userType,
    isConnected,
    isUsernameRequested,
    isUsernameSet,
    joinRoom,
    setUsername,
    updateTyping,
    completeMessage,
    setError
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};