$ErrorActionPreference = 'Stop'

$freebuffPath = "C:\Users\batuhan\freebuff2api"
$agyPath = "C:\Users\batuhan\agy2api"
$dotFreebuffPath = "C:\Users\batuhan\.freebuff"
$opencodeAuthPath = "C:\Users\batuhan\opencode-antigravity-auth"
$desktopShortcut = "C:\Users\batuhan\Desktop\Antigravity API.lnk"

Write-Output "=== SILME ISLEMLERI BASLIYOR ==="

if (Test-Path $freebuffPath) {
    Remove-Item -Path $freebuffPath -Recurse -Force
    Write-Output "[OK] freebuff2api tamamen silindi"
} else {
    Write-Output "[BULUNAMADI] freebuff2api dizini bulunamadi"
}

if (Test-Path $agyPath) {
    Remove-Item -Path $agyPath -Recurse -Force
    Write-Output "[OK] agy2api tamamen silindi"
} else {
    Write-Output "[BULUNAMADI] agy2api dizini bulunamadi"
}

if (Test-Path $dotFreebuffPath) {
    Remove-Item -Path $dotFreebuffPath -Recurse -Force
    Write-Output "[OK] .freebuff tamamen silindi"
} else {
    Write-Output "[BULUNAMADI] .freebuff dizini bulunamadi"
}

if (Test-Path $opencodeAuthPath) {
    Remove-Item -Path $opencodeAuthPath -Recurse -Force
    Write-Output "[OK] opencode-antigravity-auth tamamen silindi"
} else {
    Write-Output "[BULUNAMADI] opencode-antigravity-auth dizini bulunamadi"
}

if (Test-Path $desktopShortcut) {
    Remove-Item -Path $desktopShortcut -Force
    Write-Output "[OK] Antigravity API kismi (lnk) silindi"
} else {
    Write-Output "[BULUNAMADI] Antigravity API kismi bulunamadi"
}

Write-Output "=== SILME ISLEMLERI TAMAMLANDI ==="
