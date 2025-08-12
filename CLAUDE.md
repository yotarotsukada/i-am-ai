# i-am-ai アプリケーション仕様書

## 概要

リアルタイムチャットアプリケーション。ユーザー同士が交互にメッセージを送信し、タイピング中の文字列をリアルタイムで共有する。

## 基本仕様

### ユースケース

1. **ルーム作成**: UUIDをIDとするルームを作成。作成者を「親ユーザ」とする
2. **既存ルーム入室**: URL経由でルームに参加。参加者を「子ユーザ」とする
3. **入室制限**: ルームには同時に2人のユーザのみ接続可能（親1人 + 子1人）
4. **メッセージ送信**: 送信モードのユーザがタイピングするたびに、その時点での文字列をリアルタイム送信
5. **メッセージ完了**: 専用ボタンでメッセージ入力完了を通知し、モードが交代

### ユーザー役割

- **親ユーザ**: ルーム作成者、初期状態で送信モード
- **子ユーザ**: ルーム参加者、初期状態で受信モード

### モード仕様

- **送信モード**: 1キータイプごとにリアルタイム送信
- **受信モード**: 相手のタイピングをリアルタイム表示
- **モード交代**: 送信完了ボタン押下で即時交代
- **履歴保存**: 完了したメッセージのみ保存・表示

## 技術仕様

### アーキテクチャ

- **フロントエンド**: React Router 7 + TypeScript + Tailwind CSS
- **バックエンド**: Node.js + Express + Socket.io
- **DB**: SQLite（開発用）/ PostgreSQL（本番用）
- **デプロイ**: Railway または Render（WebSocket対応のため）

### サーバー権威型設計

- サーバーが唯一の正しいステート（Single Source of Truth）を管理
- クライアントはアクション要求のみ送信
- サーバーがステート更新後、全クライアントに新しいステートを配信

## データ構造

### Room（サーバー管理）

```typescript
interface Room {
  id: string;                    // UUID
  parentUser: string;            // 親ユーザー名
  childUser?: string;            // 子ユーザー名（未参加時はundefined）
  currentSender: 'parent' | 'child';  // 現在の送信者
  completedMessages: {
    contentText: string;
    sender: 'parent' | 'child';
    isCompleted: boolean;
  }[];
}
```

### ユーザーセッション管理（サーバー内部）

```typescript
const userSocketMap = new Map<string, {
  socketId: string;
  roomId: string;
  userType: 'parent' | 'child';
  userName: string;
}>();
```

## WebSocket API仕様

### サーバー → クライアント（状態配信）

#### `room-state`
ルーム状態の更新通知

```typescript
{
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
}
```

### クライアント → サーバー（アクション要求）

#### `join-room`
ルーム参加要求（匿名）

```typescript
{
  roomId: string;
}
```

#### `set-username`
ユーザー名設定

```typescript
{
  roomId: string;
  userName: string;
}
```

#### `update-typing`
リアルタイムタイピング更新

```typescript
{
  roomId: string;
  currentText: string;
}
```

#### `complete-message`
メッセージ送信完了

```typescript
{
  roomId: string;
  finalText: string;
}
```

## サーバー処理フロー

### 1. ルーム参加処理

```
1. クライアント: join-room 送信（匿名）
2. サーバー: ユーザータイプ判定（parent/child）
3. サーバー: userSocketMap に仮登録（userName未設定）
4. サーバー: クライアントにユーザー名入力要求
5. クライアント: set-username 送信
6. サーバー: userSocketMap を正式登録
7. サーバー: Room状態更新
8. サーバー: 全クライアントに room-state 配信
```

### 2. リアルタイムタイピング処理

```
1. クライアント: update-typing 送信
2. サーバー: socket.id からユーザー識別
3. サーバー: 権限チェック（currentSender かどうか）
4. サーバー: 受信者にのみ typing 情報転送
```

### 3. メッセージ完了処理

```
1. クライアント: complete-message 送信
2. サーバー: socket.id からユーザー識別
3. サーバー: completedMessages に追加
4. サーバー: currentSender 切り替え
5. サーバー: 全クライアントに room-state 配信
```

## UI仕様

### ルーム作成画面
- ルーム作成ボタン
- 生成されたルームIDとURL表示
- URL共有機能

### ルーム参加画面
- 入室ボタン（匿名で入室）
- 入室後にユーザー名入力画面へ遷移

### ユーザー名入力画面
- ユーザー名入力フォーム
- 確定ボタン
- チャット画面へ遷移

### チャット画面

#### 送信モード時
- テキスト入力エリア（大きめ）
- 「送信完了」ボタン
- 相手の受信状況表示

#### 受信モード時
- 相手のリアルタイムタイピング表示エリア（大きめ）
- 待機状態表示

#### 共通表示
- 完了済みメッセージ履歴
- 現在のモード表示
- 接続ユーザー情報

## 制約・仕様外

- 接続切れ対応は考慮しない
- 認証機能なし
- メッセージの永続化は最低限
- 3人以上の同時接続は不可