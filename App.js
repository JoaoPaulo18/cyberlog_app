import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  Alert,
  Platform,
  PermissionsAndroid,
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

// Firebase imports
import messaging from "@react-native-firebase/messaging";

// Configuração para apresentar notificações mesmo quando o app está em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Stack = createNativeStackNavigator();

const App = () => {
  const [session, setSession] = useState(null);
  const [fcmToken, setFcmToken] = useState("");

  // Configurar permissões de notificação
  const requestUserPermission = async () => {
    try {
      // Configurar canal de notificação para Android
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Notificações do App",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF231F7C",
          sound: true,
        });

        // Para Android 13+ (API 33+)
        if (Platform.Version >= 33) {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
        }
      }

      // Solicitar permissões Expo Notifications
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // Solicitar permissão Firebase
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        getFcmToken();
      }
    } catch (error) {
      console.error("Erro ao solicitar permissões:", error);
    }
  };

  // Obter FCM token
  const getFcmToken = async () => {
    try {
      const fcmToken = await messaging().getToken();
      if (fcmToken) {
        console.log("FCM Token obtido:", fcmToken.substring(0, 50) + "...");
        setFcmToken(fcmToken);
      }
    } catch (error) {
      console.error("Erro ao obter FCM token:", error);
    }
  };

  // Apresentar notificação local
  const showLocalNotification = async (title, body, data = {}) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title || "Nova Mensagem",
          body: body || "Você recebeu uma nova mensagem",
          data,
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Mostrar imediatamente
      });
    } catch (error) {
      console.error("Erro ao criar notificação local:", error);
    }
  };

  useEffect(() => {
    // Inicializar permissões
    requestUserPermission();

    // Listener para mensagens FCM quando app está em foreground
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log("📱 FCM Message received:", remoteMessage);

      // Apresentar notificação local
      await showLocalNotification(
        remoteMessage.notification?.title,
        remoteMessage.notification?.body,
        remoteMessage.data
      );
    });

    // Verificar se o app foi aberto por uma notificação
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log("App opened from notification:", remoteMessage);
        }
      });

    // Listener para quando app é aberto via notificação em background
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log("App opened from background notification:", remoteMessage);
    });

    // Autenticação Supabase
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
    });

    return () => {
      unsubscribe();
      subscription.unsubscribe();
    };
  }, []);

  // Salvar token FCM quando usuário logar
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
        console.log("FCM token já salvo");
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
