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

      <FlatList
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

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <TextInput
            style={styles.input}
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
                <Switch
                  value={isSelected(item)}
                  onValueChange={() => handleUserSelection(item)}
                />
                <Text>{item.username}</Text>
              </View>
            )}
          />

          <Button title="Create List" onPress={handleCreateList} />
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 20,
  },
  addButton: {
    marginRight: 30,
    marginTop: 50,
    fontSize: 18,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  modalContainer: {
    flex: 1,
    marginTop: 60,
    padding: 20,
    backgroundColor: "white",
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

export default ShoppingBody;
