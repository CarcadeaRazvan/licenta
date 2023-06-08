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

const PrivateChores = ({ route }) => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState("");
  const [chores, setChores] = useState([]);
  const { token } = route.params;

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

  useEffect(() => {
    const fetchUserChores = async () => {
      try {
        const response = await fetch(
          "http://192.168.1.137:5000/chores/get_user_chores",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data["currentUser"] == userDataRef.current)
            setChores(data["chores"]);
        } else {
          console.error("Error fetching user chores");
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchUserChores();
  }, []);

  const handleCompleteChore = (id) => {
    Alert.alert(
      'Confirmation',
      'Are you sure you the chore is completed?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: () => completeChore(id) },
      ]
    );
  };

  const completeChore = async (id) => {
    const data = {
      chore_id: id,
    };

    try {
      const response = await fetch(
        "http://192.168.1.137:5000/chores/complete_chore",
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
        if (data["currentUser"] == userDataRef.current)
          setChores(data["chores"]);
      } else {
        console.error("Error completing chore");
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
          <Text style={styles.headerText}>My chores</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <FlatList
          data={chores.map((chore) => ({
            id: chore[0],
            name: chore[1],
            description: chore[2],
            reward: chore[3],
          }))}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleCompleteChore(item.id)}>
              <View style={styles.listItem}>
                <Text style={styles.choreNameText}>{item.name}</Text>
                <Text style={styles.choreDescriptionText}>{item.description}</Text>
                <Text style={styles.choreRewardText}>{item.reward}</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginLeft: -70,
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
  content: {
    flex: 1,
    backgroundColor: "#333338",
  },
  choreNameText: {
    fontSize: 18,
    color: "#ccc",
    fontWeight: "bold",
  },
  choreRewardText: {
    fontSize: 18,
    color: "#ccc",
    fontWeight: "bold",
  },
  choreDescriptionText: {
    fontSize: 18,
    color: "#ccc",
  },
});

export default PrivateChores;
