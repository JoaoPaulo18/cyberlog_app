// src/screens/OrdersScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Button,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabaseClient";
import Icon from "react-native-vector-icons/Feather";
import { CameraView } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAudioPlayer } from "expo-audio";

const STORAGE_KEY = "@coletados";

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Controle");

  // Estados para o modal de coleta
  const [modalVisible, setModalVisible] = useState(false);
  const [productCode, setProductCode] = useState("");
  const [user, setUser] = useState("");
  const [oErro, setOErro] = useState("");
  const [coletados, setColetados] = useState([]); // agora array de objetos { code, date }

  const beepPlayer = useAudioPlayer(require("../../assets/beep.mp3"));
  const errorPlayer = useAudioPlayer(require("../../assets/error.mp3"));

  // Carrega entradas salvas no AsyncStorage
  const loadColetados = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setColetados(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Erro ao carregar coletados:", e);
    }
  };

  useEffect(() => {
    loadColetados();
    setLoading(false);
  }, []);

  // Função para tocar o som de "beep"
  const playBeep = async (type) => {
    const player = type === "beep" ? beepPlayer : errorPlayer;
    player.seekTo(0);
    player.play();
  };

  // Atualiza o status do pedido, adiciona o código coletado e salva em AsyncStorage
  const handleScanCamera = async (Cod) => {
    setOErro("");

    const dt = new Date();
    const now = `${dt.getDate().toString().padStart(2, "0")}/${(
      dt.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${dt.getFullYear()}`;

    setProductCode("");
    const newEntry = { code: Cod.toUpperCase(), date: now };

    // Atualiza state e AsyncStorage
    const alreadyExists = coletados.some((item) => item.code === newEntry.code);
    if (!alreadyExists) {
      const updatedList = [...coletados, newEntry];
      setColetados(updatedList);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
        await playBeep("beep");
      } catch (e) {
        console.error("Erro ao salvar AsyncStorage:", e);
      }
    } else {
      await playBeep("Erro");
    }
  };

  // Deleta uma entrada específica por índice
  const deleteEntry = async (index) => {
    const newArray = [...coletados];
    newArray.splice(index, 1);
    setColetados(newArray);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newArray));
    } catch (e) {
      console.error("Erro ao atualizar AsyncStorage:", e);
    }
  };

  // Deleta todas as entradas
  const clearAll = async () => {
    Alert.alert("Confirmação", "Deseja realmente excluir todos os registros?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir Todos",
        style: "destructive",
        onPress: async () => {
          setColetados([]);
          try {
            await AsyncStorage.removeItem(STORAGE_KEY);
          } catch (e) {
            console.error("Erro ao limpar AsyncStorage:", e);
          }
        },
      },
    ]);
  };

  const renderOrder = ({ item, index }) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.orderTitle}>Código #{item.code}</Text>

        <Text style={styles.orderTitle}>Data Scan:{item.date}</Text>
      </View>
      <TouchableOpacity
        onPress={() => deleteEntry(index)}
        style={styles.deleteButton}
      >
        <Text style={styles.deleteButtonText}>Excluir</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3578e5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#3578e5" }}>
      <View style={styles.container}>
        <Text style={styles.title}>Controle Pedidos</Text>

        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => navigation.navigate("OrdersScreen")}
            style={styles.tabItem}
          >
            <Text style={[styles.tabText]}>{"Entregas"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem}>
            <Text style={[styles.tabText]}>{"Coletas"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Devolucao")}
            style={styles.tabItem}
          >
            <Text style={[styles.tabText]}>{"Devolução"}</Text>
          </TouchableOpacity>

          <View style={styles.tabItem}>
            <Text style={[styles.tabText, styles.activeTabText]}>
              {"Controle"}
            </Text>
            {<View style={styles.activeTabIndicator} />}
          </View>
        </View>

        <FlatList
          data={coletados}
          keyExtractor={(item) => item.code}
          renderItem={renderOrder}
          contentContainerStyle={{ paddingBottom: 20 }}
        />

        {/* Botão para abrir modal de coleta */}
        <View style={{ marginBottom: 15 }}>
          <Button title="Excluir Todos" onPress={clearAll} color="#d9534f" />
        </View>
        <Button
          title="Adicionar Pedido"
          onPress={() => setModalVisible(true)}
        />

        {/* Modal para coletar pedido */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 20}
          >
            <ScrollView contentContainerStyle={styles.modalContainer}>
              <Text style={styles.modalTitle}>Coletar Pedido</Text>
              <Text style={styles.modalLabel}>
                Digite ou escaneie o código:
              </Text>
              <TextInput
                value={productCode}
                onChangeText={setProductCode}
                placeholder="Código do Produto"
                style={styles.modalInput}
              />
              <Text style={{ color: "red", marginBottom: 10, fontSize: 20 }}>
                {oErro}
              </Text>
              <View style={styles.cameraContainer}>
                <CameraView
                  onBarcodeScanned={({ data }) => {
                    handleScanCamera(data);
                  }}
                  style={styles.camera}
                  facing="back"
                />
              </View>

              {/* Botão para excluir todos os registros */}

              <View style={styles.modalButtons}>
                <Button
                  title="Coletar pedido"
                  onPress={() => handleScanCamera(productCode)}
                  color="#3578e5"
                />
                <Button
                  title="Fechar"
                  onPress={() => {
                    loadColetados();
                    setModalVisible(false);
                  }}
                  color="red"
                />
              </View>

              {/* Lista de itens coletados */}
              {coletados.length > 0 && (
                <View style={{ marginTop: 20 }}>
                  {coletados.map((item, index) => (
                    <View key={index.toString()} style={styles.coletadoRow}>
                      <Text style={styles.coletadoText}>
                        {item.code} — {item.date}
                      </Text>
                      <TouchableOpacity
                        onPress={() => deleteEntry(index)}
                        style={styles.deleteButton}
                      >
                        <Text style={styles.deleteButtonText}>Excluir</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f2f4f7",
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  tabs: { flexDirection: "row", marginBottom: 15 },
  tabItem: { marginRight: 20, alignItems: "center" },
  tabText: { fontSize: 16, color: "#555" },
  activeTabText: { color: "#3578e5", fontWeight: "bold" },
  activeTabIndicator: {
    width: "100%",
    height: 3,
    backgroundColor: "#3578e5",
    marginTop: 4,
    borderRadius: 10,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    gap: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderTitle: { fontWeight: "bold", fontSize: 16 },
  status: { color: "#888", marginBottom: 8 },
  addressContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  address: { fontSize: 14, color: "#333" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalLabel: { fontSize: 16, marginBottom: 10 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#3578e5",
    padding: 10,
    marginBottom: 20,
    borderRadius: 8,
  },
  cameraContainer: { flex: 0.5, height: 300, marginBottom: 20 },
  camera: { flex: 1, borderRadius: 12 },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  coletadoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  coletadoText: {
    fontSize: 16,
    flex: 1,
  },
  deleteButton: {
    backgroundColor: "#d9534f",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    maxWidth: 65,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
  },
});

export default OrdersScreen;
