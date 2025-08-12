export interface Message {
  contentText: string;
  sender: 'parent' | 'child';
  isCompleted: boolean;
}

export interface Room {
  id: string;
  parentUser: string;
  childUser?: string;
  currentSender: 'parent' | 'child';
  completedMessages: Message[];
}

export interface UserSession {
  socketId: string;
  roomId: string;
  userType: 'parent' | 'child';
  userName?: string;  // ユーザー名設定前はundefined
}

export interface JoinRoomData {
  roomId: string;
}

export interface SetUsernameData {
  roomId: string;
  userName: string;
}

export interface UpdateTypingData {
  roomId: string;
  currentText: string;
}

export interface CompleteMessageData {
  roomId: string;
  finalText: string;
}

export interface RoomStateData {
  roomId: string;
  parentUser: string;
  childUser?: string;
  currentSender: 'parent' | 'child';
  isRoomFull: boolean;
  completedMessages: Message[];
  // 現在のユーザーの情報
  currentUser?: {
    userType: 'parent' | 'child';
    userName: string;
  };
}