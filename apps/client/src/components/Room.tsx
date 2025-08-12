import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";

const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const {
    roomState,
    error,
    isConnected,
    isUsernameSet,
    updateTyping,
    completeMessage,
    setError,
  } = useSocket();

  const [currentMessage, setCurrentMessage] = useState("");

  useEffect(() => {
    // ルームに参加していない場合、ユーザー名入力画面にリダイレクト
    // ただし、ユーザー名を設定したばかりの場合（isUsernameSet=true）はリダイレクトしない
    if (roomId && roomState && !roomState.currentUser && isConnected && !isUsernameSet) {
      console.log('Redirecting to join page - no current user in room state');
      navigate(`/join/${roomId}`);
    }
  }, [roomId, roomState, isConnected, isUsernameSet, navigate]);

  useEffect(() => {
    if (error) {
      alert(error);
      setError(null);
      navigate("/");
    }
  }, [error, navigate, setError]);

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCurrentMessage(text);

    if (roomId && roomState && roomState.currentUser?.userType === roomState.currentSender) {
      updateTyping(roomId, text);
    }
  };

  const handleCompleteMessage = () => {
    if (roomId && currentMessage.trim()) {
      completeMessage(roomId, currentMessage);
      setCurrentMessage("");
    }
  };

  if (!roomState) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Connecting to room...</p>
        </div>
      </div>
    );
  }

  const isMyTurn = roomState.currentUser?.userType === roomState.currentSender;
  const otherUserName =
    roomState.currentUser?.userType === "parent" ? roomState.childUser : roomState.parentUser;
  const currentUserName = roomState.currentUser?.userName;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Chat Room</h1>
          <div className="text-sm text-gray-600">
            <p>
              You: {currentUserName} ({roomState.currentUser?.userType})
            </p>
            {otherUserName && <p>Other: {otherUserName}</p>}
            {!roomState.isRoomFull && (
              <p className="text-orange-500">Waiting for other user...</p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            Message History
          </h3>
          <div className="bg-gray-50 rounded-md p-4 h-64 overflow-y-auto">
            {roomState.completedMessages.length === 0 ? (
              <p className="text-gray-500 text-center">No messages yet</p>
            ) : (
              <div className="space-y-3">
                {roomState.completedMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.sender === roomState.currentUser?.userType
                        ? "bg-blue-100 ml-8"
                        : "bg-gray-200 mr-8"
                    }`}
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {message.sender === roomState.currentUser?.userType ? "You" : otherUserName}
                    </div>
                    <div className="text-gray-800">
                      {message.contentText}
                      {!message.isCompleted && message.sender !== roomState.currentUser?.userType && (
                        <span className="animate-ping">●</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {roomState.isRoomFull && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-700">
                {isMyTurn ? "Your Turn" : `${otherUserName}'s Turn`}
              </h3>
              <div
                className={`px-3 py-1 rounded-full text-sm ${
                  isMyTurn
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {isMyTurn ? "Sending" : "Receiving"}
              </div>
            </div>

            {isMyTurn ? (
              <div>
                <textarea
                  value={currentMessage}
                  onChange={handleTyping}
                  placeholder="Type your message..."
                  className="w-full h-32 p-4 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleCompleteMessage}
                  disabled={!currentMessage.trim()}
                  className="mt-3 bg-blue-500 text-white py-2 px-6 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Complete Message
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-md p-4 h-32 border-2 border-dashed border-gray-300">
                <div className="flex items-center justify-center h-full text-gray-500">
                  {otherUserName} is typing in the chat above...
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate("/")}
            className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
          >
            Leave Room
          </button>
          <div className="text-xs text-gray-500">Room ID: {roomId}</div>
        </div>
      </div>
    </div>
  );
};

export default Room;
