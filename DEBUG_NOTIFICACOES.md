# 🔧 Debug de Notificações - Guia Completo

## 📋 Checklist de Debugging

### 1. Verificar Configuração do Canal (Android)

- [ ] Canal configurado com importância HIGH ou MAX
- [ ] Som habilitado
- [ ] Vibração habilitada
- [ ] Visibilidade configurada

### 2. Verificar Permissões

- [ ] Permissão do Expo Notifications
- [ ] Permissão POST_NOTIFICATIONS (Android 13+)
- [ ] Permissão FCM

### 3. Verificar Estados do App

- [ ] Foreground: notificação local exibida
- [ ] Background: notificação FCM nativa
- [ ] Quit: notificação FCM nativa + app abre ao tocar

## 🔍 Comandos para Debug

### Verificar logs do dispositivo (Android):

```bash
adb logcat | grep -i "notification"
```

### Verificar logs do Metro:

```bash
npx react-native start --reset-cache
```

### Verificar se o app está recebendo notificações:

```bash
# No arquivo App.js, procure por estes logs:
# "🔔 New FCM Notification received:"
# "[Debug] Notificação local agendada com sucesso"
```

## 🧪 Testes Manuais

### Teste 1: Notificação Local

1. Adicione um botão na tela principal
2. Importe o arquivo `test_local_notification.js`
3. Chame a função `testLocalNotification()`
4. Verifique se aparece uma notificação nativa

### Teste 2: Notificação FCM (Foreground)

1. Envie uma notificação via Firebase Console
2. Com o app aberto, verifique se aparece notificação local
3. Verifique os logs no console

### Teste 3: Notificação FCM (Background)

1. Minimize o app
2. Envie uma notificação via Firebase Console
3. Verifique se aparece notificação nativa do sistema

### Teste 4: Notificação FCM (Quit)

1. Feche o app completamente
2. Envie uma notificação via Firebase Console
3. Toque na notificação
4. Verifique se o app abre

## 🔧 Soluções Comuns

### Notificação não aparece no foreground:

1. Verifique se o canal está configurado corretamente
2. Verifique se as permissões foram concedidas
3. Verifique se não há erros nos logs

### Notificação não aparece no background:

1. Verifique se o Firebase está configurado corretamente
2. Verifique se o google-services.json está correto
3. Verifique se não há conflitos de tokens

### App não abre quando toca na notificação:

1. Verifique os listeners onNotificationOpenedApp e getInitialNotification
2. Verifique se há erros na inicialização do app

## 📱 Configurações do Dispositivo

### Android:

1. Configurações > Apps > Seu App > Notificações
2. Verificar se as notificações estão habilitadas
3. Verificar se o canal está configurado corretamente

### iOS:

1. Configurações > Notificações > Seu App
2. Verificar se as notificações estão habilitadas
3. Verificar se o som está habilitado

## 🏗️ Próximos Passos

1. **Remover Alerts de Debug**: Após confirmar que tudo funciona
2. **Implementar Navegação**: Navegar para telas específicas ao tocar na notificação
3. **Customizar Notificações**: Adicionar ícones, cores, sons personalizados
4. **Testar em Produção**: Testar com build de release

## 🔗 Links Úteis

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [React Native Firebase Messaging](https://rnfirebase.io/messaging/usage)
- [Firebase Console](https://console.firebase.google.com/)
- [Test FCM](https://firebase.google.com/docs/cloud-messaging/send-message)
