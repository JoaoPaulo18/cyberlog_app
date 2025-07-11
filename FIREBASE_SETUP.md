# Configuração Firebase Push Notifications

## Resumo das modificações feitas:

### 1. Arquivos modificados:

- `android/build.gradle` - Adicionado Firebase plugin
- `android/app/build.gradle` - Adicionado Firebase plugin e dependências
- `android/app/src/main/AndroidManifest.xml` - Adicionado serviços Firebase e permissões
- `android/app/google-services.json` - Configuração do Firebase
- `App.js` - Implementação do Firebase messaging
- `index.js` - Handler para mensagens em background

### 2. Dependências instaladas:

- `@react-native-firebase/app`
- `@react-native-firebase/messaging`

### 3. Configurações necessárias no Firebase Console:

#### Você precisa modificar os seguintes valores no seu Firebase Console:

1. **Package Name**: Deve ser `com.draxS2.cyberlog_app`
2. **Baixar um novo google-services.json** do Firebase Console com o package name correto
3. **Configurar as credenciais do servidor** usando o arquivo `cyberlog-a0868-firebase-adminsdk-fbsvc-1f4dec5493.json`

### 4. Para testar as notificações:

#### Usar o Firebase Console:

1. Vá para Firebase Console > Cloud Messaging
2. Clique em "Send your first message"
3. Digite título e texto da notificação
4. Selecione o app `com.draxS2.cyberlog_app`
5. Envie a notificação

#### Ou usar curl para testar:

```bash
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "FCM_TOKEN_DO_DISPOSITIVO",
    "notification": {
      "title": "Teste",
      "body": "Mensagem de teste"
    }
  }'
```

### 5. Itens que você precisa modificar:

1. **SERVER_KEY**: Obter do Firebase Console > Project Settings > Cloud Messaging
2. **google-services.json**: Baixar novamente do Firebase Console
3. **Package Name**: Certificar que está `com.draxS2.cyberlog_app` em todos os lugares
4. **FCM Token**: Será gerado automaticamente pelo app

### 6. Problemas conhecidos e soluções:

- **Permissão negada**: Verificar se o package name está correto
- **Token não gerado**: Verificar se o google-services.json está correto
- **Notificações não chegam**: Verificar se o SERVER_KEY está correto
- **App não abre com notificação**: Verificar se os handlers estão configurados

### 7. Para buildar e testar:

```bash
npx expo run:android --clear
```

### 8. Debug útil:

O app mostra alertas com informações de debug, incluindo:

- Token FCM gerado
- Status das permissões
- Confirmação de salvamento no Supabase
