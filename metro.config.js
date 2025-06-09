const { getDefaultConfig } = require("@expo/metro-config");
const exclusionList = require("metro-config/src/defaults/exclusionList");
const path = require("path");

const config = getDefaultConfig(__dirname);

// 🔧 Ajuste correto do resolver sem sobrescrever o objeto todo
config.resolver.blacklistRE = exclusionList([/node_modules\/ws\/.*/]);
config.resolver.extraNodeModules = {
  buffer: require.resolve("buffer/"),
  http: path.resolve(__dirname, "shims/empty.js"),
  https: path.resolve(__dirname, "shims/empty.js"),
  stream: path.resolve(__dirname, "shims/empty.js"),
  events: path.resolve(__dirname, "shims/empty.js"),
  net: path.resolve(__dirname, "shims/empty.js"),
  crypto: path.resolve(__dirname, "shims/empty.js"),
  tls: path.resolve(__dirname, "shims/empty.js"),
  ws: path.resolve(__dirname, "shims/empty.js"),
};

// 🔧 Adiciona a extensão "cjs" sem perder as originais
if (!config.resolver.sourceExts.includes("cjs")) {
  config.resolver.sourceExts.push("cjs");
}

module.exports = config;
