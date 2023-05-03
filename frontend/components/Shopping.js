import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Button,
  Alert,
} from "react-native";
import { useNavigation, withNavigation } from "@react-navigation/native";
import { io } from "socket.io-client";
import ShoppingBody from "./ShoppingBody";

const Shopping = ({ token }) => {
  const navigation = useNavigation();
  // const [item, setItem] = useState("");
  // const [shoppingList, setShoppingList] = useState([]);
  const socket = io("http://192.168.1.128:5000", {
    pingTimeout: 1000,
    pingInterval: 1000,
    extraHeaders: { Authorization: `Bearer ${token}` },
  });

  // console.log("txt");

  // useEffect(() => {
  //   socket.on("updateList", (data) => {
  //     setShoppingList(data);
  //   });

  //   return () => {
  //     socket.disconnect();
  //   };
  // }, []);

  // const handleAddItem = () => {
  //   if (!item) {
  //     Alert.alert("Error", "Please enter an item");
  //     return;
  //   }

  //   const updatedList = [...shoppingList, item];

  //   setShoppingList(updatedList);
  //   setItem("");

  //   // Emit the updated list to the server
  //   socket.emit("add_item", { item });
  // };

  // const handleRemoveItem = (index) => {
  //   const itemToRemove = shoppingList[index];
  //   const updatedList = [...shoppingList];
  //   updatedList.splice(index, 1);

  //   setShoppingList(updatedList);

  //   // Emit the updated list to the server
  //   socket.emit("remove_item", { index });
  // };

  // const handleGoBack = () => {
  //   navigation.goBack();
  // };

  return (
    <View style={styles.container}>
      <ShoppingBody socket={socket} />
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
});

export default Shopping;
