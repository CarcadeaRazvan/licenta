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
import { LinearGradient } from 'expo-linear-gradient';

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
    setChoreName("");
    setChoreDescription("");
    setChoreReward(0);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#000000', '#333338']}
        style={styles.linearGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack}>
            <Text style={styles.backButton}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerText}>Chores</Text>
          <View style={styles.spacer} />
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.addChore}>+</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <FlatList
          style={styles.listContainer}
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

        <View style={styles.individualFooter}>
          <TouchableOpacity
            style={styles.privateChoresButton}
            onPress={() => {
              navigation.navigate("PrivateChores", { token: token });
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>My Chores</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.rewardsButton}
            onPress={() => {
              navigation.navigate("Rewards", { token: token });
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Rewards</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholderTextColor="#ccc"
              keyboardAppearance="dark"
              placeholder="Enter chore name"
              value={choreName}
              onChangeText={(text) => setChoreName(text)}
            />

            <TextInput
              style={styles.input}
              placeholderTextColor="#ccc"
              keyboardAppearance="dark"
              placeholder="Enter chore description"
              value={choreDescription}
              onChangeText={(text) => setChoreDescription(text)}
            />

            <TextInput
              style={styles.input}
              placeholderTextColor="#ccc"
              keyboardAppearance="dark"
              placeholder="Enter chore reward"
              value={choreReward.toString()}
              onChangeText={(text) => setChoreReward(text)}
              keyboardType="numeric"
            />

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleCreateChore}
              >
                <Text style={styles.addButtonText}>Create Chore</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setChoreName("");
                  setChoreDescription("");
                  setChoreReward(0);
                  setModalVisible(false);
                }}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#333338",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  linearGradient: {
    height: 100,
    width: 400,
  },
  headerText: {
    flex: 1,
    color: "#ccc",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 25,
    marginTop: 30,
    marginLeft: 35,
  },
  backButton: {
    color: "#ccc",
    marginLeft: 20,
    marginTop: 55,
    fontSize: 18,
  },
  spacer: {
    width: 60,
  },
  addChore: {
    color: "#ccc",
    marginRight: 30,
    marginTop: 55,
    fontSize: 18,
  },
  individualFooter: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: '#333338',
  },
  listContainer: {
    // paddingHorizontal: 20,
    // paddingTop: 10,
    paddingHorizontal: 7,
  },
  listItem: {
    backgroundColor: "#272829",
    borderRadius: 10,
    padding: 20,
    marginBottom: 10,
  },
  listItemText: {
    fontSize: 18,
    color: "#ccc",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "#171718",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 10,
    marginBottom: 1,
  },
  privateChoresButton: {
    fontWeight: "bold",
    color: "#ccc",
    borderWidth: 1,
    backgroundColor: "#171718",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  rewardsButton: {
    fontWeight: "bold",
    color: "#ccc",
    marginLeft: "auto",
    borderWidth: 1,
    backgroundColor: "#171718",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 20,
    color: "#ccc",
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    backgroundColor: "#333338",
  },
  input: {
    fontSize: 17,
    color: "#ffffff",
    paddingLeft: 5,
    paddingRight: 5,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "grey",
    height: 30,
    borderRadius: 15,
  },
  addButton: {
    // backgroundColor: "#007AFF",
    padding: 8,
    borderRadius: 4,
    marginTop: 16,
    alignItems: "center",
    marginBottom: 20,
    padding: 6,
    marginLeft: 50,
    marginRight: 50,
    borderWidth: 1,
    borderColor: "gray",
  },
  addButtonText: {
    color: "#ccc",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    alignItems: "center",
    marginTop: 8,
  },
  closeButtonText: {
    color: "#ccc",
    fontSize: 16,
  },
});

export default ChoresBody;
