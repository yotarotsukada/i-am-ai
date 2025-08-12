export interface RoomState {
  roomId: string;
  parentUser: string;
  childUser?: string;
  currentSender: 'parent' | 'child';
  isRoomFull: boolean;
  completedMessages: {
    contentText: string;
    sender: 'parent' | 'child';
    isCompleted: boolean;
  }[];
  // 現在のユーザーの情報
  currentUser?: {
    userType: 'parent' | 'child';
    userName: string;
  };
}

export interface TypingData {
  text: string;
  sender: 'parent' | 'child';
}