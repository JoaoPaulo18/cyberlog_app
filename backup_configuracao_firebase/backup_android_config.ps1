# Script de Backup das Configurações Android
# Execute este script antes de rodar 'expo prebuild'

Write-Host "🔄 Iniciando backup das configurações Android..." -ForegroundColor Green

# Definir caminhos
$projectRoot = Split-Path -Parent $PSScriptRoot
$backupDir = "$PSScriptRoot\android_config"
$androidDir = "$projectRoot\android"

# Criar diretório de backup se não existir
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force
}

# Função para backup com log
function Backup-File {
    param($Source, $Destination, $Description)
    
    if (Test-Path $Source) {
        $destDir = Split-Path -Parent $Destination
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force
        }
        Copy-Item -Path $Source -Destination $Destination -Force
        Write-Host "✅ $Description - Backup realizado" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $Description - Arquivo não encontrado: $Source" -ForegroundColor Yellow
    }
}

# Backup dos arquivos principais
Write-Host "`n📁 Fazendo backup dos arquivos de configuração..." -ForegroundColor Cyan

# Build Gradle (root)
Backup-File "$androidDir\build.gradle" "$backupDir\build.gradle" "Root build.gradle"

# Build Gradle (app)
Backup-File "$androidDir\app\build.gradle" "$backupDir\app_build.gradle" "App build.gradle"

# AndroidManifest.xml
Backup-File "$androidDir\app\src\main\AndroidManifest.xml" "$backupDir\AndroidManifest.xml" "AndroidManifest.xml"

# MainApplication.kt
Backup-File "$androidDir\app\src\main\java\com\draxS2\cyberlog_app\MainApplication.kt" "$backupDir\MainApplication.kt" "MainApplication.kt"

# gradle.properties
Backup-File "$androidDir\gradle.properties" "$backupDir\gradle.properties" "gradle.properties"

# colors.xml
Backup-File "$androidDir\app\src\main\res\values\colors.xml" "$backupDir\colors.xml" "colors.xml"

# .easignore
Backup-File "$projectRoot\.easignore" "$backupDir\.easignore" ".easignore"

# app.json (partes relacionadas ao Android)
Backup-File "$projectRoot\app.json" "$backupDir\app.json" "app.json"

# Criar arquivo de timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$timestampFile = "$backupDir\backup_timestamp.txt"
"Backup realizado em: $timestamp" | Out-File -FilePath $timestampFile -Encoding UTF8

Write-Host "`n🎉 Backup concluído com sucesso!" -ForegroundColor Green
Write-Host "📂 Arquivos salvos em: $backupDir" -ForegroundColor Cyan
Write-Host "🕒 Timestamp: $timestamp" -ForegroundColor Gray
