# Leaderboard Backend (FastAPI + MongoDB)

Chhota sa API jo quiz ke scores MongoDB mein save karta hai aur ek
leaderboard (top scorers) deta hai. Frontend (GitHub Pages waala static
quiz) isko HTTPS ke through call karta hai.

## 1. MongoDB Atlas — free cluster banao (5 min)

1. https://www.mongodb.com/cloud/atlas/register par jaake free account banao.
2. "Build a Database" → **M0 Free** tier select karo → koi bhi region (nearest, e.g. Mumbai) → "Create".
3. **Database Access** (left sidebar) → "Add New Database User":
   - Username/password set karo (yeh yaad rakhna, connection string mein use hoga).
   - Role: "Read and write to any database".
4. **Network Access** (left sidebar) → "Add IP Address" → **"Allow Access from Anywhere"** (0.0.0.0/0) select karo. Render jaise cloud host se connect karne ke liye yeh zaroori hai kyunki Render ka IP fixed nahi hota.
5. **Database** (left sidebar) → apne cluster ke saamne "Connect" → **"Drivers"** → language: Python.
   - Ek connection string milega jaisa:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - `<username>` aur `<password>` apni values se replace karo. Yeh string hi tumhara `MONGODB_URI` hai.

Bas — koi table/schema pehle se banane ki zaroorat nahi, MongoDB pehli write pe khud collection bana lega.

## 2. Backend ko Render pe deploy karo

1. Is `backend/` folder ko apne GitHub repo mein push karo (alag repo bhi chalega, ya same repo mein `backend/` subfolder — dono theek hai).
2. https://render.com par jaake "New +" → **"Web Service"** → apna GitHub repo connect karo.
3. Settings:
   - **Root Directory**: `backend` (agar same repo mein hai)
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Environment** tab mein yeh variables add karo (`.env.example` dekho):
   - `MONGODB_URI` — step 1 ka connection string
   - `MONGODB_DB` — `astratoonix_quiz` (ya jo naam chaho)
   - `API_KEY` — koi bhi random string bana lo (frontend isi ko bhejega)
   - `ALLOWED_ORIGINS` — tumhari GitHub Pages URL, e.g. `https://raj-dev-01.github.io`
5. "Create Web Service" — Render build karke ek URL dega jaisa:
   `https://astratoonix-leaderboard.onrender.com`

**Note:** Render ke free tier pe service kuchh der inactive rehne pe "sleep" ho jaati hai — pehli request thodi slow (10-30 sec) ho sakti hai jab woh wake hoti hai. Yeh normal hai.

## 3. Frontend ko connect karo

`script.js` ke CONFIG object mein yeh do lines update karo:

```js
apiBaseUrl: "https://astratoonix-leaderboard.onrender.com",
apiKey: "same-random-string-jo-render-mein-daala-tha",
```

Bas — quiz khatam hone pe score apne aap backend ko chala jayega, aur
"🏆 Leaderboard" button top scorers dikhayega.

## API quick reference

| Method | Path | Body / Query | Kya karta hai |
|---|---|---|---|
| POST | `/api/submit-score` | `{player_name, score, total, category_id, category_label}` + header `X-API-Key` | Ek attempt save karta hai |
| GET | `/api/leaderboard?limit=10&best_per_player=true` | — | Top scorers, rank ke saath |
| GET | `/health` | — | Uptime check |

`best_per_player=true` (default) matlab ek hi naam ke multiple attempts
mein se sirf best wala dikhega, taaki koi baar-baar khelke leaderboard
spam na kar sake.

## Local testing (optional)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fir .env mein apni values daalo
uvicorn main:app --reload
```

Fir browser mein `http://127.0.0.1:8000/health` khol ke check kar sakte ho.
