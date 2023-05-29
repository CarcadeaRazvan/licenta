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

const PrivateChores = ({ route }) => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState("");
  const [chores, setChores] = useState([]);
  const { token } = route.params;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(
          "http://192.168.1.128:5000/utils/get_username",
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
          "http://192.168.1.128:5000/chores/get_user_chores",
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

  const handleCompleteChore = async (id) => {
    const data = {
      chore_id: id,
    };

    try {
      const response = await fetch(
        "http://192.168.1.128:5000/chores/complete_chore",
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
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>My Chores</Text>
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
          <TouchableOpacity onPress={() => handleCompleteChore(item.id)}>
            <View style={styles.listItem}>
              <Text style={styles.listItemText}>{item.name}</Text>
              <Text style={styles.listItemText}>{item.description}</Text>
              <Text style={styles.listItemText}>{item.reward}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
      />
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
});

export default PrivateChores;
