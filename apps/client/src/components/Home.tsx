import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const [roomId, setRoomId] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const createRoom = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('http://localhost:3001/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCreatedRoomId(data.roomId);
      } else {
        alert('Failed to create room');
      }
    } catch (error) {
      alert('Error creating room');
    }
    setIsCreating(false);
  };

  const joinRoom = () => {
    if (roomId.trim()) {
      navigate(`/join/${roomId}`);
    }
  };

  const joinCreatedRoom = () => {
    if (createdRoomId) {
      // サーバー側のルーム作成完了を待つ
      setTimeout(() => {
        navigate(`/join/${createdRoomId}`);
      }, 100);
    }
  };

  const copyRoomUrl = () => {
    const url = `${window.location.origin}/join/${createdRoomId}`;
    navigator.clipboard.writeText(url);
    alert('Room URL copied to clipboard!');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        I Am AI Chat
      </h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Create New Room</h2>
        
        <button
          onClick={createRoom}
          disabled={isCreating}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isCreating ? 'Creating...' : 'Create Room'}
        </button>

        {createdRoomId && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-gray-600 mb-2">Room Created!</p>
            <p className="text-xs text-gray-500 mb-3 break-all">
              Room ID: {createdRoomId}
            </p>
            <div className="flex gap-2">
              <button
                onClick={joinCreatedRoom}
                className="flex-1 bg-green-500 text-white py-2 px-3 rounded-md text-sm hover:bg-green-600"
              >
                Join Room
              </button>
              <button
                onClick={copyRoomUrl}
                className="flex-1 bg-gray-500 text-white py-2 px-3 rounded-md text-sm hover:bg-gray-600"
              >
                Copy URL
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Join Existing Room</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Room ID
          </label>
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter room ID"
          />
        </div>

        <button
          onClick={joinRoom}
          disabled={!roomId.trim()}
          className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Join Room
        </button>
      </div>
    </div>
  );
};

export default Home;