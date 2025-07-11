# 🔧 Debug: App Crashando com FCM

## 🚨 Problema Identificado

- ✅ Notificações locais funcionam (botão teste)
- ❌ App crasha ao receber FCM push
- ❌ Após primeiro crash, notificações param de funcionar

## 🔍 Soluções Implementadas

### 1. Listener FCM Mais Seguro

- Adicionado try/catch em múltiplos níveis
- Validação de estrutura da mensagem
- Fallback para Alert se notificação falhar
- Timeout nos Alerts para evitar conflitos

### 2. Logs Detalhados

- Logs completos da estrutura da mensagem FCM
- Identificação do ponto exato do erro
- Separação entre erro de notificação e erro crítico

### 3. Estrutura de Dados Segura

- Extração segura de title/body da mensagem
- Fallback para data se notification estiver vazio
- Validação de campos obrigatórios

## 📋 Próximos Passos de Teste

### 1. Teste com Logs

1. Abra o Metro console: `npx react-native start`
2. Abra o app no dispositivo
3. Envie uma notificação via Firebase Console
4. Verifique os logs no console

### 2. Teste de Estrutura FCM

Use esta estrutura no Firebase Console:

```json
{
  "notification": {
    "title": "🧪 Teste FCM",
    "body": "Esta é uma notificação de teste"
  },
  "data": {
    "test": "true",
    "timestamp": "2025-01-09T10:00:00Z"
  }
}
```

### 3. Logs a Procurar

- `[Debug] 🔔 FCM Message received!`
- `[Debug] RemoteMessage: {...}`
- `[Debug] ✅ Notificação agendada com ID: ...`
- `[Debug] ❌ Erro ao agendar notificação: ...`

## 🐛 Possíveis Causas do Crash

### 1. Estrutura da Mensagem FCM

- Mensagem sem `notification` object
- Dados malformados no payload
- Caracteres especiais no título/corpo

### 2. Expo Notifications

- Canal não configurado corretamente
- Permissões perdidas após crash
- Conflito entre FCM e Expo

### 3. Threading Issues

- Listener executando em thread incorreta
- Alert chamado em momento inadequado
- Promises não tratadas corretamente

## 🔧 Debug Commands

### Ver logs do dispositivo Android:

```bash
adb logcat | grep -i "ReactNativeJS\|Expo\|FCM"
```

### Limpar cache do Metro:

```bash
npx react-native start --reset-cache
```

### Verificar permissões:

```bash
adb shell dumpsys notification | grep -i "your.package.name"
```

## 🎯 Teste Específico

1. **Teste Local**: Funciona ✅
2. **Teste FCM**: Verificar se ainda crasha
3. **Teste Estrutura**: Verificar logs da mensagem FCM
4. **Teste Recuperação**: Verificar se app funciona após crash

## 📱 Próxima Iteração

Se ainda crashar:

1. Remover temporariamente Expo Notifications
2. Usar apenas FCM nativo
3. Identificar se o problema é com Expo ou FCM
4. Implementar solução híbrida
