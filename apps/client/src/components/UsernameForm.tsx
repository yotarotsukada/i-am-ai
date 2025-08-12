import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const UsernameForm: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roomExists, setRoomExists] = useState<boolean | null>(null);
  
  const {
    error,
    isConnected,
    userType,
    joinRoom,
    setUsername: setSocketUsername,
    setError
  } = useSocket();

  // ルームの存在確認
  useEffect(() => {
    const checkRoom = async () => {
      if (roomId) {
        try {
          const response = await fetch(`http://localhost:3001/api/rooms/${roomId}`);
          if (response.ok) {
            setRoomExists(true);
          } else {
            setRoomExists(false);
          }
        } catch (error) {
          console.error('Failed to check room:', error);
          setRoomExists(false);
        }
      }
    };

    checkRoom();
  }, [roomId]);

  useEffect(() => {
    // ルームが存在する場合のみ匿名で参加
    if (roomId && isConnected && !userType && roomExists === true) {
      console.log('Attempting to join room:', roomId);
      joinRoom(roomId);
    }
  }, [roomId, isConnected, userType, joinRoom, roomExists]);

  useEffect(() => {
    if (error) {
      alert(error);
      setError(null);
      navigate('/');
    }
  }, [error, navigate, setError]);

  useEffect(() => {
    if (roomExists === false) {
      alert('Room not found. Please check the room ID.');
      navigate('/');
    }
  }, [roomExists, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !roomId) return;
    
    setIsSubmitting(true);
    try {
      console.log('Submitting username:', { roomId, username: username.trim() });
      await setSocketUsername(roomId, username.trim());
      console.log('Username set successfully, navigating to room');
      // ユーザー名設定が成功したらチャット画面に遷移
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error('Failed to set username:', error);
      alert(`Failed to set username: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected || roomExists === null) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {!isConnected ? 'Connecting to server...' : 'Checking room...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Enter Username
          </h1>
          <p className="text-gray-600">
            You're joining room: <span className="font-mono text-sm">{roomId}</span>
          </p>
          {userType && (
            <p className="text-sm text-blue-600 mt-1">
              Role: {userType === 'parent' ? 'Room Creator' : 'Participant'}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={50}
              required
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={!username.trim() || isSubmitting}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Setting Username...' : 'Enter Chat'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-700 text-sm"
            disabled={isSubmitting}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsernameForm;