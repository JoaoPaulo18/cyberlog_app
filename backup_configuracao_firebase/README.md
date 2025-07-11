# Sistema de Backup e Restauração Android - CyberLog App

## 🎯 Visão Geral

Este sistema resolve o problema das configurações do Android serem perdidas quando você executa `expo prebuild`. Agora você tem scripts automáticos para backup e restauração de todas as configurações importantes.

## 📁 Estrutura dos Scripts

### Scripts Principais

- `backup_android_config.ps1` - Faz backup de todas as configurações
- `restore_android_config.ps1` - Restaura as configurações após prebuild
- `manage_firebase_config.ps1` - Script completo que faz tudo automaticamente

### Diretório de Backup

- `android_config/` - Contém todos os arquivos de configuração salvos

## 🚀 Como Usar

### Método 1: Script Automático (Recomendado)

```powershell
# Processo completo: backup + prebuild + restauração
.\manage_firebase_config.ps1

# Apenas fazer backup
.\manage_firebase_config.ps1 -OnlyBackup

# Apenas restaurar (após prebuild manual)
.\manage_firebase_config.ps1 -OnlyRestore

# Fazer backup e restaurar (sem prebuild)
.\manage_firebase_config.ps1 -SkipPrebuild
```

### Método 2: Scripts Individuais

```powershell
# 1. Fazer backup antes do prebuild
.\backup_android_config.ps1

# 2. Executar prebuild
expo prebuild --clear

# 3. Restaurar configurações
.\restore_android_config.ps1

# 4. Fazer build
eas build --platform android --profile preview
```

## 📋 Arquivos Configurados Automaticamente

### 1. **android/build.gradle** (Root)

- Versão do Android Gradle Plugin: 8.3.0
- Versão do Kotlin: 2.1.21
- SDKs: compileSdk 35, targetSdk 35, minSdk 24

### 2. **android/app/build.gradle**

- Configurações de compatibilidade do Kotlin
- Namespace correto: com.draxS2.cyberlog_app
- ApplicationId correto: com.draxS2.cyberlog_app

### 3. **android/app/src/main/AndroidManifest.xml**

- Permissões necessárias para o app
- Configurações básicas da aplicação

### 4. **android/app/src/main/java/com/draxS2/cyberlog_app/MainApplication.kt**

- Configuração padrão do Expo mantida
- Estrutura correta da aplicação

### 5. **android/gradle.properties**

- `android.overridePathCheck=true`
- Configurações de memória otimizadas
- `org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m`

### 6. **android/app/src/main/res/values/colors.xml**

- Cores necessárias para o build
- iconBackground definida para evitar erros

### 7. **.easignore**

- Configurações de arquivos ignorados no build EAS
- Exclusões necessárias para o build funcionar

### 8. **app.json**

- Configurações do Android SDK
- compileSdkVersion, targetSdkVersion, minSdkVersion definidos

### ⚠️ IMPORTANTE: Arquivo google-services.json

O arquivo `android/app/google-services.json` é **OBRIGATÓRIO** para o build funcionar. Atualmente existe um arquivo de exemplo com valores placeholder.

### Como obter o arquivo real:

1. **Acesse o Firebase Console**: https://console.firebase.google.com/
2. **Selecione seu projeto** (ou crie um novo)
3. **Vá em Project Settings** (ícone da engrenagem)
4. **Na aba "General"**, role até "Your apps"
5. **Clique no ícone do Android** ou "Add app" se não existir
6. **Configure o app Android**:
   - **Android package name**: `com.draxS2.cyberlog_app`
   - **App nickname**: `cyberlog_app` (opcional)
   - **Debug signing certificate SHA-1**: (opcional para desenvolvimento)
7. **Clique em "Register app"**
8. **Baixe o google-services.json**
9. **Substitua** o arquivo em `android/app/google-services.json`

### Verificações importantes:

```json
{
  "client": [
    {
      "client_info": {
        "android_client_info": {
          "package_name": "com.draxS2.cyberlog_app"
        }
      }
    }
  ]
}
```

- ✅ O `package_name` deve ser exatamente `com.draxS2.cyberlog_app`
- ✅ O arquivo deve estar em `android/app/google-services.json`
- ✅ O arquivo está incluído no `.easignore` com `!android/app/google-services.json`

### Serviços Firebase necessários:

No Firebase Console, habilite:

- **Authentication** (se usando login Firebase)
- **Cloud Messaging** (para push notifications)
- **Analytics** (opcional, mas recomendado)

### Teste local:

```powershell
# Verificar se o arquivo existe
Test-Path "android/app/google-services.json"

# Verificar o package_name no arquivo
Get-Content "android/app/google-services.json" | ConvertFrom-Json | Select-Object -ExpandProperty client | Select-Object -ExpandProperty client_info | Select-Object -ExpandProperty android_client_info | Select-Object package_name
```

## 🔧 Funcionalidades dos Scripts

### Backup Script

- ✅ Identifica automaticamente todos os arquivos importantes
- ✅ Cria backup com timestamp
- ✅ Log detalhado de cada arquivo
- ✅ Verifica se os arquivos existem antes do backup

### Restauração Script

- ✅ Verifica se o backup existe
- ✅ Cria diretórios necessários automaticamente
- ✅ Log detalhado de cada restauração
- ✅ Trata app.json de forma especial (evita conflitos)

### Script Completo

- ✅ Processo automático completo
- ✅ Tratamento de erros em cada etapa
- ✅ Opções flexíveis via parâmetros
- ✅ Instruções claras do próximo passo

## 🎯 Configuração do Token Expo Push

### Fluxo Atual

1. **Login bem-sucedido** → Gera token Expo Push
2. **Token salvo** → Tabela `profiles` do Supabase
3. **Campo**: `expo_push_token`
4. **Logs**: Via `Alert.alert()` para debug em produção

### Código no LoginScreen.js

```javascript
// Após login bem-sucedido
const pushToken = await registerForPushNotificationsAsync();
if (pushToken) {
  await savePushTokenToSupabase(user.id, pushToken);
}
```

## 🐛 Debug e Logs

### Logs Visíveis em Produção

- `Alert.alert()` usado para logs importantes
- Logs no LoginScreen.js e App.js
- Mensagens de erro do Firebase claramente identificadas

### Pontos de Log

- Geração do token Expo Push
- Salvamento no Supabase
- Erros de permissão
- Status do Firebase

## ⚠️ Notas Importantes

### Antes de Usar

1. Certifique-se que o `google-services.json` está correto
2. Verifique se o package name é `com.draxS2.cyberlog_app`
3. Teste o script em um branch separado primeiro

### Após Restauração

1. Sempre executar `eas build --platform android --profile preview`
2. Verificar logs do build para erros
3. Testar notificações push no dispositivo

### Manutenção

- Executar backup regularmente
- Manter scripts atualizados com novas configurações
- Documentar mudanças importantes

## 🔄 Fluxo Completo Recomendado

```powershell
# 1. Fazer backup das configurações atuais
.\manage_firebase_config.ps1 -OnlyBackup

# 2. Executar processo completo quando necessário
.\manage_firebase_config.ps1

# 3. Fazer build do app
eas build --platform android --profile preview

# 4. Testar notificações push
```

## 🆘 Solução de Problemas

### Erro: "Execution Policy"

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Erro: "Arquivo não encontrado"

- Verificar se está executando na pasta correta
- Certificar-se que o backup foi criado antes

### Erro no Build

- Verificar se o google-services.json está presente
- Confirmar que todas as dependências foram restauradas

### Push não funciona

- Verificar se o token está sendo salvo no Supabase
- Confirmar configurações do Firebase Console
- Testar em dispositivo físico (não emulador)

---

**✨ Agora você nunca mais perderá as configurações do Firebase!**
