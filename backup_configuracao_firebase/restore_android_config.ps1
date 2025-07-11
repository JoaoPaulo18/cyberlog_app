# Script de Restauração das Configurações Android para Firebase
# Execute este script APÓS rodar 'expo prebuild'

Write-Host "🔄 Iniciando restauração das configurações Android..." -ForegroundColor Green

# Definir caminhos
$projectRoot = Split-Path -Parent $PSScriptRoot
$backupDir = "$PSScriptRoot\android_config"
$androidDir = "$projectRoot\android"

# Verificar se existe backup
if (-not (Test-Path $backupDir)) {
    Write-Host "❌ Diretório de backup não encontrado: $backupDir" -ForegroundColor Red
    Write-Host "Execute primeiro o script backup_android_config.ps1" -ForegroundColor Yellow
    exit 1
}

# Verificar se existe diretório android (deve existir após prebuild)
if (-not (Test-Path $androidDir)) {
    Write-Host "❌ Diretório android não encontrado: $androidDir" -ForegroundColor Red
    Write-Host "Execute 'expo prebuild' primeiro" -ForegroundColor Yellow
    exit 1
}

# Função para restaurar com log
function Restore-File {
    param($Source, $Destination, $Description)
    
    if (Test-Path $Source) {
        $destDir = Split-Path -Parent $Destination
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force
        }
        Copy-Item -Path $Source -Destination $Destination -Force
        Write-Host "✅ $Description - Restaurado com sucesso" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $Description - Backup não encontrado: $Source" -ForegroundColor Yellow
    }
}

# Restaurar arquivos
Write-Host "`n📁 Restaurando arquivos de configuração..." -ForegroundColor Cyan

# Build Gradle (root)
Restore-File "$backupDir\build.gradle" "$androidDir\build.gradle" "Root build.gradle"

# Build Gradle (app)
Restore-File "$backupDir\app_build.gradle" "$androidDir\app\build.gradle" "App build.gradle"

# AndroidManifest.xml
Restore-File "$backupDir\AndroidManifest.xml" "$androidDir\app\src\main\AndroidManifest.xml" "AndroidManifest.xml"

# MainApplication.kt
Restore-File "$backupDir\MainApplication.kt" "$androidDir\app\src\main\java\com\draxS2\cyberlog_app\MainApplication.kt" "MainApplication.kt"

# gradle.properties
Restore-File "$backupDir\gradle.properties" "$androidDir\gradle.properties" "gradle.properties"

# colors.xml
Restore-File "$backupDir\colors.xml" "$androidDir\app\src\main\res\values\colors.xml" "colors.xml"

# .easignore
Restore-File "$backupDir\.easignore" "$projectRoot\.easignore" ".easignore"

# app.json (restaurar apenas se não existir ou se for diferente)
if (Test-Path "$backupDir\app.json") {
    if (Test-Path "$projectRoot\app.json") {
        Write-Host "⚠️  app.json já existe. Verificando diferenças..." -ForegroundColor Yellow
        $currentContent = Get-Content "$projectRoot\app.json" -Raw
        $backupContent = Get-Content "$backupDir\app.json" -Raw
        
        if ($currentContent -ne $backupContent) {
            Write-Host "📝 Diferenças encontradas no app.json" -ForegroundColor Yellow
            Write-Host "Você pode querer revisar manualmente as configurações do Android" -ForegroundColor Yellow
        }
    } else {
        Restore-File "$backupDir\app.json" "$projectRoot\app.json" "app.json"
    }
}

# Verificar timestamp do backup
$timestampFile = "$backupDir\backup_timestamp.txt"
if (Test-Path $timestampFile) {
    $timestamp = Get-Content $timestampFile
    Write-Host "`n🕒 $timestamp" -ForegroundColor Gray
}

Write-Host "`n🎉 Restauração concluída!" -ForegroundColor Green
Write-Host "📱 Agora você pode fazer o build do app com as configurações do Firebase" -ForegroundColor Cyan
Write-Host "🚀 Execute: eas build --platform android --profile preview" -ForegroundColor Yellow
