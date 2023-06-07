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
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from 'expo-linear-gradient';

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
    setChatName("");
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
          <Text style={styles.headerText}>Chat</Text>
          <View style={styles.spacer} />
          <TouchableOpacity onPress={handleChatCreate}>
            <Text style={styles.addButton}>+</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
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
            style={styles.input}
            placeholderTextColor="#ccc"
            placeholder="Enter chat name"
            keyboardAppearance="dark"
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
                <Text style={styles.username}>{item.username}</Text>
                <Switch
                  value={isSelected(item)}
                  onValueChange={() => handleUserSelection(item)}
                />
              </View>
            )}
          />

          <TouchableOpacity onPress={handleCreateChat}>
            <Text style={styles.createButton}>Create Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
              setModalVisible(false);
              setChatName("");
            }}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
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
  },
  text: {
    fontSize: 20,
  },
  chatContainer: {
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  chatItem: {
    backgroundColor: "#66666b",
    borderRadius: 10,
    padding: 20,
    marginBottom: 10,
  },
  chatItemText: {
    fontSize: 18,
    color: "#111214",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    marginTop: 300,
    padding: 20,
    backgroundColor: "#202022",
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
  input: {
    fontSize: 18,
    marginTop: 20,
    marginLeft: 110,
    marginBottom: 40,
    color: "#ccc",
  },
  createButton: {
    color: "#ccc",
    marginLeft: 120,
    marginBottom: 35,
    fontSize: 22,
  },
  cancelButton: {
    color: "#ccc",
    marginLeft: 145,
    marginBottom: 35,
    fontSize: 18,
  },
});

export default ChatBody;
