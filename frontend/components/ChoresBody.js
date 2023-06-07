import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Button,
  Alert,
  Modal,
  FlatList,
  Switch,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

const ChoresBody = ({ socket, token }) => {
  const navigation = useNavigation();
  const [chores, setChores] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [choreName, setChoreName] = useState("");
  const [choreDescription, setChoreDescription] = useState("");
  const [choreReward, setChoreReward] = useState(0);

  useEffect(() => {
    socket.emit("get_chores");

    socket.on("getChores", (data) => {
      setChores(data.chores);
    });
  }, []);

  const handleCreateChore = () => {
    const data = {
      chore_name: choreName,
      chore_description: choreDescription,
      chore_reward: choreReward,
    };

    socket.emit("create_chore", { data });

    setModalVisible(false);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Chores</Text>
        <View style={styles.spacer} />
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.addButton}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={chores.map((chore) => ({
          id: chore[0],
          name: chore[1],
          description: chore[2],
          reward: chore[3],
        }))}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.listItem}
            onPress={() =>
              navigation.navigate("Chore", {
                choreId: item.id,
                choreName: item.name,
                choreDescription: item.description,
                choreReward: item.reward,
                token: token,
              })
            }
          >
            <Text style={styles.listItemText}>{item.name}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter chore name"
            value={choreName}
            onChangeText={(text) => setChoreName(text)}
          />

          <TextInput
            style={styles.input}
            placeholder="Enter chore description"
            value={choreDescription}
            onChangeText={(text) => setChoreDescription(text)}
          />

          <TextInput
            style={styles.input}
            placeholder="Enter chore reward"
            value={choreReward.toString()}
            onChangeText={(text) => setChoreReward(text)}
            keyboardType="numeric"
          />

          <Button title="Create Chore" onPress={handleCreateChore} />
          <Button title="Cancel" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.privateChoresButton}
        onPress={() => {
          navigation.navigate("PrivateChores", { token: token });
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.privateChoresButtonText}>My Chores</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.rewardsButton}
        onPress={() => {
          navigation.navigate("Rewards", { token: token });
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.privateChoresButtonText}>Rewards</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    height: 80,
  },
  headerText: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 25,
    marginTop: 50,
    marginLeft: 30,
  },
  backButton: {
    marginLeft: 30,
    marginTop: 50,
    fontSize: 18,
  },
  spacer: {
    width: 60,
  },
  addButton: {
    fontSize: 18,
    marginTop: 55,
    marginRight: 15,
  },
  listContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  listItem: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 10,
  },
  listItemText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    marginTop: 60,
    padding: 20,
    backgroundColor: "white",
  },
  privateChoresButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "blue",
  },
  rewardsButton: {
    position: "absolute",
    bottom: 16,
    left: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "blue",
  },
  privateChoresButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default ChoresBody;
