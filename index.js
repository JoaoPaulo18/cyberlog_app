// index.js
import "react-native-url-polyfill/auto";
import { Buffer } from "buffer";

if (typeof global.Buffer === "undefined") {
  global.Buffer = Buffer;
}
if (typeof global.process === "undefined") {
  global.process = require("process");
}

// Firebase background message handler
import messaging from "@react-native-firebase/messaging";

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("Background FCM Message:", remoteMessage);
  return Promise.resolve();
});

import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);
