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
} from "react-native";
import { supabase } from "../supabaseClient";
import Icon from "react-native-vector-icons/Feather";

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Entregas");
  const [pesquisa, setPesquisa] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("status", "devolucao");
    if (!error) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const renderOrder = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("OrderDetailScreen", { order: item })}
    >
      <Text style={styles.orderTitle}>{item.Cliente}</Text>
      <Text style={styles.orderTitle}>Entrega #{item.codigo_barras}</Text>
      <Text style={styles.status}>Em andamento</Text>
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3578e5" />
      </View>
    );
  }

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
        <Text style={styles.title}>Devoluções</Text>
        <TextInput
          style={{ borderBottomColor: "gray", borderBottomWidth: 1 }}
          placeholder="Pesquisar pedido"
          onChangeText={(e) => setPesquisa(e)}
        />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => navigation.navigate("OrdersScreen")}
          style={styles.tabItem}
        >
          <Text style={[styles.tabText]}>{"Entregas"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Coleta")}
          style={styles.tabItem}
        >
          <Text style={[styles.tabText]}>{"Coletas"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <Text style={[styles.tabText, styles.activeTabText]}>
            {"Devolução"}
          </Text>
          {<View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("Controle")}
          style={styles.tabItem}
        >
          <Text style={[styles.tabText]}>{"Controle"}</Text>
        </TouchableOpacity>
      </View>
      {pesquisa == "" ? (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={{ paddingBottom: 20 }}
          onRefresh={fetchOrders}
          refreshing={loading}
        />
      ) : (
        <FlatList
          data={orders.filter((e) => {
            if (
              e.Endereco.includes(pesquisa) ||
              e.codigo_barras.includes(pesquisa) ||
              e.Cliente.includes(pesquisa)
            ) {
              return e;
            }
          })}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={{ paddingBottom: 20 }}
          onRefresh={fetchOrders}
          refreshing={loading}
        />
      )}
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
  arrow: { color: "#3578e5" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
});

export default OrdersScreen;
