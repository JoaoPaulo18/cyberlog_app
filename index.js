// index.js
import "react-native-url-polyfill/auto"; // Polyfill para URL/URLSearchParams/etc.
import { Buffer } from "buffer"; // Polyfill para Buffer do Node

if (typeof global.Buffer === "undefined") {
  global.Buffer = Buffer;
}
if (typeof global.process === "undefined") {
  global.process = require("process");
}

// Firebase background message handler
import messaging from "@react-native-firebase/messaging";

// Firebase background message handler - SEM UI/Alert
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("📱 Background FCM Message:", remoteMessage);

  // Salvar para processar quando app abrir
  try {
    const AsyncStorage =
      require("@react-native-async-storage/async-storage").default;
    const backgroundMessages =
      (await AsyncStorage.getItem("backgroundMessages")) || "[]";
    const messages = JSON.parse(backgroundMessages);

    // Adicionar nova mensagem (mantém só as últimas 10)
    messages.push({
      timestamp: new Date().toISOString(),
      title: remoteMessage?.notification?.title || "Background Notification",
      body: remoteMessage?.notification?.body || "Received in background",
      data: remoteMessage?.data,
    });

    if (messages.length > 10) {
      messages.splice(0, messages.length - 10);
    }

    await AsyncStorage.setItem("backgroundMessages", JSON.stringify(messages));
    console.log("✅ Background message saved");
  } catch (error) {
    console.error("❌ Error saving background message:", error);
  }

  return Promise.resolve();
});

import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);
