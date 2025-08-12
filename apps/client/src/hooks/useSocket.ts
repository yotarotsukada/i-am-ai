import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { RoomState } from '../types';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<'parent' | 'child' | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isUsernameRequested, setIsUsernameRequested] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
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

  const joinRoom = (roomId: string, userName?: string) => {
    if (socket && isConnected) {
      if (userName) {
        // 旧式の直接参加（後方互換性のため）
        console.log('Attempting to join room with username:', { roomId, userName });
        socket.emit('join-room', { roomId });
        // すぐにユーザー名を設定
        setTimeout(() => {
          socket.emit('set-username', { roomId, userName });
        }, 100);
      } else {
        // 新式の匿名参加
        console.log('Attempting to join room anonymously:', { roomId });
        socket.emit('join-room', { roomId });
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

  return {
    socket,
    roomState,
    error,
    userType,
    isConnected,
    isUsernameRequested,
    joinRoom,
    setUsername,
    updateTyping,
    completeMessage,
    setError
  };
};