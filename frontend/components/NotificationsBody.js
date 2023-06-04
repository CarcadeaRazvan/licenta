import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { useNavigation, withNavigation } from '@react-navigation/native';
import { Button } from 'react-native';

const NotificationsBody = ({ socket, token }) => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState("");
  const [notifications, setNotifications] = useState([]);

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
    socket.emit("get_notifications");

    socket.on("getNotifications", (data) => {
      console.log(data);
        if (userDataRef.current == data["currentUser"])
          setNotifications(data["notifications"]);
    });
  }, []);

  const handleClearNotifications = async () => {
    socket.emit("clear_notifications");
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
        <Text style={styles.headerText}>Notifications</Text>
        <View style={styles.spacer} />
      </View>
      <View style={styles.content}>
        <FlatList
          data={notifications.map((notification) => ({
            id: notification[0],
            name: notification[1],
            message: notification[2],
          }))}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.listItem}>
              <Text style={styles.listItemText}>{item.message}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContainer}
        />
      
        <View style={styles.individualFooter}>
          <TouchableOpacity onPress={handleClearNotifications}>
            <Text style={styles.individualDeleteButton}>Clear notifications</Text>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // paddingHorizontal: 20,
    // paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#f2f2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerText: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 25,
    marginTop: 50,
    marginLeft: -15
  },
  backButton: {
    marginLeft: 30,
    marginTop: 50,
    fontSize: 18,
  },
  spacer: {
    width: 60,
  },
  text: {
    fontSize: 20,
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
  individualFooter: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  individualDeleteButton: {
    fontSize: 30,
    alignItems: "center",
    fontWeight: "bold",
    color: "blue",
  },
  content: {
    flex: 1,
  },
});

export default NotificationsBody;
