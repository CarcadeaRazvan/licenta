import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Button,
  Switch,
} from "react-native";
import { useNavigation, withNavigation } from "@react-navigation/native";

const ChatBody = ({ socket, token }) => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [chatName, setChatName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [privateChats, setPrivateChats] = useState([]);
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
    socket.emit("get_shared_chats");

    socket.on("updateChats", (data) => {
      if (data.chatId) {
        socket.emit("get_chat_ids");

        socket.on("chatIds", (chat_data) => {
          if (chat_data.currentUser == userDataRef.current) {
            if (chat_data.chatIds.includes(data.chatId)) {
              socket.emit("get_chat_from_ids", { chat_data });

              socket.on("chatByIds", (chat_by_data) => {
                if (chat_by_data.currentUser == userDataRef.current) {
                  setPrivateChats(chat_by_data.privateChats);
                }
              });
            }
          }
        });
      } else {
        socket.emit("get_chat_ids");

        socket.on("chatIds", (chat_data) => {
          if (chat_data.currentUser == userDataRef.current) {
            socket.emit("get_chat_from_ids", { chat_data });

            socket.on("chatByIds", (chat_by_data) => {
              if (chat_by_data.currentUser == userDataRef.current) {
                setPrivateChats(chat_by_data.privateChats);
              }
            });
          }
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleChatCreate = async () => {
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

  const handleCreateChat = () => {
    const data = {
      name: chatName,
      messages: [],
      participants: selectedUsers.filter((user) => user.enabled),
    };

    socket.emit("create_chat", { data });

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
        <Text style={styles.headerText}>Chat</Text>
        <View style={styles.spacer} />
        <TouchableOpacity onPress={handleChatCreate}>
          <Text style={styles.addButton}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={privateChats.map((chat) => ({
          id: chat[0],
          name: chat[1],
        }))}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatItem}
            onPress={() =>
              navigation.navigate("PrivateChat", {
                chatId: item.id,
                token: token,
              })
            }
          >
            <Text style={styles.chatItemText}>{item.name}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.chatContainer}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <TextInput
            placeholder="Enter chat name"
            value={chatName}
            onChangeText={(text) => setChatName(text)}
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

          <Button title="Create Chat" onPress={handleCreateChat} />
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
    marginLeft: -15,
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
  chatContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  chatItem: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 10,
  },
  chatItemText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    marginTop: 60,
    padding: 20,
    backgroundColor: "white",
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  addButton: {
    marginRight: 30,
    marginTop: 50,
    fontSize: 18,
  },
});

export default ChatBody;
