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
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const PrivateChatBody = ({ socket, token, chatId }) => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

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
        setMessages(data.privateChat[0][2]);
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

  // const decryptMessage = async (ciphertext) => {
  //   try {
  //     const response = await fetch("http://192.168.1.128:5000/chat/decrypt", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({
  //         ciphertext: ciphertext,
  //       }),
  //     });

  //     const data = await response.json();
  //     return data.plaintext;
  //   } catch (error) {
  //     console.error("Error decrypting message:", error);
  //   }
  // };

  return (
    <View style={styles.individualContainer}>
      <View style={styles.individualHeader}>
        <TouchableOpacity onPress={handleGoBack}>
          <Text style={styles.individualBackButton}>Back</Text>
        </TouchableOpacity>
        <View>
          <Text> Chat Title </Text>
        </View>
      </View>

      <FlatList
        style={styles.messageList}
        data={messages}
        renderItem={({ item }) => (
          <View
            key={`${item.content}-${item.timestamp}`}
            style={styles.messageContainer}
          >
            <View style={styles.messageContent}>
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.messageText}>{item.content}</Text>
              <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>
          </View>
        )}
        keyExtractor={(item, index) =>
          `${item.content}-${item.timestamp}-${index}`
        }
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : -210}
      >
        <View style={[styles.inputContainer]}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={(text) => setMessage(text)}
            placeholder="Type a message..."
          />
          <Button title="Send" onPress={handleMessageSend} />
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
  userPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
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
    marginBottom: 5,
  },
  messageText: {
    fontSize: 16,
  },
  individualContainer: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
  },
  individualHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  individualFooter: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 600,
  },
  individualBackButton: {
    fontSize: 18,
    fontWeight: "bold",
    color: "blue",
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
    paddingHorizontal: 10,
    paddingVertical: 2,
    backgroundColor: "lightgray",
  },
  input: {
    flex: 1,
    marginRight: 10,
    height: 40,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    paddingLeft: 10,
  },
  messageList: {
    flex: 1,
  },
});

export default PrivateChatBody;
