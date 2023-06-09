import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Switch,
  TextInput,
  Keyboard,
  ScrollView,
} from "react-native";
import { useNavigation, withNavigation } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from 'expo-linear-gradient';

const SharedCalendarBody = ({ token, socket }) => {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState([]);
  const [userAvailabilities, setUserAvailabilities] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [activityName, setActivityName] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [availableUsers, setAvailableUsers] = useState([]);
  const [usersModal, setUsersModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [userData, setUserData] = useState("");
  
  const calendarTheme = {
    backgroundColor: '#333338',
    calendarBackground: '#333338',
    textSectionTitleColor: '#e9e9ea',
    selectedDayBackgroundColor: '#ccc',
    selectedDayTextColor: '#000000',
    todayTextColor: '#6077fe',
    dayTextColor: '#e9e9ea',
    textDisabledColor: '#9e9e9f',
    monthTextColor: '#e9e9ea',
    textDayFontWeight: 'bold',
    textMonthFontWeight: 'bold',
    textDayHeaderFontWeight: 'bold',
  };

  const handleDateSelect = (date) => {
    setEvents([]);
    setSelectedDate(date.dateString);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleActivityCreate = async () => {
    setAvailableUsers([]);
    setUserAvailabilities(false);
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

  const handleAddEvent = async () => {
    const data = {
      activityName: activityName,
      activityDescription: activityDescription,
      selectedDate: selectedDate,
      startTime: startTime,
      endTime: endTime,
      participants: availableUsers.filter((user) => user.enabled),
    };

    try {
      const response = await fetch(
        "http://192.168.1.137:5000/calendar/add_activity",
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEvents(data["activities"]);
      } else {
        console.error("Error creating activity");
      }
    } catch (error) {
      console.error(error);
    }

    setAvailableUsers([]);
    setModalVisible(false);
    setActivityName("");
    setActivityDescription("");
    setStartTime("");
    setEndTime("");
  };

  const isSelected = (user) => {
    return availableUsers.some(
      (selectedUser) => selectedUser.id === user.id && selectedUser.enabled
    );
  };

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

  const handleUserSelection = (user) => {
    setAvailableUsers((prevUsers) => {
      const updatedUsers = prevUsers.map((prevUser) => {
        if (prevUser.id === user.id) {
          return { ...prevUser, enabled: !prevUser.enabled };
        }
        return prevUser;
      });
      return updatedUsers;
    });
  };

  useEffect(() => {
    const data = {
      selectedDate: selectedDate,
    };

    if (selectedDate) {
      socket.emit("get_user_events", { data });

      socket.on("getEvents", (data) => {
        if (userDataRef.current == data["currentUser"])
          setEvents(data["activities"]);
      });
    }
  }, [selectedDate]);

  const handleCheckAvailabilities = () => {
    fetch("http://192.168.1.137:5000/calendar/get_user_availabilities", {
      method: "POST",
      body: JSON.stringify({
        selectedDate: selectedDate,
        startTime: startTime,
        endTime: endTime,
      }),
      
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const { availabilities, currentUser } = data;
        const usernames = availabilities.map((item) => item[0]);
        const filteredUsers = selectedUsers.filter((user) =>
          usernames.includes(user.username)
        );
        setAvailableUsers(filteredUsers);
      })
      .catch((error) => {
        console.error("Error retrieving availabilities:", error);
      });
    setUserAvailabilities(true);
    Keyboard.dismiss();
  };

  const handleEventPress = async (event) => {
    setSelectedEvent(event);
    setUserAvailabilities(false);
    setAvailableUsers([]);
    
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

    fetch("http://192.168.1.137:5000/calendar/get_user_availabilities", {
      method: "POST",
      body: JSON.stringify({
        selectedDate: event[3],
        startTime: event[4],
        endTime: event[5],
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const { availabilities, currentUser } = data;
        const usernames = availabilities.map((item) => item[0]);
        const filteredUsers = selectedUsers.filter((user) =>
          usernames.includes(user.username)
        );
        setAvailableUsers(filteredUsers);
      })
      .catch((error) => {
        console.error("Error retrieving availabilities:", error);
      });

    setUserAvailabilities(true);

    setUsersModal(true);
  };

  const handleShareEvent = () => {
    const data = {
      eventId: selectedEvent[0],
      activityName: selectedEvent[1],
      selectedDate: selectedEvent[3],
      startTime: selectedEvent[4],
      endTime: selectedEvent[5],
      participants: availableUsers.filter((user) => user.enabled),
    };

    socket.emit("share_event", { data });

    setAvailableUsers([]);
    setUserAvailabilities(false);
    setUsersModal(false);
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
          <Text style={styles.headerText}>Calendar</Text>
          <View style={styles.spacer} />
        </View>
      </LinearGradient>
      
    <View style={styles.content}>
      <View style={styles.calendarContainer}>
        <Calendar
          theme={calendarTheme}
          onDayPress={handleDateSelect}
          markedDates={selectedDate ? { [selectedDate]: { selected: true } } : {}}
        />
      </View>

      <TouchableOpacity onPress={handleActivityCreate} style={styles.scheduleButtonContainer}>
        <Text style={styles.addButtonText}>Schedule an activity</Text>
      </TouchableOpacity>

      <View style={styles.listContainer}>
        {events.length > 0 ? (
          events.map((item, index) => (
            <TouchableOpacity key={index} onPress={() => handleEventPress(item)}>
              <View style={styles.eventItemContainer}>
                <View style={styles.eventItem}>
                  <Text style={styles.eventName}>{item[1]}</Text>
                  <Text style={styles.eventDescription}>{item[2]}</Text>
                  <Text style={styles.eventSchedule}>
                    {item[3]}, {item[4]} - {item[5]}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noEventsText}>No events found</Text>
        )}
      </View>
    </View>

      <Modal visible={usersModal} animationType="slide" transparent={true}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Share activity - {selectedEvent && selectedEvent[1]}</Text>
      
                <Text style={styles.modalSubtitle}>Available users not part of this activity:</Text>
                  {userAvailabilities && (
                    <FlatList
                      data={availableUsers.map((user, index) => ({
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
                  )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.modalButton} onPress={() => setUsersModal(false)}>
                      <Text style={styles.modalCloseText}>Close</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.modalButton} onPress={handleShareEvent}>
                    <Text style={styles.modalShareText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.eventModalContainer}>
            <View style={styles.modalContent}>
              <Text style={{fontSize: 16, textAlign: "center", fontWeight: "bold", marginBottom: 8, color: "#ccc"}}>{selectedDate}</Text>
              <TextInput
                style={styles.input}
                placeholderTextColor="#ccc"
                keyboardAppearance="dark"
                placeholder="Enter activity name"
                value={activityName}
                onChangeText={(text) => setActivityName(text)}
              />
              <TextInput
                style={styles.input}
                placeholderTextColor="#ccc"
                keyboardAppearance="dark"
                placeholder="Enter activity description"
                value={activityDescription}
                onChangeText={(text) => setActivityDescription(text)}
              />
              <TextInput
                style={styles.input}
                placeholderTextColor="#ccc"
                keyboardAppearance="dark"
                placeholder="Enter start time"
                value={startTime.toString()}
                keyboardType="numeric"
                onChangeText={(text) => setStartTime(text)}
              />
              <TextInput
                style={styles.input}
                placeholderTextColor="#ccc"
                keyboardAppearance="dark"
                placeholder="Enter end time"
                value={endTime.toString()}
                keyboardType="numeric"
                onChangeText={(text) => setEndTime(text)}
              />
              <TouchableOpacity
                style={styles.availabilitiesButton}
                onPress={handleCheckAvailabilities}
              >
                <Text style={styles.addButtonText}>Check Availabilities</Text>
              </TouchableOpacity>

              {userAvailabilities && (
                <FlatList
                  data={availableUsers.map((user, index) => ({
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
              )}
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddEvent}
              >
                <Text style={styles.addButtonText}>Add Event</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setActivityName("");
                  setActivityDescription("");
                  setStartTime("");
                  setEndTime("");
                  setModalVisible(false);
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      {/* </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#333338",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  backButton: {
    color: "#ccc",
    marginLeft: 20,
    marginTop: 55,
    fontSize: 18,
  },
  calendarContainer: {
    height: 320,
    backgroundColor: "#333338",
  },
  spacer: {
    width: 60,
  },
  scheduleButtonContainer: {
    paddingLeft: 5,
    paddingRight: 5,
    borderRadius: 4,
    marginBottom: 10,
    alignItems: "center",
  },
  noEventsText: {
    position: "absolute",
    fontSize: 16,
    marginTop: 150,
    marginLeft: 140,
    color: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    backgroundColor: "#333338",
  },
  listContainer: {
    backgroundColor: "#333338",
    height: 600,
  },
  modalContainer: {
    flex: 1,
    marginTop: 300,
    padding: 20,
    // justifyContent: "center",
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
  eventModalContainer: {
    flex: 1,
    justifyContent: "center",
    // justifyContent: "center",
    // backgroundColor: "#202022",
  },
  modalContent: {
    backgroundColor: "#202022",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 1,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  addButton: {
    // backgroundColor: "#007AFF",
    padding: 8,
    borderRadius: 4,
    marginTop: 16,
    alignItems: "center",
    marginBottom: 20,
    padding: 6,
    borderWidth: 1,
    borderColor: "gray",
  },
  availabilitiesButton: {
    padding: 6,
    borderRadius: 4,
    marginTop: 16,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "gray",
    marginLeft: 60,
    marginRight: 60,
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
  eventItemContainer: {
    backgroundColor: "#333338",
    borderRadius: 8,
    // marginVertical: 4,
    padding: 10,
    marginBottom: -5,
  },
  eventItem: {
    backgroundColor: "#272829",
    borderRadius: 10,
    padding: 10,
    // marginBottom: 10,
  },
  eventName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: "#e9e9ea",
  },
  eventDescription: {
    fontSize: 15,
    color: "#e9e9ea",
  },
  eventSchedule: {
    fontSize: 15,
    color: "#e9e9ea",
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: 22,
    paddingRight: 50,
    color: "#ccc",
    marginBottom: 25,
  },
  modalEventName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#ccc",
    marginBottom: 10,
  },
  modalUser: {
    fontSize: 16,
    marginBottom: 5,
  },
  modalButton: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  modalButtons: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalShareText: {
    color: "#ccc",
    fontSize: 25,
    marginRight: 50,
    fontWeight: "bold",
  },
  modalCloseText: {
    color: "#ccc",
    fontSize: 20,
    marginLeft: 50,
    marginBottom: -5,
  },
});

export default SharedCalendarBody;
