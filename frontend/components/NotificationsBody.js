import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Alert } from 'react-native';
import { useNavigation, withNavigation } from '@react-navigation/native';
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from 'expo-linear-gradient';

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
        if (userDataRef.current == data["currentUser"])
          setNotifications(data["notifications"]);
    });
  }, []);

  const handleClearNotifications = () => {
    Alert.alert(
      'Confirmation',
      'Are you sure you want to delete all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => clearNotifications() },
      ]
    );
  };

  const clearNotifications = async () => {
    socket.emit("clear_notifications");
  };

  const handleGoBack = () => {
    navigation.goBack();
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
        <Text style={styles.headerText}>Notifications</Text>
        <View style={styles.spacer} />
      </View>
      </LinearGradient>
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
  },
  backButton: {
    color: "#ccc",
    marginLeft: 20,
    marginTop: 55,
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
    backgroundColor: "#272829",
    borderRadius: 10,
    padding: 20,
    marginBottom: 10,
  },
  listItemText: {
    fontSize: 18,
    color: "#ccc",
    fontWeight: "bold",
  },
  individualFooter: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#333338',
  },
  individualDeleteButton: {
    fontSize: 22,
    // alignItems: "center",
    fontWeight: "bold",
    color: "#ccc",
    marginLeft: 85,
  },
  content: {
    flex: 1,
    backgroundColor: "#333338"
  },
});

export default NotificationsBody;
