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

const RewardsBody = ({ socket, token }) => {
    const navigation = useNavigation();
    const [rewards, setRewards] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [rewardName, setRewardName] = useState("");
    const [rewardDescription, setRewardDescription] = useState("");
    const [rewardPrice, setRewardPrice] = useState(0);
    const [userData, setUserData] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(
          "http://192.168.1.137:5000/utils/get_username",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          console.error("Error fetching user data");
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchUserData();
  }, []);

  const userDataRef = useRef(userData);

  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  const handleCreateReward = () => {
    const data = {
      reward_name: rewardName,
      reward_description: rewardDescription,
      reward_price: rewardPrice,
    };

    socket.emit("create_reward", { data });

    setModalVisible(false);
  };

  useEffect(() => {
    socket.emit("get_rewards");

    socket.on("getRewards", (data) => {
      setRewards(data.rewards);
    });
  }, []);

  const handleClaimReward = (id) => {
    Alert.alert(
      'Confirmation',
      'Are you sure you want to claim this reward?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: () => claimReward(id) },
      ]
    );
  };

  const claimReward = async (id) => {
    const data = {
      reward_id: id,
    };

    try {
      const response = await fetch(
        "http://192.168.1.137:5000/rewards/claim_reward",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data["msg"])
            Alert.alert("Error", data["msg"].toString());
        else
            Alert.alert("Claimed", data["claimed"][1].toString());
      } else {
        console.error("Error claiming reward");
      }
    } catch (error) {
      console.error(error);
    }
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
        <Text style={styles.headerText}>Rewards</Text>
        <View style={styles.spacer} />
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.addButton}>+</Text>
        </TouchableOpacity>
      </View>

      {rewards.length > 0 ? (
        <FlatList
          data={rewards.map((reward) => ({
            id: reward[0],
            name: reward[1],
            description: reward[2],
            price: reward[3],
          }))}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleClaimReward(item.id)}>
              <View style={styles.listItem}>
                <Text style={styles.listItemText}>{item.name}</Text>
                <Text style={styles.listItemText}>{item.description}</Text>
                <Text style={styles.listItemText}>{item.price}</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <Text>There are no available rewards yet</Text>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter reward name"
            value={rewardName}
            onChangeText={(text) => setRewardName(text)}
          />

          <TextInput
            style={styles.input}
            placeholder="Enter reward description"
            value={rewardDescription}
            onChangeText={(text) => setRewardDescription(text)}
          />

          <TextInput
            style={styles.input}
            placeholder="Enter reward price"
            value={rewardPrice.toString()}
            onChangeText={(text) => setRewardPrice(text)}
            keyboardType="numeric"
          />

          <Button title="Create Reward" onPress={handleCreateReward} />
          <Button title="Cancel" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
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

export default RewardsBody;
