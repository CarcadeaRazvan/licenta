import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { io } from "socket.io-client";
import PrivateChatBody from "./PrivateChatBody";

const PrivateChat = ({ route }) => {
  const { chatId, token } = route.params;

  const socket = io("http://192.168.1.137:5000", {
    pingTimeout: 1000,
    pingInterval: 1000,
    extraHeaders: { Authorization: `Bearer ${token}` },
  });

  return (
    <View style={styles.individualContainer}>
      <PrivateChatBody socket={socket} token={token} chatId={chatId} />
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

export default PrivateChat;
