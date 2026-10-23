# TravelPlanner 四步設定指南

跟住呢四步，就可以喺本機跑起嚟，再部署去 GitHub Pages。

完成後網址會係：

`https://<你的 GitHub 用戶名>.github.io/TravelPlanner/`

請將下文所有 `<username>` 換成你自己嘅 GitHub 用戶名。

---

## Step 1 — 開 GitHub repo（名必須係 TravelPlanner）

### 目的

本專案 Vite 嘅 `base` 設咗做 `/TravelPlanner/`，所以 **repo 名必須係 `TravelPlanner`**，否則 GitHub Pages 路徑會唔啱。

### 步驟

1. 登入 [GitHub](https://github.com/)
2. 右上角 **+** → **New repository**
3. 填寫：
   - **Repository name：** `TravelPlanner`（唔好改名）
   - Public 或 Private 都得
   - 唔使勾 README／.gitignore（如果本機已經有專案）
4. 撳 **Create repository**
5. 喺本機專案資料夾執行（把 `<username>` 換成你嘅用戶名）：

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<username>/TravelPlanner.git
git push -u origin main
```

6. 喺 GitHub 開你嘅 repo → **Settings** → 左邊 **Pages**
7. **Build and deployment** → **Source** 選 **GitHub Actions**（唔好選 Deploy from a branch）

### 完成檢查

- [ ] Repo 網址係 `https://github.com/<username>/TravelPlanner`
- [ ] 已成功 `git push` 去 `main`（或 `master`）
- [ ] Pages Source 已設為 **GitHub Actions**

---

## Step 2 — 開 Firebase（Spark）同設定 Auth／Firestore

### 目的

用免費 Spark plan 提供 **Google 登入** 同 **Firestore** 資料庫（唔使開 Cloud Functions）。

### 步驟

#### 2.1 建立專案

1. 去 [Firebase Console](https://console.firebase.google.com/)
2. **Add project**／**建立專案**
3. 輸入專案名稱（例如 `TravelPlanner`）
4. Google Analytics 可開可唔開
5. 完成後確認計劃係 **Spark（免費）**（預設一般係）

#### 2.2 啟用 Google 登入

1. 左邊選單 **Build** → **Authentication**
2. 第一次會叫你 **Get started**
3. **Sign-in method** → **Google** → **Enable**
4. 揀一個 **Project support email** → **Save**

#### 2.3 授權網域（Authorized domains）

1. 仍然喺 Authentication → **Settings**（設定）分頁
2. 搵 **Authorized domains**
3. 確認有／手動加入：
   - `localhost`（本機開發）
   - `<username>.github.io`（GitHub Pages）

#### 2.4 建立 Firestore 同貼上規則

1. 左邊 **Build** → **Firestore Database**
2. **Create database**
3. 地點揀離你近嘅 region（之後唔易改）
4. 模式可揀 **production mode**（稍後用 rules 控制權限）
5. 開好後去 **Rules** 分頁
6. 用本 repo 嘅 [`firestore.rules`](firestore.rules) **成份內容取代**編輯器入面嘅規則
7. 撳 **Publish**

#### 2.5 登記 Web App 同抄 config

1. 左上齒輪 **Project settings**（專案設定）
2. 往下 **Your apps** → 撳 **</>**（Web）
3. App nickname 例如 `TravelPlanner Web` → 註冊（Hosting 唔使勾）
4. 會見到類似：

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

5. 保留呢六個值，Step 4 會用到

### 完成檢查

- [ ] Authentication → Google 已 **Enabled**
- [ ] Authorized domains 有 `localhost` 同 `<username>.github.io`
- [ ] Firestore 已建立，Rules 已 **Publish**（內容同 `firestore.rules` 一致）
- [ ] 已有 Web app 嘅 `firebaseConfig` 六個欄位

---

## Step 3 — Google Cloud：Maps／Places／Routes API Key

### 目的

地圖顯示、地點搜尋、景點之間交通估算，都靠 Google Maps 相關 API。  
**注意：** 呢啲 API 計費喺 **Google Cloud**，同 Firebase Spark 免費額度係分開；通常要開 billing 先用到 Maps／Routes（有免費額度，超出先收費）。

### 步驟

#### 3.1 去同一個 Google Cloud 專案

1. Firebase **Project settings** 入面可以見到 **Project ID**
2. 或者撳齒輪旁／相關連結開 [Google Cloud Console](https://console.cloud.google.com/)
3. 頂部專案選擇器揀 **同 Firebase 同一個 project**

#### 3.2 啟用三個 API

1. 左邊 **APIs & Services** → **Library**（API 程式庫）
2. 逐個搜尋並 **Enable**：
   - **Maps JavaScript API**
   - **Places API**（如果見到 Places API (New)，啟用計劃用緊嘅 Places；本專案用經典 Places Autocomplete，優先開 **Places API**）
   - **Routes API**

#### 3.3 建立同限制 API Key

1. **APIs & Services** → **Credentials**
2. **+ Create credentials** → **API key**
3. 建立後即刻 **Edit API key**（或 Restrict key）
4. **Application restrictions**
   - 選 **HTTP referrers (web sites)**
   - 加入：
     - `http://localhost:*`
     - `http://127.0.0.1:*`
     - `https://<username>.github.io/TravelPlanner/*`
5. **API restrictions**
   - 選 **Restrict key**
   - 只勾：Maps JavaScript API、Places API、Routes API
6. **Save**
7. 複製呢條 **API key**，Step 4 會用做 `VITE_GOOGLE_MAPS_API_KEY`

### 完成檢查

- [ ] 三個 API 狀態係 Enabled
- [ ] API key 已設 HTTP referrer（含 localhost 同 github.io／TravelPlanner）
- [ ] Key 已限制只畀上述 API 用
- [ ] 如 Maps 載入失敗，先檢查 Cloud Billing 有冇開

---

## Step 4 — 本機 `.env` 同 GitHub Actions Secrets

### 目的

把 Firebase／Maps 金鑰注入 Vite（本機用 `.env`，線上用 GitHub Secrets）。  
**唔好** 把填好嘅 `.env` commit 去 GitHub（已喺 `.gitignore`）。

### 變數對照表

對照 [`.env.example`](.env.example)：

| 環境變數 | 從邊度抄 |
|----------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | Firebase `appId` |
| `VITE_GOOGLE_MAPS_API_KEY` | Step 3 嘅 Google Maps API key |

### 4.1 本機開發

喺專案根目錄：

```bash
cp .env.example .env
```

用編輯器打開 `.env`，填晒上面 7 個值，然後：

```bash
npm install
npm run dev
```

瀏覽器開 Vite 顯示嘅本機網址（通常 `http://localhost:5173/TravelPlanner/`），試 Google 登入。

### 4.2 GitHub Actions Secrets（部署用）

Workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 會讀以下 **同名** Secrets：

1. 開 GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**，逐個加（名要完全一樣）：
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_GOOGLE_MAPS_API_KEY`
3. 確認 Step 1 已將 Pages Source 設為 **GitHub Actions**
4. 推 code 去 `main`／`master`，或者去 **Actions** 手動跑 **Deploy to GitHub Pages**
5. 等 workflow 綠剔後，開：

`https://<username>.github.io/TravelPlanner/`

### 完成檢查

- [ ] 本機 `.env` 已填齊，`npm run dev` 可開頁、可登入
- [ ] GitHub 已加齊 7 個 Actions Secrets
- [ ] Deploy workflow 成功（綠色）
- [ ] 線上網址可開，登入同地圖正常

---

## 常見問題

### Google 登入 popup 被擋／失敗

- 瀏覽器允許 popup
- Firebase Authorized domains 有冇加而家用嘅網域
- 如果 popup 唔穩，App 會嘗試改用 redirect；完成後應返到同一個 origin

### 地圖空白／Places 搜尋唔到

- `VITE_GOOGLE_MAPS_API_KEY` 有冇填錯（本機 `.env` 同 GitHub Secrets）
- API key 嘅 HTTP referrer 有冇包而家網址
- Maps JavaScript API／Places API／Routes API 有冇 Enable
- Google Cloud 有冇開 Billing（好多時候 Maps 必須）

### GitHub Pages 開到 404 或白頁

- Repo 名係咪真係 `TravelPlanner`
- Pages Source 係咪 **GitHub Actions**（唔係 branch `gh-pages` 舊方法）
- Actions 最新一次 build／deploy 係咪成功
- 網址路徑要有 `/TravelPlanner/`（唔好漏尾）

### Firestore 寫入／讀取權限錯誤

- 有冇 Publish 最新嘅 [`firestore.rules`](firestore.rules)
- 有冇用 Google 登入（多數寫入要 `request.auth != null` 同係行程 owner）

---

## 下一步

設定完成後可睇 [`README.md`](README.md) 了解功能概覽。  
Phase 2（未做）：多人協作編輯、分帳。
