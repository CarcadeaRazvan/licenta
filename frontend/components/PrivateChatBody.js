import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
  KeyboardAvoidingView,
  FlatList,
  Keyboard,
  Platform,
  Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from 'expo-linear-gradient';

const PrivateChatBody = ({ socket, token, chatId }) => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [usernames, setUsernames] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const inputRef = useRef(null);
  const [isMentioning, setIsMentioning] = useState(false);
  const [chatName, setChatName] = useState("");

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
    const chat_data = {
      chat_id: chatId,
    };

    socket.emit("get_messages_from_chat", { chat_data });

    socket.on("updateChat", (data) => {
      if (chatId == data.privateChat[0][0]) {
        const processedMessages = data.privateChat[0][2].map((message) => {
          return {
            ...message,
            isCurrentUser: message.username === userDataRef.current,
          };
        });

        setMessages(processedMessages);
      }
    });
  }, []);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleMessageSend = async () => {
    const encryptedMessage = await encryptMessage(message);

    const data = {
      message: encryptedMessage,
      chat_id: chatId,
    };

    socket.emit("sendMessage", data);
    setMessage("");
    setIsMentioning(false);
  };

  const encryptMessage = async (message) => {
    try {
      const response = await fetch("http://192.168.1.137:5000/chat/encrypt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: message,
        }),
      });

      const data = await response.json();
      return data.ciphertext;
    } catch (error) {
      console.error("Error encrypting message:", error);
    }
  };

  useEffect(() => {
    const data = {
      chat_id: chatId,
    };

    const handleMentionUser = async () => {
      try {
        const response = await fetch(
          "http://192.168.1.137:5000/chat/get_users_from_chat",
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
          setUsernames(data);
        } else {
          console.error("Error fetching user data");
        }
      } catch (error) {
        console.error(error);
      }
    };

    handleMentionUser();
  }, []);

  useEffect(() => {
    const data = {
      chat_id: chatId,
    };

    const handleGetChatName = async () => {
      try {
        const response = await fetch(
          "http://192.168.1.137:5000/chat/get_chat_name",
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
          setChatName(data);
        } else {
          console.error("Error fetching chat name");
        }
      } catch (error) {
        console.error(error);
      }
    };

    handleGetChatName();
  }, []);

  const handleInputChange = (text) => {
    setMessage(text);

    if (text.includes('@')) {
      setIsMentioning(true);
      const query = text.match(/@(\w*)$/)?.[1]?.toLowerCase();
      const filtered = usernames.filter((user) => user.username.toLowerCase().includes(query));
      setFilteredUsers(filtered);
    } else {
      setIsMentioning(false);
      setFilteredUsers([]);
    }
  };

  const handleUserSelection = (username) => {
    const newText = message.replace(/@\w*$/, `@${username}`);
    setMessage(newText);
    setFilteredUsers([]);
    setIsMentioning(false);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.individualContainer}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#000000', '#333338']}
        style={styles.linearGradient}
      >
        <View style={styles.individualHeader}>
          <TouchableOpacity onPress={handleGoBack}>
            <Text style={styles.individualBackButton}>Back</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerText}> {chatName} </Text>
          </View>
        </View>
      </LinearGradient>
      <FlatList
        style={styles.messageList}
        data={messages}
        renderItem={({ item }) => (
          <View
            key={`${item.content}-${item.timestamp}`}
            style={[
              styles.messageContainer,
              item.isCurrentUser ? styles.currentUserMessageContainer : styles.otherUserMessageContainer,
            ]}
          >
            <View style={styles.messageContent}>
              {!item.isCurrentUser && item.profilePhoto && (
                <Image
                  source={{
                    uri: `http://192.168.1.137:5000/profile/image/${item.profilePhoto}`,
                  }}
                  style={styles.profilePhoto}
                  resizeMode="contain"
                />
              )}
              <View style={styles.messageTextContainer}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.messageText}>{item.content}</Text>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>
              {item.isCurrentUser && item.profilePhoto && (
                <Image
                  source={{
                    uri: `http://192.168.1.137:5000/profile/image/${item.profilePhoto}`,
                  }}
                  style={styles.profilePhoto}
                  resizeMode="contain"
                />
              )}
            </View>
          </View>
        )}
        keyExtractor={(item, index) =>
          `${item.content}-${item.timestamp}-${index}`
        }
      />

      {isMentioning && (
        <View  style={styles.userListContainer}>
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.userItem}
                onPress={() => handleUserSelection(item.username)}
              >
                <Text style={styles.username}>{item.username}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.userList}
          />
        </View>
      )}

      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 44 : -256}
      >
        <View style={[styles.inputContainer]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={message}
            onChangeText={handleInputChange}
            placeholderTextColor="#ccc"
            placeholder="Type a message..."
            keyboardAppearance="dark"
          />
          <TouchableOpacity onPress={handleMessageSend}>
            <Text style={styles.individualSendButton}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "lightgray",
    borderRadius: 10,
    marginVertical: 5,
  },
  linearGradient: {
    height: 100,
    width: 400,
  },
  headerText: {
    color: "#ccc",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 25,
    marginTop: 30,
    marginLeft: 100,
  },
  messageContent: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    flexGrow: 1,
  },
  username: {
    fontWeight: "bold",
    fontSize: 18,
  },
  messageText: {
    fontSize: 15,
  },
  individualContainer: {
    flex: 1,
    marginTop: -20,
    marginLeft: -20,
    marginRight: -20,
    marginBottom: 40,
    backgroundColor: "#333338",
  },
  individualHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  individualBackButton: {
    color: "#ccc",
    marginLeft: 20,
    marginTop: 55,
    fontSize: 18,
  },
  chatItemText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
  chatItemSubText: {
    fontSize: 14,
    color: "gray",
  },
  inputContainer: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 20,
    paddingVertical: 2,
    backgroundColor: "#333338",
  },
  input: {
    flex: 1,
    marginRight: 10,
    marginBottom: 40,
    height: 40,
    borderWidth: 1,
    borderColor: "gray",
    color: "#ccc",
    borderRadius: 5,
    paddingLeft: 10,
  },
  individualSendButton: {
    color: "#ccc",
    marginRight: 20,
    marginBottom: 40,
    fontSize: 20,
  },
  messageList: {
    flex: 1,
  },
  profilePhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  userItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  userListContainer: {
    position: 'absolute',
    bottom: 30,
    left: 25,
    backgroundColor: '#9d9ea7',
    borderRadius: 10,
    elevation: 5,
    zIndex: 999,
  },
  currentUserMessageContainer: {
    marginLeft: 80,
    marginRight: 10,
    backgroundColor: "#6b78fa"
  },
  otherUserMessageContainer: {
    marginLeft: 10,
    marginRight: 80,
    backgroundColor: "#9d9ea7"
  },
  messageContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 10,
  },
  messageTextContainer: {
    flex: 1,
    marginLeft: 5,
  },
  timestamp: {
    color: "black",
    fontSize: 12,
    alignSelf: "flex-end",
    marginRight: 5,
  },
});

export default PrivateChatBody;
