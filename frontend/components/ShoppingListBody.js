import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
  Alert,
  FlatList
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from 'expo-linear-gradient';

const ShoppingListBody = ({ socket, token, listId }) => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemList, setItemList] = useState([]);
  const [userData, setUserData] = useState("");
  const [listName, setListName] = useState("");

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
    const data = {
      list_id: listId,
    };

    const handleGetListName = async () => {
      try {
        const response = await fetch(
          "http://192.168.1.137:5000/shopping/get_list_name",
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
          setListName(data);
        } else {
          console.error("Error fetching list name");
        }
      } catch (error) {
        console.error(error);
      }
    };

    handleGetListName();
  }, []);

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
    setItemName("");
  };

  const handleRemoveItem = async (index) => {
    Alert.alert(
      'Confirmation',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeItem(index) },
      ]
    );
  };

  const removeItem = async (index) => {
    const data = {
      index: index,
      list_id: listId,
    };

    socket.emit("remove_item_from_list", { data });
  };

  const handleRemoveList = () => {
    Alert.alert(
      'Confirmation',
      'Are you sure you want to delete this list?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeList() },
      ]
    );
  };

  const removeList = async () => {
    const data = {
      list_id: listId,
    };

    socket.emit("remove_list", { data });

    navigation.goBack();
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
          <Text style={styles.headerText}> {listName} </Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text style={styles.individualAddButton}>+</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <FlatList
          style={styles.listContainer}
          data={itemList.flatMap((item) =>
            item[2].map((subItem, index) => ({
              id: index,
              name: subItem,
            }))
          )}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
              <View>
                <Text style={styles.listItemText}>{item.name}</Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
        />
      

        <View style={styles.individualFooter}>
          <TouchableOpacity onPress={handleRemoveList}>
            <Text style={styles.individualDeleteButton}>Delete list</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TextInput
              value={itemName}
              style={styles.input}
              placeholderTextColor="#ccc"
              keyboardAppearance="dark"
              placeholder="Enter item name"
              onChangeText={(text) => setItemName(text)}
            />
            <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddItem}
              >
                <Text style={styles.addButtonText}>Add item</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setItemName("");
                  setModalVisible(false);
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  individualContainer: {
    flex: 1,
  },
  linearGradient: {
    height: 100,
    width: 400,
  },
  headerText: {
    flex: 1,
    color: "#ccc",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 25,
    marginTop: 30,
    marginLeft: -20,
  },
  individualHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  individualFooter: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#333338',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  individualBackButton: {
    color: "#ccc",
    marginLeft: 20,
    marginTop: 55,
    fontSize: 18,
  },
  addButton: {
    // backgroundColor: "#007AFF",
    padding: 8,
    borderRadius: 4,
    marginTop: 16,
    alignItems: "center",
    marginBottom: 20,
    padding: 6,
    marginLeft: 50,
    marginRight: 50,
    borderWidth: 1,
    borderColor: "gray",
  },
  addButtonText: {
    color: "#ccc",
    fontSize: 18,
    fontWeight: "bold",
  },
  closeButton: {
    alignItems: "center",
    marginTop: 8,
  },
  closeButtonText: {
    color: "#ccc",
    fontSize: 16,
  },
  individualAddButton: {
    color: "#ccc",
    marginRight: 30,
    marginTop: 55,
    fontSize: 18,
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
  individualDeleteButton: {
    fontSize: 22,
    // alignItems: "center",
    fontWeight: "bold",
    color: "#ccc",
    marginLeft: 125,
  },
  listItemText: {
    fontSize: 18,
    color: "#ccc",
    fontWeight: "bold",
  },
  listItemSubText: {
    fontSize: 14,
    color: "gray",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    backgroundColor: "#333338",
  },
  modalContent: {
    backgroundColor: "#202022",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 1,
  },
});

export default ShoppingListBody;
