// Teste de Notificação Local - Execute este código para testar se as notificações locais estão funcionando

import * as Notifications from "expo-notifications";
import { Alert } from "react-native";

// Configurar o comportamento das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const testLocalNotification = async () => {
  try {
    // Configurar canal se for Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("test", {
        name: "Test Channel",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: true,
        enableVibrate: true,
        showBadge: true,
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    // Agendar notificação de teste
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔔 Teste de Notificação",
        body: "Esta é uma notificação de teste local",
        data: { test: true },
        sound: true,
        priority: Notifications.AndroidImportance.HIGH,
        categoryIdentifier: "test",
      },
      trigger: null, // Mostrar imediatamente
    });

    Alert.alert("Sucesso", "Notificação de teste enviada!");
    console.log("Notificação de teste enviada com sucesso");
  } catch (error) {
    console.error("Erro ao enviar notificação de teste:", error);
    Alert.alert("Erro", "Falha ao enviar notificação: " + error.message);
  }
};

// Para testar, adicione um botão na sua tela que chama testLocalNotification()
// Exemplo:
// <Button title="Testar Notificação Local" onPress={testLocalNotification} />
