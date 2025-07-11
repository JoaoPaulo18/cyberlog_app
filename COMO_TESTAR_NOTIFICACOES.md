# Como testar as notificações Firebase

## 1. Instalar dependências para teste:

```bash
npm install firebase-admin
```

## 2. Configurar o token FCM:

1. Abra o app no seu dispositivo
2. Faça login
3. Copie o token FCM que aparece no alerta
4. Cole o token no arquivo `test_notification.js` na linha:
   ```javascript
   const testToken = "COLE_SEU_FCM_TOKEN_AQUI";
   ```

## 3. Executar o teste:

```bash
node test_notification.js
```

## 4. Principais problemas possíveis:

### A) **Permissão negada no Android**

- Verifique se o app tem permissão para notificações nas configurações
- Para Android 13+: Settings > Apps > CyberLog > Notifications > Allow
- Para versões antigas: Deveria funcionar automaticamente

### B) **Token não funciona**

- Verificar se o package name no google-services.json está correto: `com.draxS2.cyberlog_app`
- Verificar se o arquivo está no local correto: `android/app/google-services.json`

### C) **App não recebe notificações**

- Verificar se o app está em background/fechado (não funciona em foreground em algumas versões)
- Verificar se a bateria não está otimizada para o app
- Verificar se o Background App Refresh está ativado

### D) **Formato da mensagem do servidor**

Usar este formato no seu servidor:

```javascript
{
  "notification": {
    "title": "Título",
    "body": "Mensagem"
  },
  "data": {
    "click_action": "FLUTTER_NOTIFICATION_CLICK"
  },
  "android": {
    "priority": "high",
    "notification": {
      "channel_id": "default",
      "sound": "default",
      "priority": "high"
    }
  },
  "token": "FCM_TOKEN_DO_DISPOSITIVO"
}
```

## 5. Debug útil:

### Verificar logs do dispositivo:

```bash
adb logcat | grep -i firebase
adb logcat | grep -i fcm
adb logcat | grep -i notification
```

### Verificar se o app está recebendo:

- Abra o app
- Observe os logs no console
- As funções onMessage, onNotificationOpenedApp e getInitialNotification devem mostrar logs

## 6. Testando diferentes cenários:

1. **App em foreground**: Deve mostrar Alert
2. **App em background**: Deve mostrar notificação nativa
3. **App fechado**: Deve mostrar notificação e abrir o app ao clicar

## 7. Se ainda não funcionar:

1. Verificar se o google-services.json é válido
2. Fazer rebuild limpo: `npx expo run:android --clear`
3. Verificar se não há conflitos com OneSignal (remover completamente)
4. Testar em outro dispositivo Android
