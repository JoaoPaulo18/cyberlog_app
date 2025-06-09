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
import { supabase } from "../supabaseClient";
import Icon from "react-native-vector-icons/Feather";
import { CameraView } from "expo-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAudioPlayer } from "expo-audio";

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Coletas");

  // Estados para o modal de coleta
  const [modalVisible, setModalVisible] = useState(false);
  const [productCode, setProductCode] = useState("");
  const [user, setUser] = useState("");
  const [oErro, setOErro] = useState("");
  const [coletados, setColetados] = useState([]);

  const beepPlayer = useAudioPlayer(require("../../assets/beep.mp3"));
  const errorPlayer = useAudioPlayer(require("../../assets/error.mp3"));

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("status", "coletado");
    if (!error) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    async function GetData() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (!error && user) setUser(user.id);
      fetchOrders();
    }
    GetData();
  }, []);

  // Função para tocar o som de "beep"
  const playBeep = async (type) => {
    const player = type === "beep" ? beepPlayer : errorPlayer;
    player.seekTo(0);
    player.play();
  };

  // Atualiza o status do pedido e adiciona o código coletado
  const handleScanCamera = async (Cod) => {
    setOErro("");
    if (Cod.length < 8) {
      setProductCode("");
      setOErro("Código inválido");

      await playBeep("error");
      return;
    }
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("pedidos")
      .update({
        status: "coletado",
        motorista_coleta_id: user,
        data_coleta: now,
      })
      .eq("codigo_barras", Cod.toUpperCase())
      .select();
    if (data.length > 0) {
      // Toca o som ao atualizar com sucesso
      await playBeep("beep");
      setProductCode("");
      // Atualiza a lista apenas se o código ainda não foi adicionado
      setColetados((prevColetados) =>
        prevColetados.includes(Cod) ? prevColetados : [...prevColetados, Cod]
      );
      fetchOrders();
    } else {
      setOErro("Código não existe");
      await playBeep("error");
    }
  };

  const renderOrder = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.orderTitle}>{item.Cliente}</Text>
      <Text style={styles.orderTitle}>Entrega #{item.codigo_barras}</Text>
      <Text style={styles.status}>Coletado</Text>
      <View style={styles.addressContainer}>
        <Icon name="map-pin" size={16} color="#3578e5" />
        <View>
          <Text style={styles.address}>
            {item.Endereco}, {item.numero}
          </Text>
        </View>
      </View>
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
        <Text style={styles.title}>Coletados/Coletar</Text>

        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => navigation.navigate("OrdersScreen")}
            style={styles.tabItem}
          >
            <Text style={[styles.tabText]}>{"Entregas"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem}>
            <Text style={[styles.tabText, styles.activeTabText]}>
              {"Coletas"}
            </Text>
            {<View style={styles.activeTabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Devolucao")}
            style={styles.tabItem}
          >
            <Text style={[styles.tabText]}>{"Devolução"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Controle")}
            style={styles.tabItem}
          >
            <Text style={[styles.tabText]}>{"Controle"}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={{ paddingBottom: 20 }}
        />

        {/* Botão para coletar pedido */}
        <Button title="Coletar Pedido" onPress={() => setModalVisible(true)} />

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

              <View style={styles.modalButtons}>
                <Button
                  title="Coletar pedido"
                  onPress={() => handleScanCamera(productCode)}
                  color="#3578e5"
                />
                <Button
                  title="Fechar"
                  onPress={() => {
                    fetchOrders();
                    setModalVisible(false);
                  }}
                  color="red"
                />
              </View>

              {coletados.length > 0 && (
                <View style={{ marginTop: 20 }}>
                  {coletados.map((item, index) => (
                    <Text key={index.toString()} style={styles.coletadoItem}>
                      {item}
                    </Text>
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
  coletadoItem: {
    fontSize: 16,
    padding: 5,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
});

export default OrdersScreen;
