import React, { useState, useEffect, useRef } from "react";
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
import { useNavigation } from "@react-navigation/native";

const ChoreBody = ({
  socket,
  token,
  choreId,
  choreName,
  choreDescription,
  choreReward,
}) => {
  const navigation = useNavigation();

  const handleAssignChore = () => {
    Alert.alert(
      'Confirmation',
      'Are you sure you want to assign this chore?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Assign', style: 'destructive', onPress: () => assignChore() },
      ]
    );
  };

  const assignChore = async () => {
    const data = {
      chore_id: choreId,
    };

    socket.emit("assign_chore", { data });

    navigation.goBack();
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.individualContainer}>
      <View style={styles.individualHeader}>
        <TouchableOpacity onPress={handleGoBack}>
          <Text style={styles.individualBackButton}>Back</Text>
        </TouchableOpacity>
        <View>
          <Text> Chore Title </Text>
        </View>
      </View>

      <Text style={styles.listItemText}>{choreName}</Text>
      <Text style={styles.listItemText}>{choreDescription}</Text>
      <Text style={styles.listItemText}>{choreReward}</Text>

      <View style={styles.individualFooter}>
        <TouchableOpacity onPress={handleAssignChore}>
          <Text style={styles.individualAssignButton}>Assign Chore</Text>
        </TouchableOpacity>
      </View>
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
  individualFooter: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 600,
  },
  individualBackButton: {
    fontSize: 18,
    fontWeight: "bold",
    color: "blue",
  },
  individualAssignButton: {
    fontSize: 30,
    alignItems: "center",
    fontWeight: "bold",
    color: "blue",
  },
  listItemText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
});

export default ChoreBody;
