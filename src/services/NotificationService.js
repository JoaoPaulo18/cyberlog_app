// src/services/NotificationService.js
import messaging from "@react-native-firebase/messaging";
import { Alert } from "react-native";

class NotificationService {
  constructor() {
    this.checkPermission();
    this.createNotificationListeners();
  }

  async checkPermission() {
    const enabled = await messaging().hasPermission();
    if (enabled) {
      this.getToken();
    } else {
      this.requestPermission();
    }
  }

  async requestPermission() {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log("Authorization status:", authStatus);
        this.getToken();
      }
    } catch (error) {
      console.log("Permission rejected");
    }
  }

  async getToken() {
    let fcmToken = await messaging().getToken();
    if (fcmToken) {
      console.log("FCM Token:", fcmToken);
      return fcmToken;
    }
  }

  createNotificationListeners() {
    // When the application is running, but in the background
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log(
        "Notification caused app to open from background state:",
        remoteMessage.notification
      );
    });

    // When the application is opened from a quit state
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log(
            "Notification caused app to open from quit state:",
            remoteMessage.notification
          );
        }
      });

    // Foreground state messages
    messaging().onMessage(async (remoteMessage) => {
      console.log("A new FCM message arrived!", JSON.stringify(remoteMessage));

      // Show alert for foreground messages
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || "Nova Notificação",
          remoteMessage.notification.body || "Mensagem recebida"
        );
      }
    });
  }

  // Send push notification (for testing purposes)
  async sendNotification(token, title, body, data = {}) {
    const message = {
      to: token,
      notification: {
        title: title,
        body: body,
      },
      data: data,
    };

    try {
      // This would typically be done from your backend server
      // Using Firebase Admin SDK or Firebase Functions
      console.log("Notification payload:", message);
      return message;
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }
}

export default new NotificationService();
