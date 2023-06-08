import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { io } from "socket.io-client";
import ChoreBody from "./ChoreBody";

const Chore = ({ route }) => {
  const { choreId, choreName, choreDescription, choreReward, token } =
    route.params;

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
      <ChoreBody
        socket={socket}
        token={token}
        choreId={choreId}
        choreName={choreName}
        choreDescription={choreDescription}
        choreReward={choreReward}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  individualContainer: {
    flex: 1,
  },
});

export default Chore;
