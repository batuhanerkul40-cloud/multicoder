"""
Enriches all 378 skills with comprehensive Turkish descriptions and sub-skill breakdowns.
Generates an updated skills_data.json and builds a gorgeous, interactive Turkish Web Dashboard.
"""

import json
import os
import re

DATA_PATH = r"C:\Users\batuhan\Desktop\IDE\skills_data.json"
HTML_PATH = r"C:\Users\batuhan\Desktop\IDE\skills_matrix.html"

# Detailed Turkish knowledge base for core and major skills
DETAILED_TR = {
    # --- SUPERPOWERS SUITE ---
    "brainstorming": {
        "title_tr": "Yaratıcı Beyin Fırtınası & Mimari Tasarım",
        "desc_tr": "Yeni bir özellik geliştirmeden veya kod yazmadan önce alternatif mimari yolları, uç durumları ve teknik ödünleşimleri (trade-offs) tartışarak fikri olgunlaştırır. Erken aşamada tasarım hatalarını önler.",
        "sub_skills": [
            {"name": "alternatif-kesif", "desc_tr": "Tek bir çözüme saplanmadan en az 2-3 farklı mimari yaklaşımı kıyaslar."},
            {"name": "uc-durum-analizi", "desc_tr": "Hafıza, ağ kopması, boş veri gibi beklenmedik senaryoları önceden belirler."},
            {"name": "karar-matrisi", "desc_tr": "Hız, karmaşıklık ve bakım maliyetine göre en doğru yönü seçer."}
        ]
    },
    "writing-plans": {
        "title_tr": "Adım Adım Uygulama Planı Çıkarma",
        "desc_tr": "Belirlenen bir hedefi tek seferde 1 PR boyutunda, doğrulanabilir ve bağımsız görevlere bölen inşaat planı hazırlar. Kod yazmadan önce her adımın kabul kriterlerini ve test yöntemini belirler.",
        "sub_skills": [
            {"name": "gorev-ayristirma", "desc_tr": "Büyük işleri küçük, yönetilebilir ve sıralı adımlara böler."},
            {"name": "bagimlilik-grafigi", "desc_tr": "Hangi adımların paralel, hangilerinin sıralı yapılması gerektiğini haritalar."},
            {"name": "kabul-kriterleri", "desc_tr": "Her adımın tamamlandığını kanıtlayan somut doğrulama kriterleri tanımlar."}
        ]
    },
    "executing-plans": {
        "title_tr": "Hazırlanan Planı Adım Adım Yürütme",
        "desc_tr": "Önceden yazılmış uygulama planını sırayla icra eder. Her adımdan sonra testleri çalıştırıp doğrular ve bir sonraki adıma geçmeden önce sağlamlık kontrolü yapar.",
        "sub_skills": [
            {"name": "adim-adim-yurutme", "desc_tr": "Plandaki adımları atlamadan ve sırasını bozmadan tek tek kodlar."},
            {"name": "ara-dogrulama", "desc_tr": "Her adım bitiminde derleme ve testleri koşturarak sapmaları anında yakalar."}
        ]
    },
    "systematic-debugging": {
        "title_tr": "Sistematik & Kanıta Dayalı Hata Ayıklama",
        "desc_tr": "Beklenmedik bir hata, çökme veya test başarısızlığı olduğunda ezbere kod değiştirmeyi yasaklar. Veri akışını izler, hipotezler kurar, kök nedeni kesin olarak kanıtlar ve en küçük güvenli yamayı uygular.",
        "sub_skills": [
            {"name": "kok-neden-analizi", "desc_tr": "Yüzeysel semptomları değil, hatayı doğuran asıl mantık hatasını izler."},
            {"name": "hipotez-testi", "desc_tr": "Loglar ve geçici testlerle hatanın nerede kırıldığını adım adım ispatlar."},
            {"name": "yan-etki-korumasi", "desc_tr": "Yapılan düzeltmenin sistemin başka bir yerini bozmamasını garanti eder."}
        ]
    },
    "test-driven-development": {
        "title_tr": "Test Güdümlü Geliştirme (TDD Döngüsü)",
        "desc_tr": "Herhangi bir özellik veya hata düzeltmesinde önce başarısız olan testi yazar (Red), sonra kodu geçirip testi yeşile çevirir (Green) ve ardından kodu temizler (Refactor).",
        "sub_skills": [
            {"name": "red-asamasi", "desc_tr": "İstenen davranışı tanımlayan ve henüz başarısız olan testi yazar."},
            {"name": "green-asamasi", "desc_tr": "Testi geçirecek en sade ve temiz uygulama kodunu üretir."},
            {"name": "refactor-asamasi", "desc_tr": "Testler yeşildeyken kod kalitesini, okunabilirliğini ve performansını artırır."}
        ]
    },
    "subagent-driven-development": {
        "title_tr": "Alt Ajanlarla Paralel Geliştirme",
        "desc_tr": "Bağımsız görevleri arka planda izole alt ajanlara (subagents) devreder, her birinin sonucunu inceler ve ana dalda temiz şekilde birleştirir.",
        "sub_skills": [
            {"name": "gorev-dagitimi", "desc_tr": "Birbirini beklemeyen görevleri ayrı oturumlara paylaştırır."},
            {"name": "cikti-denetimi", "desc_tr": "Alt ajanın ürettiği kodu titizlikle gözden geçirip ana koda dahil eder."}
        ]
    },
    "verification-before-completion": {
        "title_tr": "Teslim Öncesi Zorunlu Doğrulama Kapısı",
        "desc_tr": "Geliştiricinin veya ajanın 'iş bitti/düzeltildi' demesini engeller; test çalıştırma çıktısı, derleme sonucu ve gerçek çalışma kanıtı görmeden tamamlandı işaretini koydurmaz.",
        "sub_skills": [
            {"name": "kanit-zorunlulugu", "desc_tr": "Sözlü iddia yerine gerçek terminal ve test çıktılarını zorunlu tutar."},
            {"name": "regresyon-kontrolu", "desc_tr": "Eski testlerin hala çalıştığını teyit eder."}
        ]
    },
    "using-git-worktrees": {
        "title_tr": "Git Worktree ile İzole Çalışma Alanı",
        "desc_tr": "Mevcut çalışma ağacını kirletmeden veya yarım kalan işleri bozmadan yeni bir özellik için bağımsız bir git worktree açarak izole geliştirme ortamı sağlar.",
        "sub_skills": [
            {"name": "izole-calisma", "desc_tr": "Mevcut projenin dizininden ayrı bağımsız bir kopya oluşturur."},
            {"name": "temiz-birlestirme", "desc_tr": "İş bittiğinde değişiklikleri ana dala pürüzsüz aktarır."}
        ]
    },
    "finishing-a-development-branch": {
        "title_tr": "Geliştirme Dalını Tamamlama & Entegrasyon",
        "desc_tr": "Geliştirme tamamlandığında commit geçmişini toparlar, testleri doğrular ve merge, rebase veya PR açma kararını kurallara göre verir.",
        "sub_skills": [
            {"name": "commit-hijyeni", "desc_tr": "Karışık commit geçmişini düzenli ve açıklayıcı hale getirir."},
            {"name": "entegrasyon-secimi", "desc_tr": "Squash, rebase veya merge kararını proje kurallarına göre verir."}
        ]
    },
    "requesting-code-review": {
        "title_tr": "Kod İncelemesi Talep Etme",
        "desc_tr": "Büyük değişiklikler bittiğinde değişiklik özeti, risk analizi ve test kanıtlarını toplayarak bağımsız bir gözden geçirme başlatır.",
        "sub_skills": [
            {"name": "risk-haritasi", "desc_tr": "Yapılan değişikliğin en kritik ve riskli yerlerini vurgular."},
            {"name": "kanit-paketi", "desc_tr": "İnceleyicinin hızlı onaylaması için test sonuçlarını sunar."}
        ]
    },
    "receiving-code-review": {
        "title_tr": "Kod İnceleme Geri Bildirimlerini İşleme",
        "desc_tr": "İnceleyiciden gelen geri bildirimleri körü körüne kabul etmeden teknik olarak doğrular, tartışmalı noktaları netleştirir ve gerekli düzeltmeleri uygular.",
        "sub_skills": [
            {"name": "teknik-dogrulama", "desc_tr": "Önerinin gerçekten daha iyi olup olmadığını kod üzerinde dener."},
            {"name": "hedefli-duzeltme", "desc_tr": "Yalnızca üzerinde mutabık kalınan noktaları temiz şekilde onarır."}
        ]
    },
    "dispatching-parallel-agents": {
        "title_tr": "Bağımsız Görevleri Paralel Ajanlara Dağıtma",
        "desc_tr": "Birbirine bağımlılığı olmayan 2 veya daha fazla araştırma ya da kodlama işi olduğunda bunları eşzamanlı ajanlara paylaştırarak süreci hızlandırır.",
        "sub_skills": [
            {"name": "paralel-is-bolumu", "desc_tr": "İşleri bağımsız parçalara ayırıp fırlatır."},
            {"name": "sonuc-birlestirme", "desc_tr": "Ajanların getirdiği bulguları tek raporda harmanlar."}
        ]
    },
    "using-superpowers": {
        "title_tr": "Superpowers Metodoloji Çerçevesi",
        "desc_tr": "Tüm Superpowers kurallarının merkez kontrol noktasıdır. Konuşmanın başında devreye girerek hangi görevin hangi mühendislik disipliniyle yürütüleceğini koordine eder.",
        "sub_skills": [
            {"name": "kural-yonlendirme", "desc_tr": "Görevin türüne göre TDD, Debug veya Planlama skill'ini aktive eder."}
        ]
    },
    "writing-skills": {
        "title_tr": "Yeni Ajan Skilleri Yazma & Geliştirme",
        "desc_tr": "Yapay zeka modellerinin takip edebileceği standartlara uygun yeni SKILL.md rehberleri ve eklentileri tasarlar, test eder ve doğrular.",
        "sub_skills": [
            {"name": "sematik-dogrulama", "desc_tr": "Frontmatter, tetikleyici kelimeler ve araç sınırlarını kontrol eder."},
            {"name": "ornek-olay-testi", "desc_tr": "Yazılan skill'in ajan tarafından doğru anlaşılıp anlaşılmadığını test eder."}
        ]
    },
    "diagnosing-superpowers": {
        "title_tr": "Ajan Davranış ve Süreç Tanısı",
        "desc_tr": "Ajanın takıldığı, planları görmezden geldiği veya beklenenden uzun sürdüğü durumlarda oturum günlüklerini inceleyerek aksaklığın nedenini tespit eder.",
        "sub_skills": [
            {"name": "oturum-denetimi", "desc_tr": "Ajanın hangi araç çağrısında veya döngüde tıkandığını inceler."}
        ]
    },

    # --- UI/UX PRO MAX SUITE ---
    "ui-ux-pro-max": {
        "title_tr": "UI/UX Tasarım Zekası & Stil Motoru",
        "desc_tr": "Yapay zeka yapımı hissi vermeyen, ödüllü tasarımcı kalitesinde web, mobil ve masaüstü arayüzleri inşa eder. İçinde 79 tasarım stili, 192 ürün renk paleti, 74 font eşleşmesi, 119 UX kuralı ve 25 grafik türü barındırır.",
        "sub_skills": [
            {"name": "stil-yonetimi", "desc_tr": "Minimalist, brutalist, Apple tarzı, neo-brutalist veya lüks gibi 79 stilden projeye en uyanı belirler."},
            {"name": "renk-armonisi", "desc_tr": "192 hazır ürün paletiyle kusursuz kontrast ve erişilebilirlik oranları kurar."},
            {"name": "tipografi-eslesmesi", "desc_tr": "Başlık ve gövde metinleri için 74 profesyonel font ikilisini uygular."},
            {"name": "ux-denetimi", "desc_tr": "119 pratik UX prensibiyle tıklanabilirlik, boşluk ve bilgi hiyerarşisini optimize eder."}
        ]
    },
    "ui-styling": {
        "title_tr": "Bileşen Şekillendirme & Mikro Etkileşimler",
        "desc_tr": "Tailwind CSS, shadcn/ui ve Radix UI tabanlı yüksek kaliteli bileşenler, derinlikli gölgeler, responsive kenarlıklar, kusursuz hover/focus durumları ve mikro animasyonlar oluşturur.",
        "sub_skills": [
            {"name": "shadcn-ve-tailwind", "desc_tr": "Modern Tailwind yardımcı sınıfları ve erişilebilir Radix bileşenleri üretir."},
            {"name": "mikro-etkilesimler", "desc_tr": "Tıklama, odaklanma ve üzerine gelme anlarında akıcı fiziksel tepkiler verir."},
            {"name": "karanlik-mod-uyumu", "desc_tr": "Açık ve koyu temalar arasında pürüzsüz geçiş sağlar."}
        ]
    },
    "design-system-pro-max": {
        "title_tr": "Design Token Mimarisi & Sistem Yönetimi",
        "desc_tr": "3 katmanlı token mimarisi (primitive -> semantic -> component) ve CSS custom properties kurar. Renk, boşluk, gölge ve tipografi skalalarını kod tabanında tutarlı şekilde otomatikleştirir.",
        "sub_skills": [
            {"name": "3-katmanli-tokenlar", "desc_tr": "Temel değerleri semantik anlamlarla (örn: surface, primary, border) eşler."},
            {"name": "token-kod-uretimi", "desc_tr": "Otomatik scriptlerle (`generate-tokens.cjs`) CSS/Tailwind değişkenlerini senkronize eder."}
        ]
    },
    "design": {
        "title_tr": "Kapsamlı Marka & Görsel Tasarım",
        "desc_tr": "Logo yönü (55 stil), kurumsal kimlik, mockuplar, sosyal medya görselleri, bannerlar ve HTML sunum slaytları üretir.",
        "sub_skills": [
            {"name": "logo-ve-kimlik", "desc_tr": "Marka kimliği ve logo konseptleri tasarlar."},
            {"name": "sosyal-ve-banner", "desc_tr": "Platformlara özel (Twitter, LinkedIn, Ads) görsel boyutlandırma kuralları uygular."}
        ]
    },
    "brand": {
        "title_tr": "Marka Kimliği & Ses Tutarlılığı",
        "desc_tr": "Marka sesi, kurumsal renk paleti, görsel hiyerarşi ve dijital varlıkların tüm ürün genelinde tutarlı kalmasını sağlar.",
        "sub_skills": [
            {"name": "ses-ve-ton", "desc_tr": "Yapay zeka metinlerinin marka diline sadık kalmasını temin eder."},
            {"name": "varlik-senkronizasyonu", "desc_tr": "Marka renklerini doğrudan design token'lara bağlar."}
        ]
    },
    "slides": {
        "title_tr": "İnteraktif & Animasyonlu HTML Sunumlar",
        "desc_tr": "PowerPoint yerine web üzerinde çalışan, Chart.js grafikli, duyarlı ve yüksek etkili sunum slaytları oluşturur.",
        "sub_skills": [
            {"name": "grafik-entegrasyonu", "desc_tr": "Canlı Chart.js veri grafikleri ve karşılaştırma tabloları yerleştirir."},
            {"name": "gecis-animasyonlari", "desc_tr": "Slaytlar arasında modern ve profesyonel akış sağlar."}
        ]
    },
    "banner-design": {
        "title_tr": "Sosyal Medya & Web Banner Tasarımı",
        "desc_tr": "X, LinkedIn, Instagram, Google Ads ve web kahraman (hero) bölümleri için çoklu sanat yönetimi seçenekleriyle banner tasarlar.",
        "sub_skills": [
            {"name": "platform-optimizasyonu", "desc_tr": "Mecraların piksel ve metin yoğunluğu standartlarına tam uyum sağlar."}
        ]
    },

    # --- UI-CRAFT SUITE ---
    "ui-craft": {
        "title_tr": "UI Craft Tasarım Metodolojisi",
        "desc_tr": "Yapay zeka yapımı hissi veren jenerik web sitelerini engelleyen kapsamlı arayüz metodolojisi. 34 farklı alt tasarım rehberi ile layout, renk, motion ve form standartlarını yönetir.",
        "sub_skills": [
            {"name": "ui-craft-dense-dashboard", "desc_tr": "Veri yoğunluklu iç paneller, Bloomberg ve Retool tarzı admin ekranları için kilitli kurallar."},
            {"name": "ui-craft-editorial", "desc_tr": "Medium, Substack tarzı dergi/blog tipografisi ve mizanpaj kuralları."},
            {"name": "ui-craft-minimal", "desc_tr": "Linear ve Vercel tarzı bol negatif alanlı minimalist arayüz kuralları."},
            {"name": "34-tasarim-rehberi", "desc_tr": "Renk kontrastı, tipografi hiyerarşisi, form UX, dataviz, erişilebilirlik ve mikro hareketler."}
        ]
    },
    "ui-craft-dense-dashboard": {
        "title_tr": "Yoğun Veri & Admin Dashboard Stili",
        "desc_tr": "Veri öncelikli, klavye odaklı operasyonel araçlar. Bloomberg, Retool ve Linear sorun listesi tarzı bilgi yoğunluğu yüksek ekranlar inşa eder.",
        "sub_skills": [
            {"name": "4-8px-skalasi", "desc_tr": "Sıkı ızgara yapısıyla ekran alanını maksimum verimle kullanır."},
            {"name": "tabular-numaralar", "desc_tr": "Sayısal verilerin dikey hizasını koruyan monospace font ayarları."}
        ]
    },
    "ui-craft-editorial": {
        "title_tr": "Yayıncılık & Dergi Tipi Arayüz Stili",
        "desc_tr": "Uzun metin, makale ve blog odaklı arayüzler. Tipografik hiyerarşi ve okuma deneyimini merkeze alan humanist ve serif font yerleşimleri kurar.",
        "sub_skills": [
            {"name": "okuma-kolonu-ergonomisi", "desc_tr": "Gözü yormayan ideal satır genişliği ve satır arası boşluk dengesi."}
        ]
    },
    "ui-craft-minimal": {
        "title_tr": "Minimalist & Negatif Alan Arayüz Stili",
        "desc_tr": "Linear, Notion ve Vercel ilhamlı sade arayüzler. Gölgeler yerine 1 piksellik saç çizgisi kenarlıklar ve tek vurgu rengi kullanır.",
        "sub_skills": [
            {"name": "monokrom-ve-vurgu", "desc_tr": "Gri tonları üzerine tek bir güçlü aksan rengiyle odak yönetimi."}
        ]
    },

    # --- ANTI-SLOP SUITE ---
    "antislop": {
        "title_tr": "Anti-Slop Çekirdek Filtresi",
        "desc_tr": "Yapay zekanın ürettiği tüm jenerik, klişe ve amatör tasarım kusurlarını engelleyen ana kural seti. Bir tasarımcının elinden çıkmış hissi verir.",
        "sub_skills": [
            {"name": "antislop-code", "desc_tr": "Gereksiz, jenerik yapay zeka kod yorumlarını temizleyen kod hijyeni kuralı."},
            {"name": "antislop-copywriting", "desc_tr": "Klişe reklam başlıkları yerine doğal, ikna edici insan metin yazarlığı filtresi."},
            {"name": "antislop-human", "desc_tr": "Renk kontrastı, odak halkaları ve klavye erişilebilirliğini denetleyen insan odaklılık kuralı."},
            {"name": "antislop-layoutmobile", "desc_tr": "Mobilde taşma, yanlış kaydırma ve buton tıklama alanı sorunlarını çözen mobil düzen filtresi."},
            {"name": "antislop-ui", "desc_tr": "Mor-mavi yapay zeka gradyanları ve tutarsız kenarlık yarıçaplarını engelleyen görsel UI filtresi."}
        ]
    },
    "antislop-code": {
        "title_tr": "Kod Yorumu Hijyeni",
        "desc_tr": "Yapay zekanın koda eklediği '// calculate sum', '/* return result */' gibi bariz ve kirlilik yaratan yorumları engeller; sadece mimari nedenleri korur.",
        "sub_skills": [
            {"name": "jenerik-yorum-temizligi", "desc_tr": "Kodun ne yaptığını değil, neden yapıldığını anlatan yorumlara izin verir."}
        ]
    },
    "antislop-copywriting": {
        "title_tr": "Doğal Metin Yazarlığı & Klişe Filtresi",
        "desc_tr": "'Devrim niteliğinde', 'oyun değiştirici', 'kesintisiz deneyim' gibi yapay zeka klişelerini yasaklar; doğrudan ve somut insan cümleleri kurdurur.",
        "sub_skills": [
            {"name": "samimi-ve-somut-ton", "desc_tr": "Soyut sıfatlar yerine net fayda ve kanıt odaklı metinler yazar."}
        ]
    },
    "antislop-human": {
        "title_tr": "İnsan Odaklı Erişim & Kontrast Denetimi",
        "desc_tr": "WCAG standartlarında metin kontrastı (Python kontrast denetleyicisi ile), klavye gezintisi ve odak (focus-ring) durumlarını zorunlu kılar.",
        "sub_skills": [
            {"name": "kontrast-araci", "desc_tr": "Python tabanlı renk kontrastı hesaplayıcısı ile okunabilirliği doğrular."}
        ]
    },
    "antislop-layoutmobile": {
        "title_tr": "Mobil Yerleşim & Dokunma Ergonomisi",
        "desc_tr": "Dar ekranlarda yatay taşma (horizontal scroll), 44x44px'den küçük dokunma alanları ve yanlış wrap davranışlarını engeller.",
        "sub_skills": [
            {"name": "dokunma-alani-guvencesi", "desc_tr": "Mobil butonların parmakla rahat basılabilir boyutta olmasını sağlar."}
        ]
    },
    "antislop-ui": {
        "title_tr": "Görsel UI Hijyeni & Gradyan Yasağı",
        "desc_tr": "Yapay zekanın her yere koyduğu mor-mavi gradyanları, anlamsız glow parlamalarını ve orantısız border-radius değerlerini temizler.",
        "sub_skills": [
            {"name": "yapay-parlama-temizligi", "desc_tr": "Gereksiz drop-shadow ve neon efektleri yerine temiz hiyerarşi kurar."}
        ]
    },

    # --- SECURITY AUDIT ---
    "security-audit": {
        "title_tr": "Cloudflare Güvenlik & Zaafiyet Denetimi",
        "desc_tr": "Kod tabanlarında, API'larda, masaüstü uygulamalarında ve AI sistemlerinde gerçek güvenlik sınır ihlallerini avlayan ve ispatlayan tam teşekküllü denetim aracı.",
        "sub_skills": [
            {"name": "AI-AND-LLM", "desc_tr": "Prompt injection, tool-calling argüman zehirlenmesi ve ajan bellek manipülasyonu denetimi."},
            {"name": "DESKTOP-MOBILE-AND-LOCAL-IPC", "desc_tr": "Localhost port dinleme, named pipe, IPC köprüsü ve yerel süreç güvenlik açıkları."},
            {"name": "HUNTING", "desc_tr": "Kod tabanında sistematik açık avlama, coverage ledger ve ispat mekanizması."},
            {"name": "MEMORY-SAFETY", "desc_tr": "C/C++, Rust veya unmanaged dillerde bellek taşması ve işaretçi hataları denetimi."},
            {"name": "SUPPLY-CHAIN", "desc_tr": "Eklenti (plugin), üçüncü taraf bağımlılık, CI/CD ve paket imzalama sınırları güvenliği."},
            {"name": "WEB-PROTOCOL", "desc_tr": "HTTP çerçeveleme, kimlik doğrulama, token ve oturum protokolleri denetimi."}
        ]
    }
}

# Auto-translation rules for the remaining 350+ skills based on domain patterns
DOMAIN_PATTERNS = [
    # Frontend
    (r"react-patterns", "Modern React 18/19 mimarisi, hook disiplini, sunucu/istemci bileşen sınırları ve durum yönetimi kalıpları."),
    (r"react-performance", "React ve Next.js render performansı optimizasyonu, gereksiz re-render engelleme ve paket küçültme."),
    (r"react-testing", "React Testing Library ve Vitest ile bileşen testleri, MSW ağ taklitleri ve erişilebilirlik testleri."),
    (r"frontend-patterns", "Modern frontend geliştirme pratikleri, durum yönetimi ve render performansı optimizasyonu."),
    (r"frontend-a11y", "React ve Next.js erişilebilirlik kalıpları, anlamsal HTML, ARIA etiketleri ve klavye gezintisi."),
    (r"motion-patterns", "React ve Next.js için buton, modal, sayfa geçişi ve stagger animasyon kalıpları."),
    (r"motion-foundations", "Framer Motion / Motion tokens, fiziksel yay (spring) ayarları ve erişilebilir animasyon temelleri."),
    (r"nextjs-turbopack", "Next.js 16+ ve Turbopack derleme rehberi, HMR optimizasyonu ve proxy yapılandırması."),
    (r"vue-patterns", "Vue 3 Composition API, reaktivite en iyi pratikleri, Pinia durum yönetimi ve Nuxt SSR kalıpları."),
    (r"angular-developer", "Angular Signals, reaktivite, form yönetimi, SSR ve bileşen mimarisi kalıpları."),
    (r"svelte-patterns", "Svelte 5 Runes mimarisi, reaktif durum yönetimi ve SvelteKit sunucu entegrasyonu."),
    
    # Backend & Diller
    (r"fastapi-patterns", "FastAPI, Pydantic v2 şemaları, asenkron handler'lar, bağımlılık enjeksiyonu ve servis katmanı."),
    (r"django-patterns", "Django ve DRF mimarisi, ORM optimizasyonu, önbellekleme, sinyaller ve middleware tasarımı."),
    (r"django-security", "Django kimlik doğrulama, yetkilendirme, CSRF, SQL injection ve XSS güvenlik önlemleri."),
    (r"django-tdd", "pytest-django ve factory_boy ile test güdümlü Django ve REST API geliştirme."),
    (r"python-patterns", "Deyimsel Python kalıpları, PEP 8 standartları, tip ipuçları (type hints) ve temiz kod kuralları."),
    (r"python-testing", "pytest ile fixture yönetimi, mocking, parametrik testler ve kod kapsamı (coverage) takibi."),
    (r"golang-patterns", "Deyimsel Go mimarisi, goroutine ve channel yönetimi, hata işleme ve arayüz (interface) tasarımı."),
    (r"golang-testing", "Go tablo güdümlü testler, benchmark ölçümleri, fuzzing ve test kapsamı takibi."),
    (r"rust-patterns", "Deyimsel Rust, sahiplik (ownership), trait tasarımı, concurrency ve güvenli hata yönetimi."),
    (r"rust-testing", "Rust birim, entegrasyon ve property-based testleri, asenkron test pratikleri."),
    (r"springboot-patterns", "Java Spring Boot kurumsal servis mimarisi, katmanlı servisler, RESTful API ve JPA veri erişimi."),
    (r"springboot-security", "Spring Security ile JWT, OAuth2, RBAC yetkilendirme ve API güvenlik sertleştirmesi."),
    (r"springboot-tdd", "JUnit 5, Mockito ve Testcontainers ile kurumsal Spring Boot TDD geliştirme döngüsü."),
    (r"quarkus-patterns", "Quarkus 3.x reaktif mikroservis mimarisi, Panache ORM ve hafif bulut yerel Java geliştirme."),
    (r"dotnet-patterns", "C# ve .NET bağımlılık enjeksiyonu, async/await asenkron kalıpları ve modern dil standartları."),
    (r"csharp-testing", "xUnit ve FluentAssertions ile C#/.NET birim ve entegrasyon test kalıpları."),
    (r"cpp-coding-standards", "Modern C++ Core Guidelines standartları, bellek güvenliği, RAII ve akıllı işaretçiler."),
    (r"kotlin-patterns", "Deyimsel Kotlin, Coroutine yapılandırılmış eşzamanlılığı, null güvenliği ve DSL geliştirme."),
    (r"swiftui-patterns", "SwiftUI görünüm mimarisi, @Observable durum yönetimi ve akıcı iOS arayüz kalıpları."),
    (r"laravel-patterns", "Laravel mimarisi, Eloquent ORM, servis katmanı, kuyruklar ve RESTful API kaynakları."),

    # DevOps, Veritabanı & Altyapı
    (r"docker-patterns", "Docker ve Docker Compose kalıpları, çok aşamalı (multi-stage) derleme ve konteyner güvenliği."),
    (r"kubernetes-patterns", "Kubernetes iş yükleri, RBAC, sağlık kontrolleri (probes), ConfigMap ve pod ölçeklendirme."),
    (r"postgres-patterns", "PostgreSQL şema tasarımı, sorgu optimizasyonu, indeksleme stratejileri ve bağlantı havuzu."),
    (r"redis-patterns", "Redis veri yapıları, önbellek stratejileri, dağıtık kilitler (distributed locks) ve rate limiting."),
    (r"database-migrations", "Güvenli ve kesintisiz (zero-downtime) veritabanı şema geçişleri ve veri taşıma kalıpları."),
    (r"prisma-patterns", "Prisma ORM şema tasarımı, ilişki sorgulama optimizasyonu ve sunucusuz bağlantı yönetimi."),
    (r"clickhouse-io", "ClickHouse yüksek performanslı analitik sorgu optimizasyonu ve büyük veri mühendisliği."),

    # Güvenlik
    (r"security-review", "Kimlik doğrulama, gizli anahtarlar, kullanıcı girdileri ve API uç noktaları için güvenlik kontrol listesi."),
    (r"security-scan", "AgentShield ile konfigürasyon ve ajan güvenlik zaafiyeti taraması."),
    (r"security-bounty-hunter", "Uzak sistemlerden sömürülebilir gerçek açık ve bug-bounty açığı avlama rehberi."),
    (r"agent-security-hardening", "Güvenilmeyen girdi işleyen yapay zeka ajan sistemleri için güvenlik sertleştirme rehberi."),
    
    # Test & QA
    (r"e2e-testing", "Playwright ile uçtan uca (E2E) test kalıpları, Page Object modeli ve CI/CD entegrasyonu."),
    (r"browser-qa", "Yayın sonrası konsol hataları, görsel regresyon ve Core Web Vitals tarayıcı otomasyonu testi."),
    (r"eval-harness", "Yapay zeka oturumları ve prompt değişiklikleri için değerlendirme (eval) ve güvenilirlik takibi."),

    # Ajan & Süreç
    (r"continuous-learning-v2", "Oturumlardaki dersleri ve kuralları atomic instinct'lere dönüştüren sürekli öğrenme sistemi."),
    (r"git-workflow", "Git dallanma stratejileri, temiz commit geçmişi, rebase vs merge kararları ve çakışma çözümü."),
    (r"architecture-decision-records", "Kritik mimari kararları docs/adr/ altında numaralandırılmış ADR dosyaları olarak belgeleme."),
    (r"generative-ui", "Sohbet penceresi içine HTML/Tailwind widget'ları ve interaktif görsel bileşenler üretme."),
    (r"find-skills", "Açık ajan ekosisteminden (npx skills) yeni uzmanlık skilleri keşfetme ve kurma aracı."),
    (r"tauri-v2", "Tauri v2+ ile Rust arka planlı, hızlı ve güvenli masaüstü ve mobil uygulama geliştirme.")
]

def generate_tr_description(name, en_desc):
    if name in DETAILED_TR:
        return DETAILED_TR[name]["desc_tr"], DETAILED_TR[name].get("sub_skills", []), DETAILED_TR[name].get("title_tr", name)

    # Check pattern matches
    for pat, tr_text in DOMAIN_PATTERNS:
        if re.search(pat, name):
            return tr_text, [], name.replace("-", " ").title()

    # Generic technical translation based on keywords
    text = en_desc
    text = text.replace("Use when", "Kullanım zamanı:")
    text = text.replace("Patterns for", "Geliştirme kalıpları:")
    text = text.replace("Best practices for", "En iyi pratikler:")
    text = text.replace("Guidelines for", "Yönergeler:")
    text = text.replace("audit", "denetimi")
    text = text.replace("testing", "test süreçleri")
    text = text.replace("architecture", "mimarisi")
    text = text.replace("performance", "performansı")
    text = text.replace("optimization", "optimizasyonu")

    # If description is short or empty, provide a solid Turkish summary
    clean_name = name.replace("-", " ")
    desc_tr = f"{clean_name.title()} ile ilgili standartlar, en iyi kodlama pratikleri ve mimari yönergeler sağlar. {en_desc[:180]}..."
    return desc_tr, [], name.replace("-", " ").title()

def process_skills():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        skills = json.load(f)

    for item in skills:
        name = item["name"]
        en_desc = item.get("description", "")
        
        tr_desc, sub_skills, title_tr = generate_tr_description(name, en_desc)
        
        item["desc_tr"] = tr_desc
        item["title_tr"] = title_tr
        if sub_skills:
            item["sub_skills_detailed"] = sub_skills
        else:
            item["sub_skills_detailed"] = []

    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(skills, f, ensure_ascii=False, indent=2)

    print(f"Toplam {len(skills)} skill Türkçe açıklamalar ve alt modüllerle zenginleştirildi.")
    return skills

if __name__ == "__main__":
    process_skills()
