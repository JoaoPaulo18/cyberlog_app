# Troubleshooting Firebase Notifications

## Possíveis causas para não receber notificações:

### 1. **Verificar se o app está em background/fechado**

- Teste com o app completamente fechado
- Teste com o app em background (minimizado)
- Teste com o app em foreground (aberto)

### 2. **Verificar configurações do dispositivo**

- Configurações > Apps > CyberLog > Notificações > Ativar todas
- Configurações > Apps > CyberLog > Bateria > Otimização de bateria > Não otimizar
- Configurações > Apps > CyberLog > Inicialização automática > Permitir

### 3. **Verificar formato da mensagem no servidor**

```javascript
// Formato correto para Android:
{
  "to": "FCM_TOKEN",
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
  }
}
```

### 4. **Verificar se o google-services.json está correto**

- Package name deve ser: `com.draxS2.cyberlog_app`
- Arquivo deve estar em `android/app/google-services.json`

### 5. **Verificar logs do dispositivo**

```bash
# Conectar dispositivo via USB e executar:
adb logcat | grep -i firebase
adb logcat | grep -i fcm
adb logcat | grep -i notification
```

### 6. **Testar com Firebase Console**

- Vá para Firebase Console > Cloud Messaging
- Clique em "Send your first message"
- Selecione o app e envie uma notificação de teste

### 7. **Verificar se o token está válido**

- Tokens FCM expiram e são renovados
- Verificar se o token salvo no servidor é o mais recente

### 8. **Código de debug no App.js**

Adicione estes logs para debug:

```javascript
// No App.js, adicione mais logs:
messaging().onMessage(async (remoteMessage) => {
  console.log(
    "🔔 Mensagem recebida em foreground:",
    JSON.stringify(remoteMessage)
  );
  Alert.alert("Notificação recebida", JSON.stringify(remoteMessage));
});

messaging().onNotificationOpenedApp((remoteMessage) => {
  console.log("🔔 App aberto por notificação:", JSON.stringify(remoteMessage));
  Alert.alert("App aberto por notificação", JSON.stringify(remoteMessage));
});

messaging()
  .getInitialNotification()
  .then((remoteMessage) => {
    if (remoteMessage) {
      console.log(
        "🔔 App iniciado por notificação:",
        JSON.stringify(remoteMessage)
      );
      Alert.alert(
        "App iniciado por notificação",
        JSON.stringify(remoteMessage)
      );
    }
  });
```

### 9. **Verificar se há conflitos com OneSignal**

- Remover completamente o OneSignal do projeto
- Limpar cache: `npx expo run:android --clear`

### 10. **Testar com curl**

```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "FCM_TOKEN",
    "notification": {
      "title": "Teste",
      "body": "Mensagem de teste"
    },
    "android": {
      "priority": "high"
    }
  }'
```
