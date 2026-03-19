# 🎮 SLITHER 2048 — Multiplayer Online

Gerçek zamanlı multiplayer yılan oyunu. Node.js + Socket.io sunucu, Three.js istemci.

---

## 📁 Proje Yapısı

```
slither2048-online/
├── server.js          ← Node.js + Socket.io sunucu (tüm oyun mantığı)
├── package.json
└── public/            ← Static istemci (GitHub Pages'e de atılabilir)
    ├── index.html
    ├── styles/
    │   ├── base.css
    │   ├── screens.css
    │   ├── hud.css
    │   ├── components.css
    │   └── multiplayer.css   ← YENİ
    └── src/
        ├── core/
        │   ├── Config.js
        │   ├── EventBus.js
        │   ├── SaveManager.js
        │   ├── StateMachine.js
        │   ├── Game.js        ← multiplayer loop
        │   └── Bootstrap.js
        ├── network/
        │   └── NetworkManager.js  ← YENİ — Socket.io iletişimi
        ├── entities/
        │   └── RemoteSnake.js     ← YENİ — diğer oyuncuların 3D yılanları
        ├── ui/
        │   └── Leaderboard.js     ← YENİ — anlık skor tablosu
        └── ... (diğer tüm mevcut modüller)
```

---

## 🚀 Deploy — Render.com (ÜCRETSİZ)

### 1. GitHub'a yükle
```bash
git init
git add .
git commit -m "initial"
git remote add origin https://github.com/KULLANICI_ADIN/slither2048.git
git push -u origin main
```

### 2. Render.com'da yeni servis oluştur
1. https://render.com → **New Web Service**
2. GitHub reposunu bağla
3. Şu ayarları gir:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
4. **Create Web Service** — 2 dakikada deploy olur!

### 5. Oyunu paylaş
Render sana şöyle bir URL verir:
```
https://slither2048.onrender.com
```
Bu linki arkadaşlarınla paylaş, hepiniz aynı sunucuda oynarsınız! 🎉

---

## 💻 Lokal Test

```bash
npm install
npm start
# → http://localhost:3000
```

---

## 🔧 Nasıl Çalışır?

| Bileşen | Açıklama |
|---|---|
| `server.js` | 20 tick/s oyun döngüsü, çarpışma tespiti, skor hesabı |
| `NetworkManager.js` | Socket.io bağlantısı, event yayını |
| `Game.js` | Sunucudan gelen tick'leri işler, input gönderir |
| `RemoteSnake.js` | Diğer oyuncuların 3D yılanlarını render eder |
| `Leaderboard.js` | Sunucudan gelen anlık skor tablosu |

### Mesaj Akışı
```
İstemci → join(name)          → Sunucu oyuncu oluşturur
İstemci → input(x,z,boost)    → Her frame, 60fps
Sunucu  → tick(snapshot)      → 20fps, tüm oyuncu pozisyonları
Sunucu  → you_died(data)      → Ölüm olayı
Sunucu  → leaderboard(data)   → Skor tablosu güncellemesi
```
