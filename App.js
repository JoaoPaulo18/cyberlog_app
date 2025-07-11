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
    initializeApp(); // Configurar listeners FCM
    let unsubscribe;

    try {
      console.log("Configurando listener FCM...");

      // Listener FCM mais simples possivel
      unsubscribe = messaging().onMessage(async (remoteMessage) => {
        console.log("FCM Message recebida!");
        console.log("remoteMessage:", remoteMessage);
      });

      console.log("Listener FCM configurado com sucesso");
    } catch (error) {
      console.log("Erro ao configurar listener FCM:", error);
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
    </SafeAreaView>
  );
};

export default App;
