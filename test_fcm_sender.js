// Script para testar envio de notificações FCM
// Execute este código em um terminal Node.js ou em um arquivo .js

const admin = require("firebase-admin");

// Configurar Firebase Admin (substitua pelo seu serviceAccountKey.json)
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Função para enviar notificação de teste
async function sendTestNotification(fcmToken) {
  try {
    const message = {
      notification: {
        title: "🧪 Teste FCM",
        body: "Esta é uma notificação de teste do Firebase",
      },
      data: {
        test: "true",
        timestamp: new Date().toISOString(),
      },
      token: fcmToken,
    };

    const response = await admin.messaging().send(message);
    console.log("✅ Notificação enviada com sucesso:", response);
    return response;
  } catch (error) {
    console.error("❌ Erro ao enviar notificação:", error);
    throw error;
  }
}

// Exemplo de uso:
// sendTestNotification('SEU_FCM_TOKEN_AQUI');

module.exports = { sendTestNotification };

// Para usar via Firebase Console:
// 1. Vá para https://console.firebase.google.com/
// 2. Selecione seu projeto
// 3. Vá para "Cloud Messaging"
// 4. Clique em "Send your first message"
// 5. Preencha:
//    - Title: "🧪 Teste FCM"
//    - Body: "Esta é uma notificação de teste"
//    - Target: "Single device"
//    - FCM token: [cole o token do seu app]
// 6. Clique em "Send"
