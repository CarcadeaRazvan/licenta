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
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from 'expo-linear-gradient';

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
      <StatusBar style="light" />
      <LinearGradient
        colors={['#000000', '#333338']}
        style={styles.linearGradient}
      >
        <View style={styles.individualHeader}>
          <TouchableOpacity onPress={handleGoBack}>
            <Text style={styles.individualBackButton}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerText}> {choreName} </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.choreRewardText}>By completing this task you will receive {choreReward} points!</Text>
          <Text style={styles.choreExplanationText}>Here is what this task involves:</Text>
          <Text style={styles.choreDescriptionText}>{choreDescription}</Text>
        </View>
        <View style={styles.individualFooter}>
          <TouchableOpacity onPress={handleAssignChore}>
            <Text style={styles.individualAssignButton}>Assign Chore</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  individualContainer: {
    flex: 1,
  },
  linearGradient: {
    height: 100,
    width: 400,
  },
  individualHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    color: "#ccc",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 25,
    marginTop: 30,
    marginLeft: -70,
  },
  textContainer: {
    paddingTop: 10,
    // paddingHorizontal: 20,
  },
  individualFooter: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#333338',
    // alignSelf: "flex-end",
  },
  individualBackButton: {
    color: "#ccc",
    marginLeft: 20,
    marginTop: 55,
    fontSize: 18,
  },
  individualAssignButton: {
    fontSize: 22,
    // alignItems: "center",
    fontWeight: "bold",
    color: "#ccc",
    marginLeft: 105,
  },
  choreDescriptionText: {
    paddingHorizontal: 20,
    fontSize: 18,
    color: "#ccc",
    // fontWeight: "bold",
  },
  choreRewardText: {
    paddingHorizontal: 20,
    fontSize: 18,
    color: "#ccc",
    fontWeight: "bold",
  },
  choreExplanationText: {
    marginTop: 20,
    paddingHorizontal: 20,
    fontSize: 18,
    color: "#ccc",
  },
  content: {
    flex: 1,
    flexDirection: "column",
  justifyContent: "space-between",
    backgroundColor: "#333338",
  },
});

export default ChoreBody;
