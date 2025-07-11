// Firebase messaging service worker for background notifications
import messaging from "@react-native-firebase/messaging";

// Handle background messages
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("Message handled in the background!", remoteMessage);
});
