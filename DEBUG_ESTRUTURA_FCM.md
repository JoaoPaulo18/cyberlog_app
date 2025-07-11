# 🔍 Debug: Estrutura da Mensagem FCM

## 🎯 Objetivo

Descobrir exatamente qual é a diferença entre:

- ✅ **Simulação FCM** (funciona)
- ❌ **Mensagem FCM real** (crasha)

## 📱 Plano de Teste

### Passo 1: Teste de Funcionamento

1. Abra o app e faça login
2. Teste **🧪 Local** - deve funcionar (Expo Notifications)
3. Teste **🎭 FCM** - deve funcionar (Alert simulado)
4. Confirme que ambos funcionam sem crash

### Passo 2: Capturar Mensagem Real

1. Envie uma notificação real via Firebase Console ou backend
2. App vai crashar (esperado)
3. Reabra o app
4. Toque em **📨 MSG** para ver a estrutura da mensagem real
5. Toque em **📝 Logs** para ver onde exatamente crashou

### Passo 3: Análise da Estrutura

Compare as estruturas:

**Simulação (que funciona):**

```json
{
  "notification": {
    "title": "🎭 Teste Simulado",
    "body": "Esta é uma simulação de notificação FCM"
  },
  "data": {
    "test": "true"
  }
}
```

**Mensagem real (que crasha):**

- Será mostrada no botão **📨 MSG**

## 🔍 O que procurar na mensagem real:

### 1. Campos Ausentes

- ❓ `notification` está presente?
- ❓ `notification.title` está presente?
- ❓ `notification.body` está presente?

### 2. Tipos de Dados Diferentes

- ❓ Título é string ou outro tipo?
- ❓ Corpo é string ou outro tipo?
- ❓ Há campos extras que podem estar causando conflito?

### 3. Caracteres Especiais

- ❓ Há emojis no título/corpo?
- ❓ Há quebras de linha (`\n`)?
- ❓ Há caracteres especiais (`"`, `'`, `&`)?

### 4. Estrutura Diferente

- ❓ Dados estão em `data` em vez de `notification`?
- ❓ Há campos aninhados profundos?
- ❓ Há arrays ou objetos complexos?

## 🎯 Próximos Passos Baseados no Resultado

### Se a estrutura for diferente:

- Ajustar extração de título/corpo
- Adicionar validações específicas

### Se houver caracteres especiais:

- Sanitizar strings antes de usar
- Escapar caracteres problemáticos

### Se houver campos ausentes:

- Usar fallbacks mais robustos
- Validar existência antes de usar

### Se a estrutura for igual:

- Problema pode ser timing/threading
- Testar outras abordagens (toast, salvar para mostrar depois)

## 📝 Logs Importantes a Procurar

No **📝 Logs**, procure por:

- ✅ `🔔 FCM Message recebida!`
- ✅ `📊 Analisando estrutura da mensagem...`
- ✅ `📋 Estrutura: {...}`
- ✅ `💾 Mensagem salva para análise`
- ✅ `📱 Título final: "..."`
- ✅ `📱 Corpo final: "..."`
- ❌ **ÚLTIMA LINHA ANTES DO CRASH**

A última linha nos logs vai nos dizer exatamente onde o app está crashando!

## 🚨 Cenários Possíveis

### Cenário A: Crash na Extração

- Última linha: após `📊 Analisando estrutura...`
- **Solução**: Problema na estrutura da mensagem

### Cenário B: Crash na Sanitização

- Última linha: após `📱 Título final...`
- **Solução**: Problema com caracteres especiais

### Cenário C: Crash no Alert

- Última linha: após `🔄 Preparando Alert...`
- **Solução**: Problema no Alert.alert (threading/concorrência)

### Cenário D: Crash no AsyncStorage

- Última linha: após `💾 Mensagem salva...`
- **Solução**: Problema de memória/permissão
