# PROJE VE AJAN ÇALIŞMA STANDARTLARI (AGENTS.MD)

Bu dosya, hem **Freebuff** hem de **OpenCode** tarafından her yeni oturumda ve her mesajda **OTOMATİK** olarak yüklenen evrensel sistem yönergesidir. 
Kullanıcının sohbet menüsünden tek tek skill seçmesine gerek YOKTUR; aşağıdaki standartlar tüm oturumlarda varsayılan çalışma protokolüdür.

---

## 1. MÜHENDİSLİK VE KOD KALİTESİ (Superpowers Protokolü)

* **Planlamadan Kod Yazma (`writing-plans`):** Kapsamlı veya mimari bir değişiklik yaparken aceleyle kod yazma. Önce işi 1 PR boyutunda adımlara böl, kabul kriterlerini ve test yöntemini belirle.
* **Tahminle Değil, Kanıtla Düzelt (`systematic-debugging`):** Bir hata veya test başarısızlığı olduğunda ezbere kod değiştirme. Veri akışını ve logları incele, hipotez kur ve kök nedeni ispatla.
* **Test Güdümlü Geliştirme (`test-driven-development`):** Yeni bir mantık kurarken veya bug çözerken önce başarısız testi (Red), ardından geçiren kodu (Green) yaz ve temizle (Refactor).
* **Teslimat Doğrulama Kapısı (`verification-before-completion`):** Test çıktısı, derleme sonucu veya gerçek çalışma kanıtı görmeden hiçbir işe "tamamlandı / düzeltildi" deme.
* **İzole Çalışma (`using-git-worktrees`):** Büyük refactor veya paralel görevlerde çalışma ağacını kirletmemek için izole dallar ve worktree'ler kullan.

---

## 2. ARAYÜZ VE TASARIM DİSİPLİNİ (UI/UX Pro Max & Anti-Slop)

* **AI-Slop Yasağı (`antislop`):** Jenerik, yapay zeka tarafından üretilmiş hissi veren tüm arayüz alışkanlıklarını reddet:
  * Anlamsız mor/mavi gradyanlar, yapay neon parlamaları ve devasa radyal ışıltılar KESİNLİKLE YASAKTIR.
  * "Devrim niteliğinde", "kesintisiz" gibi klişe AI pazarlama metinleri yerine somut insan dili kullan (`antislop-copywriting`).
  * Koddaki `// burası tıklama olayıdır` gibi gereksiz jenerik AI yorumlarını temizle (`antislop-code`).
* **Profesyonel Tasarım Standartları (`ui-ux-pro-max` & `ui-craft`):**
  * **Tipografi & Hiyerarşi:** Projenin stiline uygun (Linear/Vercel/Stripe tarzı) font eşleşmeleri ve okunabilir satır aralıkları kur.
  * **Erişilebilirlik (WCAG):** Metin ve arka plan arasında minimum 4.5:1 kontrast oranını zorunlu kıl. Klavye odağını (`focus-visible`) asla kaldırma (`antislop-human`).
  * **Mikro Etkileşimler (`ui-styling`):** Butonlar ve kartlar için akıcı hover, active, focus ve yükleme geri bildirimleri ver.
  * **Mobil Düzen (`antislop-layoutmobile`):** Mobilde yatay taşmaları engelle, dokunma hedeflerini minimum 44x44px tut.

---

## 3. GÜVENLİK VE DAYANIKLILIK (Cloudflare Security Audit)

* **Localhost & IPC Güvenliği (`DESKTOP-MOBILE-AND-LOCAL-IPC`):** Masaüstü veya yerel araç geliştirirken yerel portları, named pipe'ları ve IPC köprülerini yetkisiz web sayfalarına karşı koru.
* **Kötü Niyetli Girdi & Prompt Injection (`AI-AND-LLM`):** Dışarıdan okunan dosya, doküman veya kullanıcı verilerinin kontrolsüzce terminale (`bash`/`cmd`) ya da model yetkilerine aktarılmasını engelle.
* **Girdileri Doğrula:** Tüm kullanıcı girdilerini ve API parametrelerini en uç noktada doğrula ve sanitize et.

---

## 4. SKİLL KATALOĞU ERİŞİMİ

Projede ve sistemde 379 adet uzmanlık rehberi `.agents/skills/` dizininde bulunmaktadır.
Herhangi bir özel teknoloji (Docker, React, FastAPI, Redis, C++, Rust vb.) ile çalışırken ihtiyaç duyduğun detaylı rehberi `.agents/skills/<skill-adi>/SKILL.md` dosyasından doğrudan oku ve kurallarına uy.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read `.agents/skills/antislop/SKILL.md` (core) and then the skill for the task:
- UI / visual: `.agents/skills/antislop-ui/SKILL.md`
- Copy & text: `.agents/skills/antislop-copywriting/SKILL.md`
- People: `.agents/skills/antislop-human/SKILL.md`
- Mobile / responsive: `.agents/skills/antislop-layoutmobile/SKILL.md`
- Code comments: `.agents/skills/antislop-code/SKILL.md`
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
<!-- antislop:end -->
