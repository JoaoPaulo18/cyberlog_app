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
  const [fcmToken, setFcmToken] = useState("");
  const [debugLogs, setDebugLogs] = useState([]);

  // Sistema de debug visual para APK
  const debugLog = async (message, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;

    // Salvar no AsyncStorage
    try {
      const existingLogs = (await AsyncStorage.getItem("debugLogs")) || "[]";
      const logs = JSON.parse(existingLogs);
      logs.push({ timestamp, message, isError });

      // Manter apenas os últimos 50 logs
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }

      await AsyncStorage.setItem("debugLogs", JSON.stringify(logs));
      setDebugLogs(logs);

      // Se for erro crítico, mostrar alert
      if (isError) {
        Alert.alert("❌ ERRO DEBUG", logEntry);
      }
    } catch (e) {
      // Fallback se AsyncStorage falhar
      if (isError) {
        Alert.alert("❌ ERRO CRÍTICO", message);
      }
    }
  };

  // Função para mostrar logs de debug
  const showDebugLogs = async () => {
    try {
      const logs = await AsyncStorage.getItem("debugLogs");
      if (logs) {
        const parsedLogs = JSON.parse(logs);
        const lastLogs = parsedLogs
          .slice(-10)
          .map((log) => `[${log.timestamp}] ${log.message}`)
          .join("\n\n");
        Alert.alert("📝 DEBUG LOGS (últimos 10)", lastLogs);
      } else {
        Alert.alert("📝 DEBUG LOGS", "Nenhum log encontrado");
      }
    } catch (e) {
      Alert.alert("❌ ERRO", "Falha ao carregar logs: " + e.message);
    }
  };

  // Função para limpar logs
  const clearDebugLogs = async () => {
    try {
      await AsyncStorage.removeItem("debugLogs");
      setDebugLogs([]);
      Alert.alert("✅ SUCESSO", "Logs de debug limpos");
    } catch (e) {
      Alert.alert("❌ ERRO", "Falha ao limpar logs: " + e.message);
    }
  };

  // Função para ver a última mensagem FCM capturada
  const showLastFCMMessage = async () => {
    try {
      const lastMessage = await AsyncStorage.getItem("lastFCMMessage");
      if (lastMessage) {
        const parsed = JSON.parse(lastMessage);
        const summary = `
ESTRUTURA DA MENSAGEM FCM:
        
notification: ${JSON.stringify(parsed.notification, null, 2)}

data: ${JSON.stringify(parsed.data, null, 2)}

messageId: ${parsed.messageId}
from: ${parsed.from}
`;
        Alert.alert("📨 ÚLTIMA MENSAGEM FCM", summary);
      } else {
        Alert.alert("📨 FCM MESSAGE", "Nenhuma mensagem FCM capturada ainda");
      }
    } catch (e) {
      Alert.alert("❌ ERRO", "Falha ao carregar mensagem FCM: " + e.message);
    }
  };

  // Função de teste para notificações locais
  const testLocalNotification = async () => {
    try {
      await debugLog("🧪 Testando notificação local...");

      // Verificar permissões
      const { status } = await Notifications.getPermissionsAsync();
      await debugLog(`📋 Status das permissões: ${status}`);

      if (status !== "granted") {
        Alert.alert(
          "Erro",
          "Permissões de notificação não concedidas. Status: " + status
        );
        return;
      }

      // Agendar notificação de teste
      const result = await Notifications.scheduleNotificationAsync({
        content: {
          title: "🧪 Teste Manual",
          body: "Esta é uma notificação de teste criada manualmente",
          data: { test: true },
          sound: "default",
          priority: Notifications.AndroidImportance.HIGH,
          categoryIdentifier: "test",
        },
        trigger: null, // Mostrar imediatamente
      });

      await debugLog(`✅ Notificação agendada com ID: ${result}`);
      Alert.alert("Sucesso", "Notificação de teste enviada! ID: " + result);
    } catch (error) {
      await debugLog(`❌ Erro ao enviar notificação: ${error.message}`, true);
    }
  };

  // Função para simular notificação FCM (para debug)
  const testFCMSimulation = async () => {
    try {
      await debugLog("🎭 Simulando notificação FCM...");

      // Simular estrutura de mensagem FCM
      const fakeRemoteMessage = {
        notification: {
          title: "🎭 Teste Simulado",
          body: "Esta é uma simulação de notificação FCM",
        },
        data: {
          test: "true",
        },
      };

      // Simular o mesmo fluxo do listener FCM
      const title =
        fakeRemoteMessage?.notification?.title || "Nova Notificação";
      const body = fakeRemoteMessage?.notification?.body || "Mensagem recebida";

      await debugLog(`📱 Título: ${title}, Corpo: ${body}`);

      try {
        await debugLog("🔄 Preparando Alert simulado...");

        const showAlert = () => {
          try {
            Alert.alert(String(title), String(body));
            debugLog("✅ Alert simulado chamado com sucesso");
          } catch (alertError) {
            debugLog(`❌ ERRO no Alert simulado: ${alertError.message}`, true);
          }
        };

        setTimeout(showAlert, 200);
        await debugLog("✅ setTimeout simulado configurado");
      } catch (alertSetupError) {
        await debugLog(
          `❌ ERRO setup Alert simulado: ${alertSetupError.message}`,
          true
        );
      }
    } catch (error) {
      await debugLog(`❌ Erro na simulação FCM: ${error.message}`, true);
    }
  }; // Request user permission for notifications
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

    // Função para inicializar de forma segura
    const initializeApp = async () => {
      try {
        // Initialize Firebase messaging
        await requestUserPermission();
        console.log("[Debug] ✅ Permissões configuradas");
      } catch (error) {
        console.error("[Debug] ❌ Erro ao inicializar app:", error);
      }
    };

    // Chamar inicialização
    initializeApp(); // Configurar listeners FCM com debug visual
    let unsubscribe;
    let unsubscribeTokenRefresh;

    try {
      debugLog("🚀 Configurando listener FCM...");

      // Listener FCM mais simples e seguro
      unsubscribe = messaging().onMessage(async (remoteMessage) => {
        try {
          await debugLog("🔔 FCM Message recebida!");

          // CAPTURAR ESTRUTURA COMPLETA DA MENSAGEM REAL
          try {
            await debugLog("📊 Analisando estrutura da mensagem...");

            // Salvar mensagem completa para análise
            const messageStructure = {
              hasNotification: !!remoteMessage?.notification,
              hasData: !!remoteMessage?.data,
              notificationKeys: remoteMessage?.notification
                ? Object.keys(remoteMessage.notification)
                : [],
              dataKeys: remoteMessage?.data
                ? Object.keys(remoteMessage.data)
                : [],
              notificationTitle: remoteMessage?.notification?.title,
              notificationBody: remoteMessage?.notification?.body,
              dataTitle: remoteMessage?.data?.title,
              dataBody: remoteMessage?.data?.body,
            };

            await debugLog(`📋 Estrutura: ${JSON.stringify(messageStructure)}`);

            // Salvar mensagem completa no AsyncStorage para análise detalhada
            // CORREÇÃO: JSON.stringify seguro para evitar referências circulares
            const safeFCMMessage = {
              messageId: remoteMessage.messageId,
              from: remoteMessage.from,
              notification: remoteMessage.notification,
              data: remoteMessage.data,
              ttl: remoteMessage.ttl,
              sentTime: remoteMessage.sentTime,
            };

            await AsyncStorage.setItem(
              "lastFCMMessage",
              JSON.stringify(safeFCMMessage)
            );
            await debugLog("💾 Mensagem salva para análise");
          } catch (analysisError) {
            await debugLog(
              `❌ ERRO na análise: ${analysisError.message}`,
              true
            );
          }

          // Extrair título e corpo de forma mais defensiva
          let title = "Nova Notificação";
          let body = "Mensagem recebida";

          try {
            if (remoteMessage?.notification?.title) {
              title = String(remoteMessage.notification.title).trim();
            } else if (remoteMessage?.data?.title) {
              title = String(remoteMessage.data.title).trim();
            }

            if (remoteMessage?.notification?.body) {
              body = String(remoteMessage.notification.body).trim();
            } else if (remoteMessage?.data?.body) {
              body = String(remoteMessage.data.body).trim();
            }

            await debugLog(`📱 Título final: "${title}"`);
            await debugLog(`📱 Corpo final: "${body}"`);
          } catch (extractError) {
            await debugLog(
              `❌ ERRO na extração: ${extractError.message}`,
              true
            );
          }

          // Mostrar APENAS notificação local (SEM Alert.alert)
          try {
            await debugLog("🔄 Criando notificação local...");

            const result = await Notifications.scheduleNotificationAsync({
              content: {
                title: title,
                body: body,
                data: remoteMessage?.data || {},
                sound: "default",
                priority: Notifications.AndroidImportance.HIGH,
                categoryIdentifier: "message",
              },
              trigger: null,
            });

            await debugLog(`✅ Notificação local criada: ${result}`);
          } catch (notificationError) {
            await debugLog(
              `❌ ERRO notificação local: ${notificationError.message}`,
              true
            );

            // Fallback: salvar para mostrar depois
            try {
              const pendingNotifications =
                (await AsyncStorage.getItem("pendingNotifications")) || "[]";
              const notifications = JSON.parse(pendingNotifications);
              notifications.push({
                timestamp: new Date().toISOString(),
                title,
                body,
                shown: false,
              });
              await AsyncStorage.setItem(
                "pendingNotifications",
                JSON.stringify(notifications)
              );
              await debugLog("💾 Notificação salva para mostrar depois");
            } catch (saveError) {
              await debugLog(
                `❌ ERRO ao salvar notificação: ${saveError.message}`,
                true
              );
            }
          }
        } catch (messageError) {
          await debugLog(
            `❌ ERRO no listener FCM: ${messageError.message}`,
            true
          );
        }
      });

      debugLog("✅ Listener FCM configurado");
    } catch (error) {
      debugLog(`❌ ERRO ao configurar listener FCM: ${error.message}`, true);
    }

    // Configurar outros listeners FCM de forma mais simples
    try {
      debugLog("🚀 Configurando listeners adicionais...");

      // Background tap - versão simplificada
      messaging().onNotificationOpenedApp((remoteMessage) => {
        try {
          debugLog("🔔 App aberto por notificação background");
          const title = remoteMessage?.notification?.title || "App aberto";
          const body = remoteMessage?.notification?.body || "Por notificação";
          setTimeout(() => Alert.alert(title, body), 500);
        } catch (error) {
          debugLog(`❌ Erro background tap: ${error.message}`, true);
        }
      });

      // Quit state - versão simplificada
      messaging()
        .getInitialNotification()
        .then((remoteMessage) => {
          if (remoteMessage) {
            try {
              debugLog("🔔 App iniciado por notificação");
              const title =
                remoteMessage?.notification?.title || "App iniciado";
              const body =
                remoteMessage?.notification?.body || "Por notificação";
              setTimeout(() => Alert.alert(title, body), 1000);
            } catch (error) {
              debugLog(`❌ Erro quit tap: ${error.message}`, true);
            }
          }
        })
        .catch((error) => {
          debugLog(`❌ Erro initial notification: ${error.message}`, true);
        });

      // Token refresh - versão simplificada
      unsubscribeTokenRefresh = messaging().onTokenRefresh((token) => {
        try {
          debugLog("🔄 Token FCM atualizado");
          setFcmToken(token);
        } catch (error) {
          debugLog(`❌ Erro token refresh: ${error.message}`, true);
        }
      });

      debugLog("✅ Todos os listeners FCM configurados");
    } catch (error) {
      debugLog(`❌ ERRO listeners adicionais: ${error.message}`, true);
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
        unsubscribeTokenRefresh && unsubscribeTokenRefresh();
        subscription.unsubscribe();
        notificationListener.remove();
        responseListener.remove();
      } catch (error) {
        console.error("[Debug] Erro ao limpar listeners:", error);
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
      Alert.alert(
        "Debug",
        `Salvando Firebase FCM token para usuário ${userId}`
      );

      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("motoboy_token")
        .eq("id", userId)
        .single();

      if (fetchError) {
        Alert.alert("Debug", `Erro ao buscar perfil: ${fetchError.message}`);
        return;
      }

      if (profile?.motoboy_token === token) {
        Alert.alert("Debug", `Firebase FCM token já salvo e é o mesmo`);
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ motoboy_token: token })
        .eq("id", userId);

      if (updateError) {
        Alert.alert(
          "Debug",
          `Erro ao atualizar Firebase FCM token: ${updateError.message}`
        );
      } else {
        Alert.alert("Success", `Firebase FCM token salvo no Supabase!`);
      }
    } catch (err) {
      Alert.alert("Debug", `Erro geral: ${err.message}`);
    }
  }

  // Função para ver mensagens recebidas em background
  const showBackgroundMessages = async () => {
    try {
      const backgroundMessages = await AsyncStorage.getItem(
        "backgroundMessages"
      );
      if (backgroundMessages) {
        const messages = JSON.parse(backgroundMessages);
        const summary = messages
          .map(
            (msg, index) =>
              `${index + 1}. [${msg.timestamp.substring(11, 19)}] ${
                msg.title
              }: ${msg.body}`
          )
          .join("\n\n");
        Alert.alert("📱 MENSAGENS BACKGROUND", summary || "Nenhuma mensagem");
      } else {
        Alert.alert("📱 BACKGROUND", "Nenhuma mensagem background encontrada");
      }
    } catch (e) {
      Alert.alert(
        "❌ ERRO",
        "Falha ao carregar mensagens background: " + e.message
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#3578e5" }}>
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

      {/* Painel de debug para APK - remover em produção */}
      {session && (
        <View
          style={{
            position: "absolute",
            bottom: 20,
            left: 20,
            right: 20,
            backgroundColor: "rgba(0,0,0,0.9)",
            padding: 15,
            borderRadius: 8,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <Button
              title="🧪 Local"
              onPress={testLocalNotification}
              color="#007AFF"
            />
            <Button
              title="🎭 FCM"
              onPress={testFCMSimulation}
              color="#34C759"
            />
            <Button title="📝 Logs" onPress={showDebugLogs} color="#FF9500" />
            <Button
              title="� MSG"
              onPress={showLastFCMMessage}
              color="#AF52DE"
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <Button
              title="�🗑️ Clear All"
              onPress={clearDebugLogs}
              color="#FF3B30"
            />
          </View>
          <Text
            style={{
              color: "white",
              fontSize: 10,
              textAlign: "center",
              marginTop: 5,
            }}
          >
            Debug: {debugLogs.length} logs | Local=Expo, FCM=Sim, MSG=Real FCM
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default App;
