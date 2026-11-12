<#
.SYNOPSIS
    GitHub tabanli skill paketlerini hem OpenCode hem Freebuff icin kurar.

.DESCRIPTION
    Iki harness'in skill kokleri:
      OpenCode  ->  ~/.config/opencode/skills/<skill>/SKILL.md
      Freebuff  ->  ~/.agents/skills/<skill>/SKILL.md
                    (Freebuff loader: resolveSkillsDirs -> homeDir/.claude/skills,
                     homeDir/.agents/skills, cwd/.claude/skills, cwd/.agents/skills;
                     sonraki oncekini ezer -> proje > global, .agents > .claude)

    Paketler gecici bir stage klasorune klonlanir, isim cakismalari icin
    yeniden adlandirma + yol yamalari uygulanir, sonra iki koke kopyalanir.

    Ucuncu hedef: bir proje klasoru (-ProjectPath). Skill'ler
    <proje>/.agents/skills icine kurulur. Freebuff agent'i thread'i proje
    kokunde calistirdiginda bu klasoru otomatik kesfeder
    (loadSkills -> cwd/.agents/skills), skill secicisinde de listelenir.

.EXAMPLE
    .\install-skills.ps1
    .\install-skills.ps1 -Package ui-ux-pro-max
    .\install-skills.ps1 -Target freebuff
    .\install-skills.ps1 -ProjectPath 'C:\projeler\site'        # projeye de kur
    .\install-skills.ps1 -Target project -ProjectPath 'C:\p'    # sadece projeye
    .\install-skills.ps1 -Force          # mevcut skill klasorlerini yeniden yazar

.NOTES
    Idempotent: -Force verilmedikce var olan skill klasorlerine dokunmaz.
#>
[CmdletBinding()]
param(
    [ValidateSet('superpowers', 'ui-ux-pro-max', 'ui-craft', 'anti-slop', 'security-audit', 'all')]
    [string]$Package = 'all',

    [ValidateSet('opencode', 'freebuff', 'both', 'project')]
    [string]$Target = 'both',

    # Verilirse <proje>\.agents\skills de hedef kok olarak eklenir.
    [string]$ProjectPath,

    [switch]$Force,

    [switch]$KeepTemp
)

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------- hedef kokler
$Roots = [ordered]@{
    opencode = Join-Path $HOME '.config\opencode\skills'
    freebuff = Join-Path $HOME '.agents\skills'
}

# ------------------------------------------------------------- paket bildirimi
# Renames: repo'daki skill adi -> bu makinede kullanilacak ad
#          (mevcut ECC skill'iyle cakisan paketler icin)
$Manifest = [ordered]@{
    'superpowers'   = @{
        Repo       = 'https://github.com/obra/superpowers.git'
        SkillsPath = 'skills'
        Renames    = @{}
    }
    'ui-ux-pro-max' = @{
        Repo       = 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git'
        SkillsPath = '.claude/skills'
        # ECC'nin tek dosyalik 'design-system' skill'i ile cakisiyor:
        # gelen paket 'design-system-pro-max' adiyla kurulur, ECC'ye dokunulmaz.
        Renames    = @{ 'design-system' = 'design-system-pro-max' }
    }
    'ui-craft'      = @{
        Repo       = 'https://github.com/educlopez/ui-craft.git'
        SkillsPath = 'skills'
        Renames    = @{}
    }
    'anti-slop'     = @{
        Repo       = 'https://github.com/miqdadbadjuber/anti-slop.git'
        SkillsPath = 'skills'
        Renames    = @{}
    }
    'security-audit' = @{
        Repo       = 'https://github.com/cloudflare/security-audit-skill.git'
        SkillsPath = 'skills'
        Renames    = @{}
    }
}

# -------------------------------------------------------------------- yardimci
function Read-TextPreservingBom {
    param([string]$Path)
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    $hasBom = ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
    $text = [System.Text.Encoding]::UTF8.GetString($bytes)
    if ($hasBom) { $text = $text.Substring(1) }
    return @{ Text = $text; HasBom = $hasBom }
}

function Write-TextPreservingBom {
    param([string]$Path, [string]$Text, [bool]$HasBom)
    $enc = New-Object System.Text.UTF8Encoding($HasBom)
    [System.IO.File]::WriteAllBytes($Path, $enc.GetBytes($Text))
}

function Invoke-RenamePatches {
    param(
        [Parameter(Mandatory)][string]$Root,
        [Parameter(Mandatory)][hashtable]$Renames
    )
    if ($Renames.Count -eq 0) { return @() }

    $changed = @()
    foreach ($file in Get-ChildItem -LiteralPath $Root -Recurse -File) {
        $old = Read-TextPreservingBom -Path $file.FullName
        $text = $old.Text
        $orig = $text

        foreach ($from in $Renames.Keys) {
            $to = $Renames[$from]

            switch ($file.Extension) {
                '.md' {
                    # 1) kardes skill'e giden goreli yollar: ../<ad>/...
                    $text = $text.Replace("../$from/", "../$to/")
                    # 2) kelime sinirli ad gecisleri (frontmatter name:, tablo, prose).
                    #    Cikti klasoru referanslari "<ad>/<proje>/..." slash icerdigi
                    #    icin eslesmez, korunur.
                    $pattern = '(?<![\w/.-])' + [regex]::Escape($from) + '(?![/\w-])'
                    $text = [regex]::Replace($text, $pattern, $to)
                }
                '.cjs' {
                    $text = $text.Replace("'..', '..', '$from'", "'..', '..', '$to'")
                }
                '.js' {
                    $text = $text.Replace("'..', '..', '$from'", "'..', '..', '$to'")
                }
                '.py' {
                    $text = $text.Replace("parent.parent / `"$from`" /", "parent.parent / `"$to`" /")
                }
            }
        }

        if ($text -ne $orig) {
            Write-TextPreservingBom -Path $file.FullName -Text $text -HasBom $old.HasBom
            $changed += $file.FullName.Substring($Root.Length).TrimStart('\')
        }
    }
    return $changed
}

function Install-SkillPackage {
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][hashtable]$Spec,
        [Parameter(Mandatory)][string[]]$DestRoots
    )

    Write-Host ""
    Write-Host "=== $Name ===" -ForegroundColor Cyan
    Write-Host "  repo: $($Spec.Repo)"

    $work = Join-Path ([System.IO.Path]::GetTempPath()) ("skill-install-" + [guid]::NewGuid().ToString('N').Substring(0, 8))
    $clone = Join-Path $work 'src'
    $stage = Join-Path $work 'stage'
    New-Item -ItemType Directory -Force -Path $work, $stage | Out-Null

    try {
        & git clone --depth 1 --quiet $Spec.Repo $clone 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "git clone basarisiz: $($Spec.Repo)" }

        $skillsSrc = Join-Path $clone $Spec.SkillsPath
        if (-not (Test-Path -LiteralPath $skillsSrc)) { throw "skill klasoru bulunamadi: $skillsSrc" }

        # --- stage'e kopyala (gerekirse yeniden adlandirarak) ---
        $staged = @()
        foreach ($dir in Get-ChildItem -LiteralPath $skillsSrc -Directory) {
            $destName = $dir.Name
            if ($Spec.Renames.ContainsKey($dir.Name)) { $destName = $Spec.Renames[$dir.Name] }
            Copy-Item -LiteralPath $dir.FullName -Destination (Join-Path $stage $destName) -Recurse -Force
            $staged += $destName
        }
        Write-Host ("  stage: {0} skill" -f $staged.Count)

        # --- yeniden adlandirma kaynakli yol yamalari ---
        $patched = Invoke-RenamePatches -Root $stage -Renames $Spec.Renames
        if ($patched.Count -gt 0) {
            Write-Host ("  yama: {0} dosya" -f $patched.Count)
        }

        # --- hedef koklere dagit ---
        foreach ($root in $DestRoots) {
            if (-not (Test-Path -LiteralPath $root)) {
                New-Item -ItemType Directory -Force -Path $root | Out-Null
                Write-Host "  + kok olusturuldu: $root"
            }
            foreach ($name in $staged) {
                $dest = Join-Path $root $name
                if (Test-Path -LiteralPath $dest) {
                    if (-not $Force) { continue }
                    Remove-Item -LiteralPath $dest -Recurse -Force
                }
                Copy-Item -LiteralPath (Join-Path $stage $name) -Destination $dest -Recurse -Force
            }
        }
    }
    finally {
        if (-not $KeepTemp) {
            Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
        }
        else {
            Write-Host "  temp korundu: $work"
        }
    }

    return $staged
}

# ----------------------------------------------------------------------- calis
$names = if ($Package -eq 'all') { @($Manifest.Keys) } else { @($Package) }

$destRoots = @()
switch ($Target) {
    'both'    { $destRoots = @($Roots.opencode, $Roots.freebuff) }
    'project' { $destRoots = @() }
    default   { $destRoots = @($Roots[$Target]) }
}

if ($ProjectPath) {
    if (-not (Test-Path -LiteralPath $ProjectPath -PathType Container)) {
        throw "Proje klasoru bulunamadi: $ProjectPath"
    }
    $projRoot = (Resolve-Path -LiteralPath $ProjectPath).Path
    $projSkills = Join-Path $projRoot '.agents\skills'
    if ($destRoots -notcontains $projSkills) { $destRoots += $projSkills }
}
elseif ($Target -eq 'project') {
    throw "-Target project icin -ProjectPath vermelisin."
}

Write-Host "Hedef kokler:" -ForegroundColor Yellow
foreach ($r in $destRoots) { Write-Host "  $r" }
if ($Force) { Write-Host "  (-Force: var olan klasorler yeniden yazilacak)" -ForegroundColor DarkYellow }

$allStaged = @{}
foreach ($n in $names) {
    $allStaged[$n] = Install-SkillPackage -Name $n -Spec $Manifest[$n] -DestRoots $destRoots
}

# -------------------------------------------------------------------- dogrula
Write-Host ""
Write-Host "=== DOGRULAMA ===" -ForegroundColor Cyan
$fail = 0
foreach ($root in $destRoots) {
    $total = (Get-ChildItem -LiteralPath $root -Directory -ErrorAction SilentlyContinue).Count
    Write-Host ("{0}  ({1} skill toplam)" -f $root, $total) -ForegroundColor Gray
    foreach ($n in $names) {
        foreach ($skill in $allStaged[$n]) {
            $p = Join-Path $root "$skill\SKILL.md"
            if (Test-Path -LiteralPath $p) {
                $raw = Read-TextPreservingBom -Path $p
                $fmName = '?'
                if ($raw.Text -match '(?m)^name:\s*(.+)$') { $fmName = $matches[1].Trim() }
                $files = (Get-ChildItem -LiteralPath (Join-Path $root $skill) -Recurse -File).Count
                $flag = 'OK'
                if ($fmName -ne $skill) { $flag = "AD UYUMSUZ (name: $fmName)" ; $fail++ }
                Write-Host ("  {0,-24} {1,4} dosya  {2}" -f $skill, $files, $flag) -ForegroundColor Green
            }
            else {
                Write-Host ("  {0,-24} EKSIK" -f $skill) -ForegroundColor Red
                $fail++
            }
        }
    }
}

Write-Host ""
if ($fail -eq 0) {
    Write-Host "Tamam. Freebuff'i kapatip acmayi unutma (skill'ler acilista yukleniyor)." -ForegroundColor Green
}
else {
    Write-Host "$fail sorun bulundu." -ForegroundColor Red
    exit 1
}
