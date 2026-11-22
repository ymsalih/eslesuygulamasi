# Proje notları (Claude için)

Bu depo **Şark Köşesi**: Türkiye'nin 81 ili ve Tüm Türkiye için kayıtsız, takma adlı, konulu "şark köşelerinde" anlık sohbet sitesi.
Proje sahibi yazılımcı değil; açıklamaları **Türkçe**, sade ve adım adım yap. Teknik terimleri kısaca açıkla.

## Yapı
- `apps/web`: Next.js 16 (App Router). Sayfalar, onay akışı, köşe arayüzü, fon müziği (`lib/ambience.ts`), taslak yasal sayfalar.
  Yönetim paneli `app/yonetim` (işlemler `app/yonetim/actions.ts`, giriş ve veritabanı `lib/admin/`). Her moderatör işlemi `moderation_actions` tablosuna yazılır.
- `apps/realtime`: Node.js + Socket.IO. Köşe mantığı `src/rooms.ts`, soket bağlantıları `src/server.ts`, kayıtlar `src/repo.ts`.
- `packages/shared`: 81 il (`cities.ts`), takma adlar, Türkçe filtre (`moderation.ts`), şehir temaları ve makamlar (`themes.ts`), sahne çizimi, olay tipleri. `src/server` sadece sunucu tarafı (oturum token'ı, IP şifreleme).
- `infra/migrations`: PostgreSQL şeması. `docs/`: analiz, plan, yasal kontrol listesi, kurulum rehberi.

## Komutlar
- `npm install`, `npm run dev` (web: localhost:3000, sohbet sunucusu: localhost:4000)
- `npm test`, `npm run typecheck`, `npm run build`
- `npm run yonetici:parola`: yönetim paneli parolası için `.env` satırları üretir (panel: localhost:3000/yonetim)
- Veritabanı isteğe bağlı: `docker compose -f infra/docker-compose.yml up -d`, `.env` içinde `DATABASE_URL`, `npm run db:migrate`
- `.env` yoksa `npm run dev` yerel deneme anahtarıyla çalışır; canlı sitede `SESSION_SECRET` zorunludur.

## Kurallar
- Asıl karar sunucudadır: filtre, hız sınırları ve yetki kontrolleri `apps/realtime` içinde kalmalı; istemcideki kontroller sadece anında uyarı içindir.
- Panel canlı köşeye `apps/realtime` içindeki `POST /internal/admin` ile müdahale eder (`ADMIN_SECRET`'ten türetilen anahtarla); komutlar sunucuda doğrulanır.
- Mesaj içerikleri veritabanına yazılmaz (sadece bildirilen köşelerin kesiti). KVKK ve 5651 gerekçeleri `docs/YASAL_KONTROL_LISTESI.md` içinde.
- Kullanıcıya görünen tüm metinler Türkçe. Yeni bir il teması `packages/shared/src/themes.ts` içine eklenir.
- Değişiklikten sonra `npm test` ve `npm run typecheck` çalıştır.

## Sıradaki işler
Yönetim paneline 2FA ve çoklu moderatör hesabı, bot koruması (Turnstile), yayın kurulumu (Docker + HTTPS), diğer illere özel manzara.
