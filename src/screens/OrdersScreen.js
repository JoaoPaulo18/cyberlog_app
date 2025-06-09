import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Button,
  Alert,
} from "react-native";
import { supabase } from "../supabaseClient";
import Icon from "react-native-vector-icons/Feather";
import AsyncStorage from "@react-native-async-storage/async-storage";

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Entregas");
  const [pesquisa, setPesquisa] = useState("");
  const [doneOfflineCodes, setDoneOfflineCodes] = useState(new Set());

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("status", "em rota");
    if (!error) setOrders(data);
    setLoading(false);
  };

  const loadOfflineCodes = async () => {
    const entregasStr = await AsyncStorage.getItem("offlineDeliveries");
    const entregas = entregasStr ? JSON.parse(entregasStr) : [];
    const codes = new Set(entregas.map((e) => e.codigo_barras));
    setDoneOfflineCodes(codes);
  };

  useEffect(() => {
    fetchOrders();
    loadOfflineCodes();
  }, []);

  const renderOrder = ({ item }) => {
    const isDone = doneOfflineCodes.has(item.codigo_barras);
    return (
      <TouchableOpacity
        style={[
          styles.card,
          isDone && { opacity: 0.5, backgroundColor: "green" },
        ]}
        onPress={() =>
          navigation.navigate("OrderDetailScreen", { order: item })
        }
        disabled={isDone}
      >
        {isDone && (
          <Text style={styles.orderTitle}>Pedido entregue offline</Text>
        )}
        <Text style={styles.orderTitle}>{item.Cliente}</Text>
        <Text style={styles.orderTitle}>Entrega #{item.codigo_barras}</Text>
        <Text style={styles.status}>
          {!isDone ? "Em andamento" : "Entregue"}
        </Text>
        <View style={styles.addressContainer}>
          <Icon name="map-pin" size={16} color="#3578e5" />
          <View>
            <Text style={styles.address}>
              {item.Endereco}, {item.numero}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const buscarEntregasOffline = async () => {
    setLoading(true);
    try {
      const entregasStr = await AsyncStorage.getItem("offlineDeliveries");
      const entregas = entregasStr ? JSON.parse(entregasStr) : [];
      if (entregas.length > 0) {
        for (const e of entregas) {
          let photoUrl = null;
          if (e.foto_local) {
            const fileName = `entregas/${e.codigo_barras}.jpg`;
            const { error: uploadError } = await supabase.storage
              .from("imagens-entregas")
              .upload(
                fileName,
                { uri: e.foto_local, name: fileName, type: "image/jpeg" },
                { upsert: true }
              );
            if (!uploadError) {
              const { data, publicURL } = supabase.storage
                .from("imagens-entregas")
                .getPublicUrl(fileName);
              photoUrl = publicURL || data?.publicUrl;
            } else {
              console.error("Erro no upload da imagem offline:", uploadError);
            }
          }

          const updates = {
            Nome_recebedor_entrega: e.Nome_recebedor_entrega,
            Tipo_recebedor_entrega: e.Tipo_recebedor_entrega,
            data_entrega: e.data_entrega,
            status: "entregue",
          };
          if (photoUrl) updates.imagem_entrega = photoUrl;
          await supabase
            .from("pedidos")
            .update(updates)
            .eq("codigo_barras", e.codigo_barras);
        }
        await AsyncStorage.removeItem("offlineDeliveries");
        fetchOrders();
        loadOfflineCodes();
      }
    } catch (error) {
      Alert.alert("Erro ao sincronizar offline", error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3578e5" />
      </View>
    );
  }

  const filteredOrders = pesquisa
    ? orders.filter(
        (e) =>
          e.Endereco.includes(pesquisa) ||
          e.codigo_barras.includes(pesquisa) ||
          e.Cliente.includes(pesquisa)
      )
    : orders;

  return (
    <View style={styles.container}>
      <View
        style={{
          flexDirection: "row",
          marginBottom: 20,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={styles.title}>Entregas</Text>
        <TextInput
          style={{ borderBottomColor: "gray", borderBottomWidth: 1 }}
          placeholder="Pesquisar pedido"
          onChangeText={setPesquisa}
          value={pesquisa}
        />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => navigation.navigate("OrdersScreen")}
          style={styles.tabItem}
        >
          <Text style={[styles.tabText, styles.activeTabText]}>Entregas</Text>
          {tab === "Entregas" && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("Coleta")}
          style={styles.tabItem}
        >
          <Text style={styles.tabText}>Coletas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("Devolucao")}
          style={styles.tabItem}
        >
          <Text style={styles.tabText}>Devolução</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("Controle")}
          style={styles.tabItem}
        >
          <Text style={styles.tabText}>Controle</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrder}
        contentContainerStyle={{ paddingBottom: 20 }}
        onRefresh={fetchOrders}
        refreshing={loading}
      />

      <Button title="Sincronizar Entregas" onPress={buscarEntregasOffline} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f2f4f7" },
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
});

export default OrdersScreen;
