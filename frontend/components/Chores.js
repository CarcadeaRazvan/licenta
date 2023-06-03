import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation, withNavigation } from "@react-navigation/native";
import { Button } from "react-native";
import { io } from "socket.io-client";
import ChoresBody from "./ChoresBody";

const Chores = ({ token }) => {
  const socket = io("http://192.168.1.137:5000", {
    pingTimeout: 1000,
    pingInterval: 1000,
    extraHeaders: { Authorization: `Bearer ${token}` },
  });

  return (
    <View style={styles.container}>
      <ChoresBody socket={socket} token={token} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Chores;
