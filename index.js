// index.js
import "react-native-url-polyfill/auto"; // Polyfill para URL/URLSearchParams/etc.
import { Buffer } from "buffer"; // Polyfill para Buffer do Node

if (typeof global.Buffer === "undefined") {
  global.Buffer = Buffer;
}
if (typeof global.process === "undefined") {
  global.process = require("process");
}

import { registerRootComponent } from "expo";
import App from "./App";

registerRootComponent(App);
