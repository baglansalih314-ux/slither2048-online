# SLITHER 2048 — Modüler Proje Yapısı

Snake ve 2048'i birleştiren 3D tarayıcı oyunu.  
Tek HTML dosyasından **25 ayrı modüle** bölünmüştür.

---

## 📁 Dizin Yapısı

```
slither2048/
├── index.html                  ← Tek giriş noktası (HTML + script sırası)
│
├── styles/
│   ├── base.css                ← Reset, CSS değişkenleri, global layout
│   ├── screens.css             ← Menu, GameOver, Pause, Settings, Tutorial ekranları
│   ├── hud.css                 ← Oyun içi HUD, joystick, boost butonu
│   └── components.css          ← Butonlar, toggle, slider, kalite butonları
│
└── src/
    ├── core/                   ← Uygulama çekirdeği
    │   ├── Config.js           ← Tüm sabit parametreler (tek kaynak)
    │   ├── EventBus.js         ← Modüller arası pub/sub olayları
    │   ├── SaveManager.js      ← localStorage kalıcılığı
    │   ├── StateMachine.js     ← Ekran durumu yönetimi
    │   ├── Game.js             ← Ana orkestratör: init / start / update döngüsü
    │   └── Bootstrap.js        ← DOMContentLoaded giriş noktası
    │
    ├── systems/                ← Oyun sistemleri (durumsuz veya IIFE singleton)
    │   ├── AudioManager.js     ← Web Audio API: SFX + müzik
    │   ├── InputManager.js     ← Pointer / dokunma / klavye girdisi
    │   ├── BoostSystem.js      ← Enerji dolum/tüketim mantığı
    │   ├── ScoreSystem.js      ← Puan, kombo, HUD güncellemesi
    │   ├── MergeSystem.js      ← 2048 zincir birleşme algoritması
    │   ├── CollisionSystem.js  ← Pickup + yılan çarpışma tespiti
    │   ├── SpawnManager.js     ← Koleksiyon küpü yaşam döngüsü
    │   ├── DifficultyDirector.js ← Zamanla artan zorluk
    │   ├── VFX.js              ← Parçacık patlamaları + ekran efektleri
    │   ├── Renderer.js         ← Three.js renderer, sahne, kamera, ışıklar
    │   ├── Arena.js            ← Zemin, sınır halkası, dekoratif sütunlar
    │   └── CameraController.js ← Yumuşak takip, FOV zoom, sarsma
    │
    ├── entities/               ← Oyun nesneleri (sınıf tabanlı)
    │   ├── TileColors.js           ← 2048 değer → renk paleti
    │   ├── NumberTextureCache.js   ← Canvas sayı dokusu önbelleği
    │   ├── CubeMaterialFactory.js  ← Three.js materyal yardımcıları
    │   ├── SnakeSegment.js         ← Tek vücut küpü
    │   ├── CollectibleCube.js      ← Toplanabilir küp
    │   ├── Snake.js                ← Temel yılan sınıfı (hareket, iz, ölüm)
    │   ├── PlayerSnake.js          ← Oyuncu girdi entegrasyonu
    │   ├── BotBrain.js             ← Kişilikli AI karar motoru
    │   └── AISnake.js              ← BotBrain tarafından yönlendirilen yılan
    │
    ├── ui/                     ← Kullanıcı arayüzü katmanı
    │   ├── TutorialSystem.js   ← Adım adım ilk oynama rehberi
    │   └── UIController.js     ← Tüm buton bağlamaları ve geçişler
    │
    └── utils/                  ← Saf yardımcı işlevler
        ├── ObjectPool.js       ← Genel fabrika tabanlı nesne havuzu
        └── SpatialHash.js      ← O(1) çarpışma geniş aşaması ızgarası
```

---

## 🧩 Mimari Kararlar

| Karar | Neden |
|---|---|
| `Config.js` tek kaynak | Tüm sayısal parametreler bir arada, oyun dengesi kolay ayarlanır |
| `EventBus` pub/sub | Modüller birbirini doğrudan import etmez; bağımlılık yok |
| IIFE singleton'lar | `AudioManager`, `ScoreSystem` vb. global durum taşır ama izole edilmiştir |
| Sınıf tabanlı entity'ler | `Snake`, `SnakeSegment`, `CollectibleCube` çok sayıda instance gerektirir |
| CSS dosya ayrımı | Base / Screens / HUD / Components — her stil kendi sorumluluğunda |
| Script yükleme sırası | `index.html` bağımlılık sırasını açıkça tanımlar |

---

## 🚀 Çalıştırma

Statik bir HTTP sunucusu gereklidir (ES modülü değil, classic script):

```bash
# Python
python -m http.server 8080

# Node.js (npx)
npx serve .
```

Ardından tarayıcıda `http://localhost:8080` adresini açın.

---

## 🎮 Kontroller

| Platform | Hareket | Boost |
|---|---|---|
| Mobil | Sol joystick | ⚡ sağ buton |
| Masaüstü | WASD / Ok tuşları | Boşluk |
