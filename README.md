# MultiCoder 0.2.1 — Model listesi, birleşik başlık çubuğu ve karşılama

Bu klasör, MultiCoder'in **API anahtarı girildiğinde sağlayıcının model listesini kendisi bulan**
sürümünü içerir. Model adını artık elle yazman gerekmiyor.

## Sade kabuk (opencode tarzı)

Uygulama açılışta opencode'un tek akışlı düzenini kullanır: etkinlik çubuğu, dosya gezgini,
sekmeler, durum çubuğu ve sağdaki agent paneli gizlenir; yerine tek bir sohbet akışı ve altta
tek bir besteci kalır. Renkler mevcut zen temalarından gelir, arayüz TR/EN'dir.

| Tuş | İşlev |
| --- | --- |
| Enter / Shift+Enter | gönder / yeni satır |
| Tab / Shift+Tab | sağlayıcı (agent) değiştir |
| Esc | akışı durdur, açık katmanı kapat |
| Ctrl+P | komut paleti |
| Ctrl+B | dosya gezgini çekmecesi |
| Ctrl+E | editör panelini aç/kapat |
| Ctrl+N | yeni oturum |
| `/` · `@` · `!` | komut · dosya referansı · kabuk komutu |

Komutlar: `/yeni`, `/oturumlar`, `/model`, `/sağlayıcı`, `/tema`, `/dil`, `/dosyalar`, `/editör`,
`/eklentiler`, `/detay`, `/durdur`, `/classic`, `/yardım`.

Eski VS Code düzenine dönmek için `/classic` (veya Ctrl+P → “Klasik düzen”); tercih
`localStorage.pg.skin` içinde saklanır. Dosyalar `Ctrl+B` çekmecesinden açılır, seçilen dosya
sağdan kayarak gelen editör panelinde düzenlenir. Tool çağrıları tek satırdadır; satıra
tıklayınca argüman ve çıktı açılır (`/detay` varsayılanı değiştirir).

Kabuk `resources/app/dist/renderer/assets/oc-shell.js` + `oc-shell.css` dosyalarından gelir ve
`index.html`'e eklenen iki satırla yüklenir. Oturum köprüsü `chat-workbench.js` içindeki
`window.pgWorkbench` nesnesidir.

## Birleşik başlık çubuğu ve karşılama

Pencere artık çerçevesiz (`frame: false`); Windows'un başlık çubuğu ile `File / View / Help`
menüsü kaldırıldı. Yerlerine programla aynı yüzeyde duran 40px'lik bir başlık çubuğu geldi:

- Solda marka ve çalışma alanı adı (`MultiCoder / proje`), sağda **Dosyalar**, **Editör**, **Tema**,
  **TR/EN** ve **Sağlayıcılar** çipleri. Sağlayıcılar çipi, sağlayıcı/anahtar penceresini açar.
- Sağlayıcılar penceresi gibi React diyalogları açıkken karşılama ekranı çekilir; tıklamaları
yutmaz, pencere donmuş gibi görünmez.
- En sağda gerçek pencere kontrolleri: küçült, büyüt/geri al, kapat. Çubuk sürüklenerek pencere
  taşınır, çift tıklama büyütür; düğmeler sürükleme alanının dışındadır.
- Menünün kısayolları (Ctrl+O, Ctrl+S, Ctrl+, vb.) çalışmaya devam eder; `File / View / Help`
  yalnızca görünmez, işlevleri başlık çubuğu ve komut paletinde durur.
- `/classic` düzeninde de başlık çubuğu kalır, altındaki eski VS Code düzeni 40px aşağıdan başlar.

Karşılama ekranı yalnızca açılışta ve çalışma alanı kapalıyken görünür: enso işareti, rastgele
getirilen bir karşılama cümlesi ("Hoş geldin!", "Merhaba!", "Nasılsın?", "Naber?" — bazen
"Bugün ne yapıyoruz?" / "Bugün aklında ne var?" ile birleşik) ve **Klasör aç** / **Komutlar**
düğmeleri. İşaret büyüyerek, satırlar sırayla yukarı kayarak gelir; `prefers-reduced-motion`
açıksa animasyon kapanır. Karşılama, bir klasör açılınca ya da ilk mesaj gönderilince kaybolur.

## Yazı biçimleri (Tema penceresi)

**Tema** çipinde iki bölüm var: **Renk teması** (zen paletleri) ve **Yazı biçimi · 14**. Her yazı
biçimi kartındaki “Aa” örneği o yazı tipiyle çizilir; seçim anında uygulanır ve `pg.type` olarak
saklanır. Ön ayarlar: Zen, Modern, Hümanist, Okuma, Gazete, Dergi, Teknik, Mühendis, Edebi, Sakin,
Keskin, Sade, Terminal, Sıcak. Hepsi Windows'la birlikte gelen yazı tiplerinden kuruludur
(Palatino, Bahnschrift, Georgia, Book Antiqua, Cascadia, Sitka, Corbel, Century Gothic, Arial,
Consolas, Rockwell…) — internetten yazı tipi indirmez. Kod düzenleyicisi kendi sabit yazı tipini
korur; seçim arayüzü, sohbeti ve panelleri etkiler.

## 0.2.1'de ne değişti?

- **Save artık Sağlayıcılar penceresini kapatmıyor.** Kaydettikten sonra pencerede kalırsın; sağ altta
  “Ayarlar kaydedildi” bildirimi çıkar.
- **Model alanına tıklayınca altında liste açılıyor.** Her sağlayıcı kartında (OpenRouter, OpenAI,
  özel uç nokta) aynı davranış. Liste kaydırılabilir, üstteki **Yenile** düğmesiyle tazelenir.
- **Yazarken filtreleme:** model alanına “claude” yazınca liste daralır; ok tuşları + Enter ile
  seçim yapılabilir, **Esc** kapatır. Seçilen model hem alana hem React state'ine yazılır.
- **Anahtar kaydedilince liste otomatik tazelenir.** Yeni yapıştırdığın anahtar hemen kullanılır;
  “API key: stored” durumu da anında güncellenir.
- **Geçersiz anahtar uyarısı:** anahtarda ASCII dışı karakter (Türkçe harf, akıllı tırnak vb.)
  varsa panel bunu açıkça söyler. OpenRouter listesi anahtar gerekmediği için yine de dolar.
- **Mock / CLI agent** sağlayıcılarında model paneli açılmaz (model adı serbest metindir).

## Nasıl kullanılır?

1. Uygulamayı doğrudan `MultiCoder/MultiCoder.exe` dosyasından çalıştır (taşınabilir kurulum).
   Eski `installer/Polyglot-IDE-Setup-*.exe` dosyaları, adı değişmeden önceki sürümleri kurar.
2. Uygulamada **Ctrl+,** ile Sağlayıcılar penceresini aç.
3. Anahtarı yaz → **Save settings**. Pencere kapanmaz; anahtar durumu “stored” olur ve model
   listesi arka planda tazelenir.
4. **Model** alanına tıkla → sağlayıcının modelleri altında listelenir → seç → istersen tekrar
   **Save settings**.

> **API anahtarları:** Depoda hiçbir anahtar tutulmaz. Anahtarını yalnızca uygulamanın
> Sağlayıcılar penceresine yapıştırıp **Save settings**'e bas; anahtar işletim sisteminin
> güvenli deposuyla (`safeStorage`) şifrelenerek yerel olarak saklanır. Anahtar ASCII dışı
> karakter içeriyorsa panel bunu “API anahtarında ASCII dışı karakter var…” diye bildirir;
> bu durumda anahtarı yeniden kopyalayıp yapıştırman yeterli.

## Nasıl çalışıyor (teknik)

- Model listesi main process'te `GET {baseUrl}/models` ile alınır (20 sn zaman aşımı, 5 dk önbellek).
  `{data: []}`, `{models: []}` ve düz dizi biçimleri desteklenir; 401/403 ayrı mesajlanır.
- Anahtar kaydedilirken liste arka planda önceden çekilir (`settings:set-key`).
- Renderer'da `settings-saved` olayı dinlenir; kayıt sonrası tüm kartlar `refresh: true` ile
  yenilenir.
- Panel, Model input'unun altına `position: fixed` olarak yerleşir; modal kaydırılınca yeniden
  konumlanır. React'in kontrollü input'una yazım native setter + `input` olayı ile yapılır.
- API anahtarı renderer'a hiç gitmez; `safeStorage` ile şifreli saklanmaya devam eder.

## Değişen dosyalar

Uygulamanın `src/` kaynağı bu makinede yok; değişiklikler derlenmiş `dist` üzerinde yapıldı.

| Dosya | Değişiklik |
| --- | --- |
| `MultiCoder/resources/app/dist/main/index.cjs` | Çerçevesiz pencere, `win:*` IPC kanalları, MultiCoder adı; model keşif motoru, `settings:list-models` kanalı, anahtar kaydında ön çekme, ASCII dışı anahtar kontrolü. |
| `MultiCoder/resources/app/dist/preload/index.cjs` | `window.polyglot.win` (küçült / büyüt / kapat / durum) ve `window.polyglot.settings.listModels(...)` |
| `MultiCoder/resources/app/dist/renderer/assets/oc-shell.js` · `oc-shell.css` | Başlık çubuğu, pencere kontrolleri, karşılama ekranı ve sade kabuk. |
| `MultiCoder/resources/app/dist/renderer/assets/model-discovery.js` | Model alanına bağlı açılır liste, filtreleme, klavye, uyarılar, “Ayarlar kaydedildi” bildirimi. |
| `MultiCoder/resources/app/dist/renderer/assets/zen-themes.js` | 10 yeni yazı biçimi ön ayarı (toplam 14) ve `data-pg-type` değişkenleri. |
| `MultiCoder/resources/app/dist/renderer/index.html` | Yukarıdaki betikleri yükler (CSP `script-src 'self'` uyumlu). |
| `MultiCoder/resources/app/dist/renderer/assets/index-C9O_KBAP.js` | Save handler'da pencereyi kapatma çağrısı kaldırıldı; `hasKey` senkronu ve `settings-saved` olayı eklendi. Ayrıca `data-provider-id`, `data-polyglot-model`, `data-polyglot-base-url` öznitelikleri. |

## Kurulum dosyasını yeniden üretmek

```bash
cd "<proje-klasörü>"
npx electron-builder@latest --prepackaged "MultiCoder" --win nsis --x64 --config.electronVersion=45.0.0
```

Çıktı: `installer/MultiCoder-Setup-0.2.1.exe` (imzasız — Windows SmartScreen uyarabilir).

## Bilinen sınırlar

- Liste, sağlayıcının OpenAI uyumlu `GET /models` uç noktasına dayanır. Bu uç noktayı sunmayan
  sağlayıcılarda model elle girilir.
- Ollama gibi yerel sunucularda Base URL `http://localhost:11434/v1` olmalı.
- Save artık pencereyi kapatmadığı için kapatmak isteyen **Cancel** veya sağ üstteki **X**'i
  kullanmalı.
