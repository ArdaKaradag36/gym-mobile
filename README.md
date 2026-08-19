# FORGE

Hoca / öğrenci spor takip uygulaması. **Expo SDK 54** + Supabase.

Kayıt (signup) yok. Hesapları sen `create-user` ile eklersin.

Şu an test hesapları:

- `arda@gmail.com` — antrenör
- `arda12@gmail.com` — öğrenci (hocası `arda@gmail.com`)

---

## Sıfır bir bilgisayarda uygulamayı açmak

Yeni bir laptop / PC. Hiçbir şey yüklü değil.

### 1. Node.js

[https://nodejs.org](https://nodejs.org) → **LTS** kur. Bitince terminalde:

```bash
node -v
npm -v
```

`node` 18 veya üzeri olmalı.

### 2. Git ve repo

```bash
git clone https://github.com/ArdaKaradag36/gym-mobile.git
cd gym-mobile
```

### 3. Ortam dosyası

GitHub’da `.env` yoktur. Proje kökünde (package.json ile aynı klasör):

```bash
cp .env.example .env
```

`.env` içini doldur. Değerler: [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API.

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Kullanıcı ekleyeceksen aynı dosyaya şunu da yaz (Dashboard → API → `service_role`). **Bunu `EXPO_PUBLIC_` yapma, uygulamaya koyma.**

```
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

`.env` değişince Metro’yu kapatıp yeniden aç.

### 4. Paketler

```bash
npm install
```

### 5. Çalıştır

```bash
npm start
```

- **Web:** açılan terminalde `w` bas. Adres genelde http://localhost:8081
- **Telefon:** App Store / Play Store’dan **Expo Go** kur (SDK 54). Telefon ve laptop aynı Wi‑Fi’de olsun. Terminaldeki **QR**’ı Expo Go ile oku.

Aynı ağda bağlanmazsa:

```bash
npx expo start --tunnel
```

iPhone’da Expo Go için “Yerel Ağ” iznini aç. VPN / Private Relay kapat.

Doğrudan web:

```bash
npm run web
```

---

## Bu bilgisayarda nasıl başlatırım

Repo zaten `/home/ardakasalinux/software/gym-mobile` altında.

```bash
cd ~/software/gym-mobile
npm start
```

`.env` yoksa veya Supabase hata veriyorsa:

```bash
cp .env.example .env
```

içini doldur, `npm start`’ı kapatıp tekrar aç.

Telefonda QR, web’de `w`.

---

## Kullanıcı nasıl eklerim

1. `.env` içinde `SUPABASE_SERVICE_ROLE_KEY` olsun.
2. `scripts/create-user.mjs` dosyasını aç. En üstteki `USER` bloğunu doldur:

```js
const USER = {
  email: 'ogrenci@ornek.com',
  password: 'enaz8karakter',
  fullName: 'Ad Soyad',
  role: 'student', // student | trainer | admin
  trainerEmail: 'arda@gmail.com', // öğrenciye hoca bağlamak için
  isActive: true,
};
```

3. Çalıştır:

```bash
npm run create-user
```

Hoca eklerken `role: 'trainer'` yaz, `trainerEmail` boş bırak.

Aynı e-posta zaten varsa script hesabı **günceller** (şifre dahil). Gerçek şifreyi dosyaya yazıp GitHub’a gönderme; işin bitince `USER` bloğunu tekrar boşalt.

---

## Mağaza paketi (şimdilik şart değil)

Küçük salon için Expo Go yeter. APK / mağaza istersen paket adı `eas-cli`:

```bash
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

---

## Sorun olursa

| Ne görürsün | Ne yap |
| --- | --- |
| `Supabase is not configured` | `.env` kökte mi, adı tam `.env` mi? Metro’yu yeniden başlat |
| Expo Go: SDK uyumsuz | Telefondaki Expo Go SDK 54 olmalı |
| QR açılmıyor | Aynı Wi‑Fi veya `npx expo start --tunnel` |
| `Invalid login credentials` | Hesap bu projede yok; `create-user` ile ekle |
| Beyaz ekran | `npm install` yaptın mı? Fontlar birkaç saniye sürebilir |

Cache temizliği:

```bash
rm -rf node_modules .expo
npm install
npx expo start --clear
```

## Lisans

MIT — Copyright 2026 Arda Karadağ
