"""
Generates an interactive, dark-mode, high-end Web Dashboard for comparing OpenCode vs Freebuff Skills
with complete Turkish descriptions and detailed sub-skill breakdowns.
"""

import json
import os

DATA_PATH = r"C:\Users\batuhan\Desktop\IDE\skills_data.json"
HTML_PATH = r"C:\Users\batuhan\Desktop\IDE\skills_matrix.html"

with open(DATA_PATH, "r", encoding="utf-8") as f:
    skills_data = json.load(f)

oc_count = len([s for s in skills_data if s['in_opencode']])
fb_count = len([s for s in skills_data if s['in_freebuff']])
common_count = len([s for s in skills_data if s['status'] == 'Ortak'])
diff_count = len([s for s in skills_data if s['status'] != 'Ortak'])

html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenCode & Freebuff Skill Kataloğu ve Türkçe Rehberi</title>
  <style>
    :root {{
      --bg: #090d16;
      --card-bg: rgba(17, 24, 39, 0.75);
      --card-border: rgba(255, 255, 255, 0.08);
      --accent-blue: #38bdf8;
      --accent-green: #34d399;
      --accent-purple: #c084fc;
      --accent-orange: #fb923c;
      --accent-red: #f87171;
      --text-main: #f3f4f6;
      --text-muted: #94a3b8;
    }}
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }}
    body {{
      background: radial-gradient(circle at 50% 0%, #171b30 0%, var(--bg) 60%);
      color: var(--text-main);
      min-height: 100vh;
      padding: 36px 20px 90px 20px;
    }}
    .container {{
      max-width: 1440px;
      margin: 0 auto;
    }}
    /* Header */
    header {{
      text-align: center;
      margin-bottom: 40px;
    }}
    .badge-hero {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: var(--accent-blue);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }}
    h1 {{
      font-size: 38px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #ffffff 40%, #94a3b8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }}
    p.lead {{
      color: var(--text-muted);
      font-size: 16px;
      max-width: 780px;
      margin: 0 auto;
      line-height: 1.6;
    }}
    /* Stat Cards */
    .stats-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }}
    .stat-card {{
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      backdrop-filter: blur(12px);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    }}
    .stat-card::before {{
      content: "";
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: var(--bar-color, var(--accent-blue));
    }}
    .stat-label {{
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 8px;
    }}
    .stat-number {{
      font-size: 34px;
      font-weight: 800;
      color: #fff;
    }}
    .stat-sub {{
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 4px;
    }}
    /* Search & Filter Bar */
    .controls-wrapper {{
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      backdrop-filter: blur(16px);
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 32px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
    }}
    .search-input-wrapper {{
      position: relative;
      width: 100%;
    }}
    .search-input {{
      width: 100%;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 14px 18px 14px 44px;
      color: #fff;
      font-size: 15px;
      outline: none;
      transition: all 0.2s;
    }}
    .search-input:focus {{
      border-color: var(--accent-blue);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
    }}
    .search-icon {{
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: #6b7280;
      font-size: 16px;
    }}
    .filter-pills {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }}
    .pill {{
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: var(--text-muted);
      padding: 7px 14px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }}
    .pill:hover {{
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }}
    .pill.active {{
      background: var(--accent-blue);
      border-color: var(--accent-blue);
      color: #000;
      box-shadow: 0 0 16px rgba(56, 189, 248, 0.4);
    }}
    /* Mode Legend */
    .legend-bar {{
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      padding: 12px 16px;
      background: rgba(0,0,0,0.3);
      border-radius: 12px;
      font-size: 12px;
      color: var(--text-muted);
      align-items: center;
    }}
    .legend-item {{
      display: flex;
      align-items: center;
      gap: 6px;
    }}
    /* Grid */
    .skills-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
      gap: 18px;
    }}
    .skill-card {{
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 22px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
    }}
    .skill-card:hover {{
      border-color: rgba(56, 189, 248, 0.4);
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(0,0,0,0.4);
    }}
    .card-top {{
      margin-bottom: 16px;
    }}
    .card-badges {{
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }}
    .badge {{
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }}
    .badge-category {{
      background: rgba(192, 132, 252, 0.15);
      border: 1px solid rgba(192, 132, 252, 0.3);
      color: var(--accent-purple);
    }}
    .badge-auto {{
      background: rgba(52, 211, 153, 0.15);
      border: 1px solid rgba(52, 211, 153, 0.3);
      color: #34d399;
    }}
    .badge-manual {{
      background: rgba(251, 146, 60, 0.15);
      border: 1px solid rgba(251, 146, 60, 0.3);
      color: #fb923c;
    }}
    .badge-hybrid {{
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #38bdf8;
    }}
    .skill-title-tr {{
      font-size: 18px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.3;
      margin-bottom: 4px;
    }}
    .skill-name-raw {{
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      color: var(--accent-blue);
      margin-bottom: 10px;
      display: inline-block;
    }}
    .skill-desc-tr {{
      font-size: 13.5px;
      color: #e2e8f0;
      line-height: 1.55;
      margin-bottom: 14px;
    }}
    /* Sub skills detailed container */
    .sub-skills-container {{
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 14px;
    }}
    .sub-skills-header {{
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      color: var(--accent-purple);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }}
    .sub-skills-list-detailed {{
      display: flex;
      flex-direction: column;
      gap: 6px;
    }}
    .sub-skill-row {{
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 4px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }}
    .sub-skill-row:last-child {{
      border-bottom: none;
    }}
    .sub-name {{
      font-family: ui-monospace, SFMono-Regular, monospace;
      font-size: 11px;
      font-weight: 700;
      color: #38bdf8;
    }}
    .sub-desc {{
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.4;
    }}
    /* Side-by-side Availability Bar */
    .presence-bar {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-top: 14px;
      font-size: 12px;
    }}
    .presence-item {{
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: 8px;
      font-weight: 600;
    }}
    .presence-item.installed {{
      background: rgba(16, 185, 129, 0.12);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.25);
    }}
    .presence-item.missing {{
      background: rgba(239, 68, 68, 0.12);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.25);
    }}
    .presence-dot {{
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
    }}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="badge-hero">⚡ Eksiksiz Türkçe Skill Rehberi</div>
      <h1>OpenCode & Freebuff Skill Kataloğu</h1>
      <p class="lead">Tüm ana skillerin Türkçe amaçları, alt skillerin detaylı açıklamaları, tetiklenme biçimleri ve her iki ortamda %100 eşitlenmiş canlı yetenek matrisi.</p>
    </header>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card" style="--bar-color: var(--accent-blue)">
        <span class="stat-label">OpenCode Toplam</span>
        <span class="stat-number">{oc_count}</span>
        <span class="stat-sub">~/.config/opencode/skills</span>
      </div>
      <div class="stat-card" style="--bar-color: var(--accent-purple)">
        <span class="stat-label">Freebuff Toplam</span>
        <span class="stat-number">{fb_count}</span>
        <span class="stat-sub">Global & Proje Düzeyi</span>
      </div>
      <div class="stat-card" style="--bar-color: var(--accent-green)">
        <span class="stat-label">Ortak Yüklü Skiller</span>
        <span class="stat-number">{common_count}</span>
        <span class="stat-sub">Her iki ortamda da aktif</span>
      </div>
      <div class="stat-card" style="--bar-color: var(--accent-orange)">
        <span class="stat-label">Farklılıklar</span>
        <span class="stat-number">{diff_count}</span>
        <span class="stat-sub">{"Tam Uyum (%100 Eşitlendi!)" if diff_count == 0 else f"{diff_count} adet fark"}</span>
      </div>
    </div>

    <!-- Controls -->
    <div class="controls-wrapper">
      <div class="search-input-wrapper">
        <span class="search-icon">🔍</span>
        <input type="text" id="searchInput" class="search-input" placeholder="Türkçe açıklama, ana skill veya alt modül ara (Örn: hata ayıklama, tdd, dashboard, prompt injection, react, docker)...">
      </div>
      <div class="filter-pills" id="categoryFilters">
        <button class="pill active" data-filter="all">Tümü (378)</button>
        <button class="pill" data-filter="Superpowers Suite">Superpowers (15)</button>
        <button class="pill" data-filter="UI/UX Pro Max Suite">UI/UX Pro Max (7)</button>
        <button class="pill" data-filter="UI-Craft Suite">UI-Craft (4)</button>
        <button class="pill" data-filter="Anti-Slop Suite">Anti-Slop (6)</button>
        <button class="pill" data-filter="Güvenlik & Denetim">Güvenlik & Denetim (18)</button>
        <button class="pill" data-filter="Frontend & UI">Frontend & UI (19)</button>
        <button class="pill" data-filter="Backend & Diller">Backend & Diller (39)</button>
        <button class="pill" data-filter="DevOps & Veritabanı">DevOps & Veritabanı (10)</button>
      </div>
      <div class="legend-bar">
        <span>Tetiklenme Türü:</span>
        <div class="legend-item"><span class="badge badge-auto">⚡ Otomatik</span> Model bağlama ve kod türüne göre kendisi çağırır</div>
        <div class="legend-item"><span class="badge badge-manual">🎯 Seçilerek</span> Kullanıcının komutla veya menüden seçmesi gerekir</div>
        <div class="legend-item"><span class="badge badge-hybrid">🔄 Hibrit</span> Hem bağlamdan otomatik hem elle seçilebilir</div>
      </div>
    </div>

    <!-- Grid -->
    <div class="skills-grid" id="skillsGrid"></div>
  </div>

  <script>
    const skills = {json.dumps(skills_data, ensure_ascii=False)};
    const grid = document.getElementById('skillsGrid');
    const searchInput = document.getElementById('searchInput');
    const pills = document.querySelectorAll('.pill');

    let currentFilter = 'all';
    let searchQuery = '';

    function render() {{
      const q = searchQuery.toLowerCase();
      const filtered = skills.filter(item => {{
        const inName = item.name.toLowerCase().includes(q);
        const inTitle = (item.title_tr || '').toLowerCase().includes(q);
        const inDescTr = (item.desc_tr || '').toLowerCase().includes(q);
        const inDescEn = (item.description || '').toLowerCase().includes(q);
        const inCat = item.category.toLowerCase().includes(q);
        const inSubs = item.sub_skills_detailed && item.sub_skills_detailed.some(s => 
          s.name.toLowerCase().includes(q) || s.desc_tr.toLowerCase().includes(q)
        );

        if (!inName && !inTitle && !inDescTr && !inDescEn && !inCat && !inSubs) return false;

        if (currentFilter === 'all') return true;
        return item.category === currentFilter;
      }});

      grid.innerHTML = filtered.map(item => {{
        let modeBadgeClass = 'badge-hybrid';
        if (item.mode.includes('Otomatik')) modeBadgeClass = 'badge-auto';
        if (item.mode.includes('Seçilerek')) modeBadgeClass = 'badge-manual';

        const hasDetailedSubs = item.sub_skills_detailed && item.sub_skills_detailed.length > 0;
        const subSkillsHtml = hasDetailedSubs ? `
          <div class="sub-skills-container">
            <div class="sub-skills-header">Alt Skiller / Modüller (${{item.sub_skills_detailed.length}}):</div>
            <div class="sub-skills-list-detailed">
              ${{item.sub_skills_detailed.map(s => `
                <div class="sub-skill-row">
                  <span class="sub-name">🔹 ${{s.name}}</span>
                  <span class="sub-desc">${{s.desc_tr}}</span>
                </div>
              `).join('')}}
            </div>
          </div>
        ` : '';

        return `
          <div class="skill-card">
            <div class="card-top">
              <div class="card-badges">
                <span class="badge badge-category">${{item.category}}</span>
                <span class="badge ${{modeBadgeClass}}">${{item.mode}}</span>
              </div>
              <h3 class="skill-title-tr">${{item.title_tr || item.name}}</h3>
              <span class="skill-name-raw"><code>${{item.name}}</code></span>
              <p class="skill-desc-tr">${{item.desc_tr || item.description}}</p>
              ${{subSkillsHtml}}
            </div>
            <div class="presence-bar">
              <div class="presence-item ${{item.in_opencode ? 'installed' : 'missing'}}">
                <span class="presence-dot"></span>
                <span>OpenCode: ${{item.in_opencode ? 'Yüklü' : 'Yok'}}</span>
              </div>
              <div class="presence-item ${{item.in_freebuff ? 'installed' : 'missing'}}">
                <span class="presence-dot"></span>
                <span>Freebuff: ${{item.in_freebuff ? 'Yüklü' : 'Yok'}}</span>
              </div>
            </div>
          </div>
        `;
      }}).join('');
    }}

    searchInput.addEventListener('input', (e) => {{
      searchQuery = e.target.value.trim();
      render();
    }});

    pills.forEach(pill => {{
      pill.addEventListener('click', () => {{
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentFilter = pill.getAttribute('data-filter');
        render();
      }});
    }});

    render();
  </script>
</body>
</html>
"""

with open(HTML_PATH, "w", encoding="utf-8") as f:
    f.write(html)

print(f"Türkçe Web Sayfası Başarıyla Üretildi: {HTML_PATH} ({len(html)} byte)")
