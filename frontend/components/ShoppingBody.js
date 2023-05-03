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

const ShoppingBody = ({ socket }) => {
  const navigation = useNavigation();
  const [item, setItem] = useState("");
  const [shoppingList, setShoppingList] = useState([]);

  //   console.log("txt");

  useEffect(() => {
    socket.on("updateList", (data) => {
      setShoppingList(data);
    });

    return () => {
      console.log("return");
      socket.disconnect();
    };
  }, []);

  const handleAddItem = () => {
    if (!item) {
      Alert.alert("Error", "Please enter an item");
      return;
    }

    const updatedList = [...shoppingList, item];

    setShoppingList(updatedList);
    setItem("");

    // Emit the updated list to the server
    socket.emit("add_item", { item });
  };

  const handleRemoveItem = (index) => {
    const itemToRemove = shoppingList[index];
    const updatedList = [...shoppingList];
    updatedList.splice(index, 1);

    setShoppingList(updatedList);

    // Emit the updated list to the server
    socket.emit("remove_item", { index });
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
        <Text style={styles.headerText}>Shopping</Text>
        <View style={styles.spacer} />
      </View>
      <View style={styles.content}>
        {shoppingList.map((item, index) => (
          <View key={index} style={styles.item}>
            <Text style={styles.itemText}>{item}</Text>
            <Button title="Remove" onPress={() => handleRemoveItem(index)} />
          </View>
        ))}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            value={item}
            onChangeText={setItem}
            placeholder="Enter an item"
          />
          <Button title="Add" onPress={handleAddItem} />
        </View>
      </View>
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

export default ShoppingBody;
