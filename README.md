# gym-mobile

Hoca / öğrenci spor takip uygulaması. **Expo SDK 54** + Supabase.

Kayıt (signup) yok. Kullanıcıları `npm run create-user` ile eklersin.

## Gerekenler

- Node.js 18 veya üzeri (`node -v`)
- npm (Node ile gelir)
- Telefonda **App Store / Play Store Expo Go** (SDK 54)

## 1. Repoyu al

```bash
git clone https://github.com/ArdaKaradag36/gym-mobile.git
cd gym-mobile
```

## 2. Ortam dosyası

`.env` GitHub’da yoktur. Proje kökünde (package.json ile aynı klasör) oluştur:

```bash
cp .env.example .env
```

`.env` içini doldur (Supabase Dashboard → Project Settings → API):

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

`SUPABASE_SERVICE_ROLE_KEY` yalnız kullanıcı oluşturmak içindir. Uygulamaya ve `EXPO_PUBLIC_` ile koyma.

`.env` değişince Metro’yu kapatıp yeniden aç.

## 3. Bağımlılıklar

```bash
npm install
```

## 4. Çalıştır

```bash
npm start
```

### Web

Açılan terminalde `w` bas. Adres: http://localhost:8081

Doğrudan:

```bash
npm run web
```

### Telefon (Expo Go)

1. Telefona **Expo Go** kur (App Store / Play Store — SDK 54).
2. Telefon ve laptop **aynı Wi‑Fi**’de olsun.
3. `npm start` çıktısındaki **QR**’ı Expo Go ile oku.

Aynı ağda bağlanmazsa tünel:

```bash
npx expo start --tunnel
```

İlk tünelde ngrok isteyebilir. Bitince **yeni QR**’ı oku.

iPhone “Yerel Ağ” iznini Expo Go için aç. VPN / Private Relay kapat.

## Kullanıcı eklemek

`scripts/create-user.mjs` içindeki `USER` bloğunu doldur, `.env`’e service role anahtarını ekle, sonra:

```bash
npm run create-user
```

`role`: `student` | `trainer` | `admin`  
Öğrenciye hoca bağlamak için `trainerEmail` yaz.

## Sorun olursa

| Ne görürsün | Ne yap |
| --- | --- |
| `Supabase is not configured` | `.env` kökte mi, adı `.env` mi? Metro’yu yeniden başlat |
| Expo Go: SDK uyumsuz | App Store Expo Go SDK 54 olmalı; bu repo SDK 54 |
| QR açılmıyor / network lost | Aynı Wi‑Fi veya `npx expo start --tunnel` |
| `Invalid login credentials` | Hesap bu Supabase projesinde yok; `create-user` ile ekle |
| Beyaz ekran | `npm install` yaptın mı? Fontlar ~4 sn sonra yine yüklenir |

Cache temizleyip baştan:

```bash
rm -rf node_modules .expo
npm install
npx expo start --clear
```

Web için sonuna `--web` veya tünel için `--tunnel` ekle.

## Lisans

MIT — Copyright 2026 Arda Karadağ
