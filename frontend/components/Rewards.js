import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation, withNavigation } from "@react-navigation/native";
import { Button } from "react-native";
import { io } from "socket.io-client";
import RewardsBody from "./RewardsBody";
import { StatusBar } from "expo-status-bar";

const Rewards = ({ route }) => {
  const { token } = route.params;
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
    <View style={styles.container}>
      <RewardsBody socket={socket} token={token} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Rewards;
