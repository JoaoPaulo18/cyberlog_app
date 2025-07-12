import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  Alert,
  Platform,
  PermissionsAndroid,
  Button,
  View,
  Text,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "./src/screens/LoginScreen";
import OrdersScreen from "./src/screens/OrdersScreen";
import OrderDetailScreen from "./src/screens/OrderDetailScreen";
import Devolucao from "./src/screens/Devolucao";
import Coleta from "./src/screens/Coleta";
import Controle from "./src/screens/Controle";

import { supabase } from "./src/supabaseClient";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Firebase imports
import messaging from "@react-native-firebase/messaging";
import { firebase } from "@react-native-firebase/app";

console.log("[Debug] ✅ Firebase messaging importado!");

// Sistema de captura de erros global
const setupErrorHandling = () => {
  // Capturar erros não tratados
  const defaultHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error("[ERROR HANDLER] Erro capturado:", error);
    AsyncStorage.setItem(
      "lastError",
      JSON.stringify({
        error: error.toString(),
        stack: error.stack,
        isFatal,
        timestamp: new Date().toISOString(),
      })
    );
    defaultHandler(error, isFatal);
  });

  // Capturar promises rejeitadas
  const handleUnhandledRejection = (event) => {
    console.error("[PROMISE REJECTION] Promise rejeitada:", event.reason);
    AsyncStorage.setItem(
      "lastPromiseRejection",
      JSON.stringify({
        reason: event.reason?.toString(),
        timestamp: new Date().toISOString(),
      })
    );
  };

  if (typeof global !== "undefined" && global.addEventListener) {
    global.addEventListener("unhandledrejection", handleUnhandledRejection);
  }
};

// Configuração de notificações Expo
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Stack = createNativeStackNavigator();

const App = () => {
  const [session, setSession] = useState(null);
  const [fcmToken, setFcmToken] = useState(""); // Request user permission for notifications
  const requestUserPermission = async () => {
    console.log("[Debug] Solicitando permissão para notificações...");

    try {
      // Configurar canal de notificação para Android PRIMEIRO
      if (Platform.OS === "android") {
        console.log(
          "[Debug] Configurando canal de notificação para Android..."
        );
        await Notifications.setNotificationChannelAsync("default", {
          name: "Notificações do App",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
          sound: true,
          enableVibrate: true,
          showBadge: true,
          lockscreenVisibility:
            Notifications.AndroidNotificationVisibility.PUBLIC,
        });
        console.log("[Debug] ✅ Canal de notificação configurado para Android");
      }

      // Solicitar permissões Expo Notifications
      console.log("[Debug] Solicitando permissões Expo Notifications...");
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      console.log("[Debug] Status permissão Expo:", finalStatus);

      if (Platform.OS === "android") {
        console.log("[Debug] Android detectado, versão:", Platform.Version);

        // Para Android 13+ (API 33+)
        if (Platform.Version >= 33) {
          console.log("[Debug] Android 13+, solicitando POST_NOTIFICATIONS");
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: "Permissão de Notificações",
              message: "Este app precisa de permissão para enviar notificações",
              buttonNeutral: "Perguntar depois",
              buttonNegative: "Cancelar",
              buttonPositive: "OK",
            }
          );

          console.log("[Debug] Resultado POST_NOTIFICATIONS:", granted);
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log("[Debug] ❌ POST_NOTIFICATIONS negada");
            Alert.alert("Aviso", "Permissão de notificações negada");
            return;
          }
        }
      }

      // Solicitar permissão Firebase (funciona para iOS e Android)
      console.log("[Debug] Solicitando permissão Firebase...");
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      console.log(
        "[Debug] Status permissão Firebase:",
        authStatus,
        "Enabled:",
        enabled
      );

      if (enabled) {
        console.log("[Debug] ✅ Permissões concedidas, obtendo token...");
        getFcmToken();
      } else {
        console.log("[Debug] ❌ Permissões Firebase negadas");
        Alert.alert("Aviso", "Permissão de notificações Firebase negada");
      }
    } catch (error) {
      console.error("[Debug] Erro ao solicitar permissões:", error);
      Alert.alert("Erro", "Falha ao solicitar permissões: " + error.message);
    }
  };

  // Get FCM token
  const getFcmToken = async () => {
    try {
      console.log("[Debug] Obtendo token FCM...");
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log(
          "[Debug] ✅ FCM Token obtido:",
          fcmToken.substring(0, 50) + "..."
        );
        setFcmToken(fcmToken);
        // You can store this token in your backend/database
      } else {
        console.log("[Debug] ❌ Falha ao obter FCM token");
      }
    } catch (error) {
      console.error("[Debug] Erro ao obter FCM token:", error);
    }
  };

  useEffect(() => {
    console.log("[Debug] 🚀 App iniciando...");

    // Inicializar captura de erros
    setupErrorHandling();

    // Função para inicializar de forma segura
    const initializeApp = async () => {
      try {
        // Initialize Firebase messaging
        await requestUserPermission();
        console.log("[Debug] ✅ Permissões configuradas");
      } catch (error) {
        console.error("[Debug] ❌ Erro ao inicializar app:", error);
        // Salvar erro para debug
        AsyncStorage.setItem(
          "initError",
          JSON.stringify({
            error: error.toString(),
            timestamp: new Date().toISOString(),
          })
        );
      }
    };

    // Chamar inicialização
    initializeApp();

    // Configurar listeners FCM com captura de erro robusta
    let unsubscribe;

    try {
      console.log("[Debug] Configurando listener FCM...");

      // Listener FCM com tratamento de erro abrangente
      unsubscribe = messaging().onMessage(async (remoteMessage) => {
        try {
          console.log("[FCM] ✅ Mensagem recebida!");
          console.log(
            "[FCM] Payload completo:",
            JSON.stringify(remoteMessage, null, 2)
          );

          // Salvar mensagem para debug
          await AsyncStorage.setItem(
            "lastFcmMessage",
            JSON.stringify({
              message: remoteMessage,
              timestamp: new Date().toISOString(),
            })
          );

          // Verificar estrutura da mensagem
          if (remoteMessage.notification) {
            console.log("[FCM] Notificação:", remoteMessage.notification);
          }
          if (remoteMessage.data) {
            console.log("[FCM] Dados:", remoteMessage.data);
          }

          console.log("[FCM] ✅ Mensagem processada com sucesso!");
        } catch (error) {
          console.error("[FCM] ❌ ERRO ao processar mensagem:", error);
          // Salvar erro específico do FCM
          await AsyncStorage.setItem(
            "fcmError",
            JSON.stringify({
              error: error.toString(),
              stack: error.stack,
              message: remoteMessage,
              timestamp: new Date().toISOString(),
            })
          );

          // Re-throw para capturar no handler global se necessário
          throw error;
        }
      });

      console.log("[Debug] ✅ Listener FCM configurado com sucesso");
    } catch (error) {
      console.error("[Debug] ❌ Erro ao configurar listener FCM:", error);
      AsyncStorage.setItem(
        "fcmListenerError",
        JSON.stringify({
          error: error.toString(),
          timestamp: new Date().toISOString(),
        })
      );
    }

    // Listener para quando o usuário toca na notificação local (Expo Notifications)
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("[Debug] Notificação local recebida:", notification);
      }
    );

    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("[Debug] Usuário tocou na notificação local:", response);
        // Aqui você pode navegar para uma tela específica baseada nos dados da notificação
      });

    // Autenticação Supabase
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { subscription } = supabase.auth.onAuthStateChange((_, s) => {
      setSession(s);
    });

    return () => {
      try {
        unsubscribe && unsubscribe();
        subscription.unsubscribe();
        notificationListener.remove();
        responseListener.remove();
      } catch (error) {
        console.error("Erro ao limpar listeners:", error);
      }
    };
  }, []);

  // Quando o usuário logar, salva o token no Supabase (Firebase FCM)
  useEffect(() => {
    if (session?.user?.id && fcmToken) {
      saveFcmTokenToSupabase(fcmToken, session.user.id);
    }
  }, [session, fcmToken]);

  async function saveFcmTokenToSupabase(token, userId) {
    if (!token || !userId) return;

    try {
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("motoboy_token")
        .eq("id", userId)
        .single();

      if (fetchError) {
        console.log("Erro ao buscar perfil:", fetchError.message);
        return;
      }

      if (profile?.motoboy_token === token) {
        console.log("FCM token já salvo e é o mesmo");
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ motoboy_token: token })
        .eq("id", userId);

      if (updateError) {
        console.log("Erro ao atualizar FCM token:", updateError.message);
      } else {
        console.log("FCM token salvo no Supabase!");
      }
    } catch (err) {
      console.log("Erro geral:", err.message);
    }
  }

  // Componente de debug para mostrar logs de erro
  const DebugPanel = () => {
    const [debugInfo, setDebugInfo] = useState(null);
    const [showDebug, setShowDebug] = useState(false);

    const loadDebugInfo = async () => {
      try {
        const [lastError, fcmError, lastMessage, promiseRejection] =
          await Promise.all([
            AsyncStorage.getItem("lastError"),
            AsyncStorage.getItem("fcmError"),
            AsyncStorage.getItem("lastFcmMessage"),
            AsyncStorage.getItem("lastPromiseRejection"),
          ]);

        setDebugInfo({
          lastError: lastError ? JSON.parse(lastError) : null,
          fcmError: fcmError ? JSON.parse(fcmError) : null,
          lastMessage: lastMessage ? JSON.parse(lastMessage) : null,
          promiseRejection: promiseRejection
            ? JSON.parse(promiseRejection)
            : null,
        });
      } catch (error) {
        console.error("Erro ao carregar debug info:", error);
      }
    };

    const clearDebugInfo = async () => {
      await AsyncStorage.multiRemove([
        "lastError",
        "fcmError",
        "lastFcmMessage",
        "lastPromiseRejection",
      ]);
      setDebugInfo(null);
    };

    if (!showDebug) {
      return (
        <View
          style={{ position: "absolute", top: 50, right: 10, zIndex: 1000 }}
        >
          <Button
            title="Debug"
            onPress={() => {
              setShowDebug(true);
              loadDebugInfo();
            }}
          />
        </View>
      );
    }

    return (
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)",
          zIndex: 1000,
          padding: 20,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "white",
            padding: 10,
            marginTop: 50,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <Button title="Fechar" onPress={() => setShowDebug(false)} />
            <Button title="Limpar" onPress={clearDebugInfo} />
            <Button title="Reload" onPress={loadDebugInfo} />
          </View>

          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
            Debug FCM Crash
          </Text>

          {debugInfo ? (
            <View style={{ flex: 1 }}>
              {debugInfo.fcmError && (
                <View
                  style={{
                    marginBottom: 15,
                    padding: 10,
                    backgroundColor: "#ffebee",
                  }}
                >
                  <Text style={{ fontWeight: "bold", color: "red" }}>
                    FCM Error:
                  </Text>
                  <Text style={{ fontSize: 12, marginTop: 5 }}>
                    {debugInfo.fcmError.error}
                  </Text>
                  <Text style={{ fontSize: 10, color: "gray" }}>
                    {debugInfo.fcmError.timestamp}
                  </Text>
                </View>
              )}

              {debugInfo.lastError && (
                <View
                  style={{
                    marginBottom: 15,
                    padding: 10,
                    backgroundColor: "#fff3e0",
                  }}
                >
                  <Text style={{ fontWeight: "bold", color: "orange" }}>
                    Last Error:
                  </Text>
                  <Text style={{ fontSize: 12, marginTop: 5 }}>
                    {debugInfo.lastError.error}
                  </Text>
                  <Text style={{ fontSize: 10, color: "gray" }}>
                    {debugInfo.lastError.timestamp}
                  </Text>
                </View>
              )}

              {debugInfo.lastMessage && (
                <View
                  style={{
                    marginBottom: 15,
                    padding: 10,
                    backgroundColor: "#e8f5e8",
                  }}
                >
                  <Text style={{ fontWeight: "bold", color: "green" }}>
                    Last FCM Message:
                  </Text>
                  <Text style={{ fontSize: 10, marginTop: 5 }}>
                    {JSON.stringify(debugInfo.lastMessage.message, null, 2)}
                  </Text>
                  <Text style={{ fontSize: 10, color: "gray" }}>
                    {debugInfo.lastMessage.timestamp}
                  </Text>
                </View>
              )}

              {!debugInfo.fcmError && !debugInfo.lastError && (
                <Text>
                  Nenhum erro encontrado. Teste enviar uma notificação FCM!
                </Text>
              )}
            </View>
          ) : (
            <Text>Carregando debug info...</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#3578e5" }}>
      <DebugPanel />
      <NavigationContainer>
        <Stack.Navigator>
          {session ? (
            <>
              <Stack.Screen
                name="OrdersScreen"
                component={OrdersScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="OrderDetailScreen"
                component={OrderDetailScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Devolucao"
                component={Devolucao}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Coleta"
                component={Coleta}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Controle"
                component={Controle}
                options={{ headerShown: false }}
              />
            </>
          ) : (
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
};

export default App;
