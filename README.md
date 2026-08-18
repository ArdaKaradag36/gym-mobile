# gym-mobile

Forge (hoca / öğrenci) spor takip uygulaması. Expo + Supabase.

## Arkadaşın klonladıktan sonra

`.env` GitHub’da **yok** (doğru). Aynı anahtarları proje köküne `.env` adıyla koy, sonra Metro’yu **yeniden** başlat.

```bash
git clone https://github.com/ArdaKaradag36/gym-mobile.git
cd gym-mobile
npm install
```

Kök dizinde (package.json ile aynı klasör) `.env` oluştur:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

`SUPABASE_SERVICE_ROLE_KEY` sadece `npm run create-user` içindir; uygulamayı açmak için gerekmez.

```bash
npm start
```

Tarayıcı: `w` → http://localhost:8081  
Telefon: Expo Go ile QR.

`.env` ekledikten veya değiştirdikten sonra çalışan `npm start` oturumunu kapatıp tekrar aç. Expo bu değişkenleri bundle anında okur.

## Giriş

Kayıt (signup) yok. Kullanıcıları hoca/admin `npm run create-user` ile ekler. Aynı `.env` = aynı Supabase projesi = aynı hesaplarla giriş.

## Sık kırılma noktaları

| Belirti | Neden |
| --- | --- |
| `Supabase is not configured` | `.env` yanlış klasörde, adı `.env.txt`, veya Metro `.env`’den önce açıldı |
| Windows’ta `ELECTRON_DISABLE_SANDBOX` hatası | Eski `npm start` Unix yazımıydı; artık `node scripts/start.mjs` |
| Beyaz/boş ekran | Font CDN gecikmesi (artık 4 sn sonra yine açılır) veya `npm install` atlandı |
| `Invalid login credentials` | Şifre o projede farklı; `create-user` ile sıfırlanır |

Node 18+ kullan.
