# 飯マッチ (Meshi Match) 🍱

**「今日、何食べる？」を解決するレストランマッチングアプリ**

Tinderのスワイプ式UIでレストランを選ぶ。グループで使えば、全員の好みが一致したお店だけが「マッチ」として表示される。

---

## 機能

| 機能 | 説明 |
|------|------|
| 🍽️ **スワイプ** | 右→セーブ、左→スキップ。近い順で表示 |
| ❤️ **セーブ** | セーブ済みのレストランをフィルター・並び替え |
| 👥 **グループマッチ** | 全員が右スワイプしたレストランだけが「マッチ」 |
| ⚙️ **フィルター** | 距離・ジャンル・評価・価格で絞り込み |
| 🗺️ **Googleマップ連携** | ワンタップでナビ起動 |
| 📞 **電話予約** | セーブ画面から直接電話 |

---

## セットアップ

### 必要なもの
- Node.js 18+
- Expo Go アプリ (iPhone / Android)

### インストール

```bash
npm install
```

### 起動

```bash
npx expo start
```

表示されたQRコードを Expo Go でスキャンして起動。

---

## APIキーの設定 (任意)

キーなしでも**モックデータ**で動作します。

### Google Places API

1. [Google Cloud Console](https://console.cloud.google.com) でプロジェクト作成
2. 以下のAPIを有効化:
   - Places API (New)
   - Maps SDK for iOS
   - Maps SDK for Android
3. APIキーを作成

### Firebase (グループマッチのリアルタイム同期)

1. [Firebase Console](https://console.firebase.google.com) でプロジェクト作成
2. Firestore Database を作成 (テストモード)
3. Authentication を有効化

### 環境変数の設定

```bash
cp .env.example .env
# .env を編集してAPIキーを設定
```

---

## プロジェクト構成

```
meshi-match/
├── app/                    # Expo Router スクリーン
│   ├── (tabs)/             # タブ画面
│   │   ├── index.tsx       # スワイプ画面
│   │   ├── groups.tsx      # グループ一覧
│   │   ├── saved.tsx       # セーブ済み
│   │   └── account.tsx     # アカウント設定
│   └── group/[id].tsx      # グループ詳細・マッチ表示
├── src/
│   ├── components/         # UIコンポーネント
│   ├── constants/          # モックデータ・カラー定数
│   ├── services/           # Firebase / GooglePlaces / Location
│   ├── store/              # Zustand 状態管理
│   └── types/              # TypeScript型定義
└── assets/                 # アイコン・スプラッシュ画像
```

---

## ストア提出 (将来)

```bash
# EAS Build セットアップ
npm install -g eas-cli
eas login
eas build:configure

# ビルド
eas build --platform ios
eas build --platform android

# 提出
eas submit --platform ios
eas submit --platform android
```

---

## 技術スタック

| 役割 | ライブラリ |
|------|-----------|
| フレームワーク | React Native + Expo SDK 54 |
| ルーティング | Expo Router v6 |
| 言語 | TypeScript |
| 状態管理 | Zustand v5 |
| アニメーション | react-native-reanimated v4 |
| ジェスチャー | react-native-gesture-handler v2 |
| バックエンド | Firebase v12 (Firestore + Auth) |
| 位置情報 | expo-location |
