import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { io } from "socket.io-client";
import ShoppingListBody from "./ShoppingListBody";

const ShoppingList = ({ route }) => {
  const { listId, token } = route.params;

  const socket = io("http://192.168.1.137:5000", {
    pingTimeout: 1000,
    pingInterval: 1000,
    extraHeaders: { Authorization: `Bearer ${token}` },
  });

  useEffect(() => {
    return () => {
      socket.disconnect();
    };
  }, []);

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
});

export default ShoppingList;
