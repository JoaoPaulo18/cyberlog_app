# 🔧 Plano de Debug: App Crashando

## 📊 Situação Atual

- ✅ **Log 1**: "FCM Message recebida!"
- ✅ **Log 2**: "Título: Novo Pedido!, Corpo: etc...."
- ❌ **CRASH**: Acontece após extrair título/corpo, antes de mostrar notificação

## 🎯 Ponto do Crash Identificado

O crash está acontecendo em:

```javascript
setTimeout(() => {
  Alert.alert(title, body); // <- AQUI
}, 100);
```

## 🔬 Testes Implementados

### 1. FCM Listener Mais Defensivo

- ✅ Logs detalhados em cada etapa
- ✅ `String(title)` e `String(body)` para garantir string
- ✅ setTimeout aumentado para 200ms
- ✅ Try/catch separado para Alert

### 2. Simulação FCM (Botão 🎭 FCM)

- ✅ Simula a mesma estrutura de dados
- ✅ Mesmo fluxo de processamento
- ✅ Permite testar sem enviar notificação real

## 📱 Próximos Testes

### Teste 1: Simulação FCM

1. Abra o app
2. Faça login
3. Toque no botão **🎭 FCM**
4. Veja se crasha da mesma forma

### Teste 2: Logs Detalhados

Após o crash, toque em **📝 Logs** para ver:

- "🔄 Preparando Alert..."
- "✅ setTimeout configurado"
- "✅ Alert chamado com sucesso" OU "❌ ERRO no Alert:"

## 🔧 Possíveis Causas do Crash

### 1. Threading Issues

- Alert.alert sendo chamado em thread errada
- Solução: Usar `InteractionManager.runAfterInteractions`

### 2. Caracteres Especiais

- Título/corpo com caracteres que quebram o Alert
- Solução: Sanitizar strings

### 3. Concorrência de Alerts

- Múltiplos alerts simultâneos
- Solução: Queue de alerts

### 4. Memory Issues

- App com pouca memória disponível
- Solução: Simplificar ainda mais

## 🎯 Próxima Iteração (Se ainda crashar)

### Fallback 1: Remover Alert Completamente

```javascript
// Em vez de Alert.alert, usar:
debugLog(`📱 NOTIFICAÇÃO: ${title} - ${body}`);
```

### Fallback 2: Usar Toast/Snackbar

```javascript
// Usar biblioteca mais leve para notificações
ToastAndroid.show(`${title}: ${body}`, ToastAndroid.SHORT);
```

### Fallback 3: Salvar no AsyncStorage

```javascript
// Salvar notificações para visualizar depois
await AsyncStorage.setItem("lastNotification", JSON.stringify({ title, body }));
```

## 📋 Checklist de Teste

- [ ] Botão **🧪 Local** funciona (Expo Notifications)
- [ ] Botão **🎭 FCM** funciona (Simulação)
- [ ] Notificação real FCM ainda crasha
- [ ] Logs mostram onde exatamente está crashando
- [ ] Teste com caracteres especiais no título/corpo
- [ ] Teste com títulos muito longos

## 🚀 Estratégia Final

Se o problema persistir, vamos:

1. Remover Alert.alert completamente
2. Usar apenas Expo Notifications para mostrar
3. Salvar logs das notificações FCM
4. Criar uma tela de "Notificações Recebidas" no app
