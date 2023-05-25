import React from "react";
import { View, StyleSheet } from "react-native";
import { io } from "socket.io-client";
import ChatBody from "./ChatBody";

const Chat = ({ token }) => {
  const socket = io("http://192.168.1.128:5000", {
    pingTimeout: 1000,
    pingInterval: 1000,
    extraHeaders: { Authorization: `Bearer ${token}` },
  });

  return (
    <View style={styles.container}>
      <ChatBody socket={socket} token={token} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Chat;
