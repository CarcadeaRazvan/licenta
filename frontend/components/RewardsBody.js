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
    setRewardName("");
    setRewardDescription("");
    setRewardPrice(0);
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
      <LinearGradient
        colors={['#000000', '#333338']}
        style={styles.linearGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack}>
            <Text style={styles.backButton}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerText}>Rewards</Text>
          <View style={styles.spacer} />
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.addReward}>+</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
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
                  <Text style={styles.rewardNameText}>{item.name}</Text>
                  <Text style={styles.rewardDescriptionText}>{item.description}</Text>
                  <Text style={styles.rewardPriceText}>{item.price}</Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <Text>There are no available rewards yet</Text>
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholderTextColor="#ccc"
              keyboardAppearance="dark"
              placeholder="Enter reward name"
              value={rewardName}
              onChangeText={(text) => setRewardName(text)}
            />

            <TextInput
              style={styles.input}
              placeholderTextColor="#ccc"
              keyboardAppearance="dark"
              placeholder="Enter reward description"
              value={rewardDescription}
              onChangeText={(text) => setRewardDescription(text)}
            />

            <TextInput
              style={styles.input}
              placeholderTextColor="#ccc"
              keyboardAppearance="dark"
              placeholder="Enter reward price"
              value={rewardPrice.toString()}
              onChangeText={(text) => setRewardPrice(text)}
              keyboardType="numeric"
            />

            <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleCreateReward}
                >
                  <Text style={styles.addButtonText}>Create Reward</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setRewardName("");
                    setRewardDescription("");
                    setRewardPrice(0);
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
  },
  content: {
    flex: 1,
    backgroundColor: "#333338",
  },
  linearGradient: {
    height: 100,
    width: 400,
  },
  header: {
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
    marginLeft: -20,
  },
  backButton: {
    color: "#ccc",
    marginLeft: 20,
    marginTop: 55,
    fontSize: 18,
  },
  addReward: {
    color: "#ccc",
    marginRight: 30,
    marginTop: 55,
    fontSize: 18,
  },
  listContainer: {
    fontSize: 18,
    color: "#ccc",
    fontWeight: "bold",
  },
  listItem: {
    backgroundColor: "#272829",
    borderRadius: 10,
    width: 370,
    marginLeft: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 10,
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
  rewardNameText: {
    fontSize: 18,
    color: "#ccc",
    fontWeight: "bold",
  },
  rewardPriceText: {
    fontSize: 18,
    color: "#ccc",
    fontWeight: "bold",
  },
  rewardDescriptionText: {
    fontSize: 18,
    color: "#ccc",
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

export default RewardsBody;
