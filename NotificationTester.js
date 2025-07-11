// Componente de teste para adicionar à tela principal
import React from "react";
import { View, Button, Alert, Platform } from "react-native";
import * as Notifications from "expo-notifications";

export const NotificationTester = () => {
  const testLocalNotification = async () => {
    try {
      console.log("[TEST] Testando notificação local...");

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
        console.log("[TEST] Canal configurado");
      }

      // Verificar permissões
      const { status } = await Notifications.getPermissionsAsync();
      console.log("[TEST] Status das permissões:", status);

      if (status !== "granted") {
        Alert.alert("Erro", "Permissões de notificação não concedidas");
        return;
      }

      // Agendar notificação de teste
      const result = await Notifications.scheduleNotificationAsync({
        content: {
          title: "🧪 Teste de Notificação",
          body: "Esta é uma notificação de teste local",
          data: { test: true },
          sound: "default",
          priority: Notifications.AndroidImportance.HIGH,
          categoryIdentifier: "test",
        },
        trigger: null, // Mostrar imediatamente
      });

      console.log("[TEST] Notificação agendada com ID:", result);
      Alert.alert("Sucesso", "Notificação de teste enviada! ID: " + result);
    } catch (error) {
      console.error("[TEST] Erro ao enviar notificação:", error);
      Alert.alert("Erro", "Falha ao enviar notificação: " + error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Button
        title="🧪 Testar Notificação Local"
        onPress={testLocalNotification}
        color="#007AFF"
      />
    </View>
  );
};

// Para usar este componente, adicione-o em uma das suas telas:
// import { NotificationTester } from './path/to/this/file';
//
// E então adicione <NotificationTester /> em algum lugar da sua tela
