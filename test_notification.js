// test_notification.js
// Script para testar notificações Firebase FCM

const admin = require("firebase-admin");

// Inicializar Firebase Admin com suas credenciais
// Coloque o arquivo firebase-adminsdk aqui no mesmo diretório
const serviceAccount = require("./cyberlog-a0868-firebase-adminsdk-fbsvc-1f4dec5493.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "cyberlog-a0868",
});

// Função para enviar notificação de teste
async function sendTestNotification(fcmToken) {
  console.log("🚀 Enviando notificação de teste...");

  const message = {
    notification: {
      title: "🔔 Teste CyberLog",
      body: "Esta é uma notificação de teste do Firebase",
    },
    data: {
      click_action: "FLUTTER_NOTIFICATION_CLICK",
      screen: "home",
      test_data: "notification_test",
      timestamp: Date.now().toString(),
    },
    android: {
      priority: "high",
      notification: {
        channel_id: "default",
        sound: "default",
        priority: "high",
        default_vibrate_timings: true,
        default_sound: true,
        notification_priority: "PRIORITY_HIGH",
        visibility: "PUBLIC",
      },
    },
    apns: {
      payload: {
        aps: {
          contentAvailable: true,
          mutableContent: true,
          sound: "default",
        },
      },
      headers: {
        "apns-push-type": "alert",
        "apns-priority": "10",
      },
    },
    token: fcmToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("✅ Notificação enviada com sucesso!");
    console.log("📱 Message ID:", response);
    return response;
  } catch (error) {
    console.error("❌ Erro ao enviar notificação:", error);

    if (error.code === "messaging/registration-token-not-registered") {
      console.error("🚨 Token FCM inválido ou expirado");
    } else if (error.code === "messaging/invalid-registration-token") {
      console.error("🚨 Formato do token FCM inválido");
    }

    throw error;
  }
}

// Função para testar apenas dados (sem notificação visual)
async function sendDataOnlyMessage(fcmToken) {
  console.log("📨 Enviando mensagem apenas com dados...");

  const message = {
    data: {
      type: "silent_update",
      action: "sync_orders",
      priority: "high",
      timestamp: Date.now().toString(),
    },
    android: {
      priority: "high",
    },
    apns: {
      payload: {
        aps: {
          contentAvailable: true,
        },
      },
      headers: {
        "apns-push-type": "background",
        "apns-priority": "5",
      },
    },
    token: fcmToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("✅ Mensagem de dados enviada com sucesso!");
    console.log("📱 Message ID:", response);
    return response;
  } catch (error) {
    console.error("❌ Erro ao enviar mensagem de dados:", error);
    throw error;
  }
}

// IMPORTANTE: Substitua pelo token FCM real do seu dispositivo
const testToken = "COLE_SEU_FCM_TOKEN_AQUI";

if (testToken === "COLE_SEU_FCM_TOKEN_AQUI") {
  console.log(
    "❌ Por favor, substitua o testToken pelo token FCM real do seu dispositivo"
  );
  console.log(
    "💡 Você pode encontrar o token nos logs do app ou no alerta que aparece"
  );
  process.exit(1);
}

// Executar testes
async function runTests() {
  try {
    console.log("🔥 Iniciando testes Firebase FCM...");
    console.log("📱 Token:", testToken.substring(0, 20) + "...");

    // Teste 1: Notificação com som e vibração
    await sendTestNotification(testToken);

    // Aguardar 5 segundos
    console.log("⏳ Aguardando 5 segundos...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Teste 2: Mensagem apenas com dados
    await sendDataOnlyMessage(testToken);

    console.log("✅ Todos os testes concluídos!");
    console.log("📱 Verifique seu dispositivo para ver as notificações");
  } catch (error) {
    console.error("❌ Teste falhou:", error);
  } finally {
    process.exit(0);
  }
}

runTests();
