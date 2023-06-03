import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const ShoppingListBody = ({ socket, token, listId }) => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemList, setItemList] = useState([]);
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
    const list_data = {
      list_id: listId,
    };

    socket.emit("get_items_from_list", { list_data });

    socket.on("updateList", (data) => {
      if (listId == data.shoppingList[0][0]) {
        setItemList(data.shoppingList);
      }
    });
  }, []);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleAddItem = async () => {
    const data = {
      item: itemName,
      list_id: listId,
    };

    socket.emit("add_item_to_list", { data });

    setModalVisible(false);
  };

  const handleRemoveItem = async (index) => {
    const data = {
      index: index,
      list_id: listId,
    };

    socket.emit("remove_item_from_list", { data });
  };

  const handleRemoveList = async () => {
    const data = {
      list_id: listId,
    };

    socket.emit("remove_list", { data });

    navigation.goBack();
  };

  return (
    <View style={styles.individualContainer}>
      <View style={styles.individualHeader}>
        <TouchableOpacity onPress={handleGoBack}>
          <Text style={styles.individualBackButton}>Back</Text>
        </TouchableOpacity>
        <View>
          <Text> List Title </Text>
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.individualAddButton}>+</Text>
        </TouchableOpacity>
      </View>

      <View>
        <Text> List ID: {listId}</Text>
        <View>
          {itemList.map((item) =>
            item[2]
              .map((subItem, index) => ({
                id: index,
                name: subItem,
              }))
              .map((transformedItem) => (
                <TouchableOpacity
                  key={transformedItem.id}
                  onPress={() => handleRemoveItem(transformedItem.id)}
                >
                  <View>
                    <Text>{transformedItem.name}</Text>
                  </View>
                </TouchableOpacity>
              ))
          )}
        </View>
      </View>

      <View style={styles.individualFooter}>
        <TouchableOpacity onPress={handleRemoveList}>
          <Text style={styles.individualDeleteButton}>Delete list</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <TextInput
            value={itemName}
            placeholder="Enter item name"
            onChangeText={(text) => setItemName(text)}
          />

          <Button title="Add" onPress={handleAddItem} />
          <Button title="Cancel" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
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
  individualAddButton: {
    fontSize: 24,
    fontWeight: "bold",
    color: "blue",
  },
  individualDeleteButton: {
    fontSize: 30,
    alignItems: "center",
    fontWeight: "bold",
    color: "blue",
  },
  listItemText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
  },
  listItemSubText: {
    fontSize: 14,
    color: "gray",
  },
  modalContainer: {
    flex: 1,
    marginTop: 50,
    padding: 20,
    backgroundColor: "white",
  },
});

export default ShoppingListBody;
