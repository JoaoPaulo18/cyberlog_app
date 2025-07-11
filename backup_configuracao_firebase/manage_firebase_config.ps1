# Script Completo: Prebuild + Restauração Automática
# Este script faz backup, roda prebuild e restaura as configurações

param(
    [switch]$SkipPrebuild,
    [switch]$OnlyBackup,
    [switch]$OnlyRestore
)

Write-Host "🚀 CyberLog App - Gerenciador de Configurações Firebase" -ForegroundColor Magenta
Write-Host "=" * 60 -ForegroundColor Gray

$scriptDir = $PSScriptRoot
$projectRoot = Split-Path -Parent $scriptDir

if ($OnlyRestore) {
    Write-Host "🔄 Executando APENAS restauração..." -ForegroundColor Yellow
    & "$scriptDir\restore_android_config.ps1"
    exit
}

if ($OnlyBackup) {
    Write-Host "💾 Executando APENAS backup..." -ForegroundColor Yellow
    & "$scriptDir\backup_android_config.ps1"
    exit
}

# Processo completo
Write-Host "📋 Executando processo completo:" -ForegroundColor Cyan
Write-Host "1. Backup das configurações" -ForegroundColor White
Write-Host "2. Expo prebuild (se não usar -SkipPrebuild)" -ForegroundColor White
Write-Host "3. Restauração das configurações" -ForegroundColor White
Write-Host ""

# Passo 1: Backup
Write-Host "📥 PASSO 1: Backup das configurações..." -ForegroundColor Blue
& "$scriptDir\backup_android_config.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro no backup. Abortando..." -ForegroundColor Red
    exit 1
}

# Passo 2: Prebuild (se não for pulado)
if (-not $SkipPrebuild) {
    Write-Host "`n🔨 PASSO 2: Executando expo prebuild..." -ForegroundColor Blue
    Set-Location $projectRoot
    
    Write-Host "Executando: expo prebuild --clear" -ForegroundColor Gray
    npx expo prebuild --clear
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro no prebuild. Tentando restaurar configurações..." -ForegroundColor Red
        & "$scriptDir\restore_android_config.ps1"
        exit 1
    }
} else {
    Write-Host "`n⏭️  PASSO 2: Prebuild pulado (--SkipPrebuild)" -ForegroundColor Yellow
}

# Passo 3: Restauração
Write-Host "`n📤 PASSO 3: Restaurando configurações..." -ForegroundColor Blue
& "$scriptDir\restore_android_config.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro na restauração" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 PROCESSO CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "✅ Backup realizado" -ForegroundColor Green
if (-not $SkipPrebuild) {
    Write-Host "✅ Prebuild executado" -ForegroundColor Green
}
Write-Host "✅ Configurações restauradas" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Próximos passos:" -ForegroundColor Cyan
Write-Host "   eas build --platform android --profile preview" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Uso do script:" -ForegroundColor Gray
Write-Host "   .\manage_firebase_config.ps1                    # Processo completo"
Write-Host "   .\manage_firebase_config.ps1 -SkipPrebuild      # Pula o prebuild"
Write-Host "   .\manage_firebase_config.ps1 -OnlyBackup        # Apenas backup"
Write-Host "   .\manage_firebase_config.ps1 -OnlyRestore       # Apenas restauração"
