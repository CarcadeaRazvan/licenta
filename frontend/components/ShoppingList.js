import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
  Alert,
} from "react-native";
import { useNavigation, withNavigation } from "@react-navigation/native";
import { io } from "socket.io-client";
import ShoppingListBody from "./ShoppingListBody";

const ShoppingList = ({ route }) => {
  const { listId, token } = route.params;
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemList, setItemList] = useState([]);

  const socket = io("http://192.168.1.128:5000", {
    pingTimeout: 1000,
    pingInterval: 1000,
    extraHeaders: { Authorization: `Bearer ${token}` },
  });

  return (
    <View style={styles.individualContainer}>
      <ShoppingListBody socket={socket} token={token} listId={listId} />
    </View>
  );
};

const styles = StyleSheet.create({
  individualContainer: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
  },
  individualHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  individualBackButton: {
    fontSize: 18,
    fontWeight: "bold",
    color: "blue",
  },
  individualAddButton: {
    fontSize: 24,
    fontWeight: "bold",
    color: "blue",
  },
  listItemText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
  listItemSubText: {
    fontSize: 14,
    color: "gray",
  },
  modalContainer: {
    flex: 1,
    marginTop: 50, // Adjust this value as needed
    padding: 20,
    backgroundColor: "white",
  },
});

export default ShoppingList;
