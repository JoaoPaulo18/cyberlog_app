import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import { Camera, CameraView } from "expo-camera";
import { Picker } from "@react-native-picker/picker";
import { supabase } from "../supabaseClient";
import { useAudioPlayer } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";

const OrderDetailScreen = ({ route, navigation }) => {
  const { order } = route.params;

  // campos de entrega
  const [receiverName, setReceiverName] = useState("");
  const [recipientType, setRecipientType] = useState("O próprio");
  const [orderNumber, setOrderNumber] = useState(order.order_number || "");
  const [warning, setWarning] = useState("");

  // scanner
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);

  // foto
  const cameraRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);

  const beepPlayer = useAudioPlayer(require("../../assets/beep.mp3"));
  const errorPlayer = useAudioPlayer(require("../../assets/error.mp3"));

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const playBeep = (type) => {
    const player = type === "beep" ? beepPlayer : errorPlayer;
    player.seekTo(0);
    player.play();
  };

  const handleScanPress = async () => {
    if (!hasPermission) {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
      if (status !== "granted") {
        return Alert.alert("Permissão necessária", "Permita o uso da câmera.");
      }
    }
    setScanning(true);
  };

  const handleBarCodeScanned = async ({ data }) => {
    playBeep("beep");
    setScanning(false);
    setOrderNumber(data);
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
    setPhotoUri(photo.uri);
    setCameraOpen(false);
  };

  const handleDeliver = async () => {
    if (!receiverName.trim() || !orderNumber.trim()) {
      playBeep("error");
      return setWarning("Preencha todos os campos");
    }
    if (orderNumber.toUpperCase() !== order.codigo_barras) {
      playBeep("error");
      return setWarning("Código errado");
    }
    if (!photoUri) {
      playBeep("error");
      return setWarning("Tire a foto do produto");
    }

    // se tirou foto, envia para Storage e pega URL
    let photoUrl = null;
    if (photoUri) {
      const fileName = `entregas/${orderNumber}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("imagens-entregas")
        .upload(
          fileName,
          { uri: photoUri, name: fileName, type: "image/jpeg" },
          { upsert: true }
        );
      if (uploadError) {
        console.error("Upload failed:", uploadError);
      } else {
        const { data } = supabase.storage
          .from("imagens-entregas")
          .getPublicUrl(fileName);
        photoUrl = data.publicUrl;
      }
    }

    // montar payload de update
    const updates =
      order.status === "devolucao"
        ? { data_devolucao: new Date().toISOString(), status: "devolvido" }
        : {
            Nome_recebedor_entrega: receiverName,
            Tipo_recebedor_entrega: recipientType,
            data_entrega: new Date().toISOString(),
            status: "entregue",
          };
    if (photoUrl) updates.imagem_entrega = photoUrl;
    const { data, error } = await supabase
      .from("pedidos")
      .update(updates)
      .eq("codigo_barras", orderNumber.toUpperCase())
      .select();

    if (error || !data.length) {
      playBeep("error");
      setWarning("Não foi possível concluir");
    } else {
      playBeep("beep");
      navigation.navigate(
        order.status === "devolucao" ? "Devolucao" : "OrdersScreen"
      );
    }
  };

  const handleDeliverOffline = async () => {
    if (!receiverName.trim() || !orderNumber.trim()) {
      playBeep("error");
      return setWarning("Preencha todos os campos");
    }
    if (orderNumber.toUpperCase() !== order.codigo_barras) {
      playBeep("error");
      return setWarning("Código errado");
    }
    if (!photoUri) {
      playBeep("error");
      return setWarning("Tire a foto do produto");
    }

    // salvar offline com URI da foto, se existir
    const stored = await AsyncStorage.getItem("offlineDeliveries");
    const arr = stored ? JSON.parse(stored) : [];
    arr.push({
      codigo_barras: orderNumber.toUpperCase(),
      Nome_recebedor_entrega: receiverName,
      Tipo_recebedor_entrega: recipientType,
      data_entrega: new Date().toISOString(),
      foto_local: photoUri || null,
    });
    await AsyncStorage.setItem("offlineDeliveries", JSON.stringify(arr));

    playBeep("beep");
    navigation.goBack();
  };

  if (scanning) {
    return (
      <View style={styles.scannerContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScanning(false)}>
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            onBarcodeScanned={handleBarCodeScanned}
            style={styles.camera}
            facing="back"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Pedido: {order.codigo_barras}
      </Text>

      {photoUri && (
        <Image
          source={{ uri: photoUri }}
          style={{ width: 120, height: 120, borderRadius: 6, marginBottom: 20 }}
        />
      )}

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: "#3578e5", marginBottom: 20 },
        ]}
        onPress={() => setCameraOpen(true)}
      >
        <Text style={{ color: "#fff", textTransform: "uppercase" }}>
          Tirar foto do produto
        </Text>
      </TouchableOpacity>

      <Modal visible={cameraOpen} animationType="slide">
        <View style={styles.scannerContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera_foto}
            facing="back"
          />
          <View style={styles.cameraActions}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleTakePhoto}
            >
              <Text style={{ color: "#fff" }}>Capturar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setCameraOpen(false)}
            >
              <Text style={{ color: "#fff" }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Text>Nome de quem recebeu:</Text>
      <TextInput
        value={receiverName}
        onChangeText={setReceiverName}
        placeholder="Nome do receptor"
        style={styles.input}
      />

      <Text>Tipo de pessoa que recebeu:</Text>
      <Picker
        selectedValue={recipientType}
        onValueChange={setRecipientType}
        style={styles.picker}
      >
        <Picker.Item label="O próprio" value="O próprio" />
        <Picker.Item label="Familiar" value="Familiar" />
        <Picker.Item label="Amigo" value="Amigo" />
        <Picker.Item label="Vizinho" value="Vizinho" />
      </Picker>

      <Text>Número do Pedido (cole ou escaneie):</Text>
      <TextInput
        value={orderNumber}
        onChangeText={setOrderNumber}
        placeholder="Número do Pedido"
        style={styles.input}
      />
      <Button title="Escanear Código de Barras" onPress={handleScanPress} />

      <View style={{ marginTop: 20 }}>
        <TouchableOpacity style={styles.button} onPress={handleDeliver}>
          <Text style={{ color: "#fff", textTransform: "uppercase" }}>
            Entregar
          </Text>
        </TouchableOpacity>
        {order.status !== "devolucao" && (
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: "tomato", marginTop: 10 },
            ]}
            onPress={handleDeliverOffline}
          >
            <Text style={{ color: "#fff", textTransform: "uppercase" }}>
              Entregar Offline
            </Text>
          </TouchableOpacity>
        )}
        {warning ? (
          <Text style={{ color: "red", marginTop: 10 }}>{warning}</Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "green",
    padding: 10,
    alignItems: "center",
    height: 40,
    borderRadius: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginVertical: 10,
    borderColor: "#3578e5",
  },
  picker: {
    borderRadius: 6,
    marginVertical: 10,
    backgroundColor: "#3578e5",
    color: "#fff",
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    position: "absolute",
    top: 0,
    width: "100%",
    padding: 15,
    backgroundColor: "#000",
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 20,
  },
  cameraContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    width: "100%",
    height: 300,
  },
  camera_foto: {
    width: "100%",
    height: 300,
  },
  cameraActions: {
    position: "absolute",
    bottom: 30,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  captureButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 50,
  },
  cancelButton: {
    backgroundColor: "#dc3545",
    padding: 15,
    borderRadius: 50,
  },
});

export default OrderDetailScreen;
