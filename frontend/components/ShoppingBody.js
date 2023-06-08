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

const ShoppingBody = ({ socket, token }) => {
  const navigation = useNavigation();
  const [shoppingLists, setShoppingLists] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [listName, setListName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
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

  useEffect(() => {
    socket.emit("get_shared_lists");

    socket.on("updateLists", (data) => {
      if (data.listId) {
        socket.emit("get_list_ids");

        socket.on("listIds", (list_data) => {
          if (list_data.currentUser == userDataRef.current) {
            if (list_data.listIds.includes(data.listId)) {
              socket.emit("get_list_from_ids", { list_data });

              socket.on("listByIds", (list_by_data) => {
                if (list_by_data.currentUser == userDataRef.current) {
                  setShoppingLists(list_by_data.shoppingLists);
                }
              });
            }
          }
        });
      } else {
        socket.emit("get_list_ids");

        socket.on("listIds", (list_data) => {
          if (list_data.currentUser == userDataRef.current) {
            socket.emit("get_list_from_ids", { list_data });

            socket.on("listByIds", (list_by_data) => {
              if (list_by_data.currentUser == userDataRef.current) {
                setShoppingLists(list_by_data.shoppingLists);
              }
            });
          }
        });
      }
    });
  }, []);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleListCreate = async () => {
    setModalVisible(true);

    try {
      const response = await fetch(
        "http://192.168.1.137:5000/utils/get_user_ids",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const usersWithEnabled = data.map((user) => ({
          ...user,
          enabled: true,
        }));

        setSelectedUsers(usersWithEnabled);
      } else {
        console.error("Error fetching user data");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateList = () => {
    const data = {
      name: listName,
      items: [],
      participants: selectedUsers.filter((user) => user.enabled),
    };

    socket.emit("create_list", { data });

    setModalVisible(false);
    setListName("");
  };

  const isSelected = (user) => {
    return selectedUsers.some(
      (selectedUser) => selectedUser.id === user.id && selectedUser.enabled
    );
  };

  const handleUserSelection = (user) => {
    setSelectedUsers((prevUsers) => {
      const updatedUsers = prevUsers.map((prevUser) => {
        if (prevUser.id === user.id) {
          return { ...prevUser, enabled: !prevUser.enabled };
        }
        return prevUser;
      });
      return updatedUsers;
    });
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
          <Text style={styles.headerText}>Shopping</Text>
          <View style={styles.spacer} />
          <TouchableOpacity onPress={handleListCreate}>
            <Text style={styles.addButton}>+</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <FlatList
          style={styles.listContainer}
          data={shoppingLists.map((list) => ({
            id: list[0],
            name: list[1],
          }))}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listItem}
              onPress={() =>
                navigation.navigate("ShoppingList", {
                  listId: item.id,
                  token: token,
                })
              }
            >
              <Text style={styles.listItemText}>{item.name}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
        />
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Create new list</Text>
          <TextInput
            style={styles.input}
            placeholderTextColor="#ccc"
            keyboardAppearance="dark"
            placeholder="Enter list name"
            value={listName}
            onChangeText={(text) => setListName(text)}
          />

          <FlatList
            data={selectedUsers.map((user, index) => ({
              ...user,
              key: index.toString(),
            }))}
            renderItem={({ item }) => (
              <View style={styles.userItem}>
                      <Text style={styles.username}>{item.username}</Text>
                      <Switch
                        value={isSelected(item)}
                        onValueChange={() => handleUserSelection(item)}
                      />
                    </View>
            )}
          />

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.modalButton} onPress={() => {
                    setModalVisible(false)
                    setListName("")
                    }}>
                      <Text style={styles.modalCloseText}>Close</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.modalButton} onPress={handleCreateList}>
                    <Text style={styles.modalShareText}>Create List</Text>
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
    marginLeft: 35,
  },
  backButton: {
    color: "#ccc",
    marginLeft: 20,
    marginTop: 55,
    fontSize: 18,
  },
  addButton: {
    color: "#ccc",
    marginRight: 30,
    marginTop: 55,
    fontSize: 18,
  },
  spacer: {
    width: 60,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333338",
  },
  text: {
    fontSize: 20,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  modalContainer: {
    // marginTop: 50,
    height: 500,
    marginTop: "auto",
    backgroundColor: "#202022",
    borderRadius: 8,
    padding: 16,
    // marginHorizontal: 16,
  },
  listContainer: {
    fontSize: 18,
    color: "#ccc",
    fontWeight: "bold",
    paddingHorizontal: 7,
  },
  listItem: {
    backgroundColor: "#272829",
    borderRadius: 10,
    width: 370,
    padding: 20,
    marginBottom: 10,
  },
  listItemText: {
    fontSize: 18,
    color: "#ccc",
    fontWeight: "bold",
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomColor: "#ccc",
  },
  username: {
    fontWeight: "bold",
    fontSize: 16,
    paddingRight: 50,
    color: "#ccc"
  },
  modalButtons: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalShareText: {
    color: "#ccc",
    fontSize: 20,
    marginRight: 50,
    fontWeight: "bold",
  },
  modalCloseText: {
    color: "#ccc",
    fontSize: 20,
    marginLeft: 50,
    // marginBottom: -5,
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
  modalTitle: {
    marginLeft: 105,
    fontWeight: "bold",
    fontSize: 22,
    paddingRight: 50,
    color: "#ccc",
    marginBottom: 25,
  },
  modalButton: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
});

export default ShoppingBody;
