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
} from "react-native";
import { useNavigation, withNavigation } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";

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
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Calendar</Text>
        <View style={styles.spacer} />
      </View>
      <View style={styles.content}>
        <Calendar
          onDayPress={handleDateSelect}
          markedDates={
            selectedDate ? { [selectedDate]: { selected: true } } : {}
          }
        />
        <View>
          {events.length > 0 ? (
            <FlatList
              data={events}
              renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleEventPress(item)}>
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
              )}
            />
          ) : (
            <Text>No events found</Text>
          )}

            <Modal visible={usersModal} animationType="slide">
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Share Event</Text>
                <Text style={styles.modalEventName}>{selectedEvent && selectedEvent[1]}</Text>
      
                {/* Display users not part of the event */}
                <Text style={styles.modalSubtitle}>Users not part of the event:</Text>
                  {userAvailabilities && (
                    <FlatList
                      data={availableUsers.map((user, index) => ({
                        ...user,
                        key: index.toString(),
                      }))}
                      renderItem={({ item }) => (
                        <View style={styles.userItem}>
                          <Switch
                            value={isSelected(item)}
                            onValueChange={() => handleUserSelection(item)}
                          />
                          <Text>{item.username}</Text>
                        </View>
                      )}
                    />
                  )}
      
                <TouchableOpacity style={styles.modalButton} onPress={handleShareEvent}>
                  <Text style={styles.modalButtonText}>Share</Text>
                </TouchableOpacity>
      
                <TouchableOpacity style={styles.modalButton} onPress={() => setUsersModal(false)}>
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </Modal>

          <TouchableOpacity
            style={styles.addButton}
            onPress={handleActivityCreate}
          >
            <Text style={styles.addButtonText}>Schedule an activity</Text>
          </TouchableOpacity>
        </View>
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.selectedDateText}>{selectedDate}</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter activity name"
                value={activityName}
                onChangeText={(text) => setActivityName(text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter activity description"
                value={activityDescription}
                onChangeText={(text) => setActivityDescription(text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter start time"
                value={startTime}
                onChangeText={(text) => setStartTime(text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter end time"
                value={endTime}
                onChangeText={(text) => setEndTime(text)}
              />
              <TouchableOpacity
                style={styles.addButton}
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
                      <Switch
                        value={isSelected(item)}
                        onValueChange={() => handleUserSelection(item)}
                      />
                      <Text>{item.username}</Text>
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
                  setModalVisible(false);
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    marginTop: 0,
  },
  text: {
    fontSize: 20,
  },
  agendaItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  availabilityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  userName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
  },
  availability: {
    flex: 2,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: "#007AFF",
    padding: 8,
    borderRadius: 4,
    marginTop: 16,
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  closeButton: {
    alignItems: "center",
    marginTop: 8,
  },
  closeButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  eventItemContainer: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    // marginVertical: 4,
    padding: 10,
  },
  eventItem: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 10,
    // marginBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalEventName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalUser: {
    fontSize: 16,
    marginBottom: 5,
  },
  modalButton: {
    backgroundColor: 'lightgray',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SharedCalendarBody;
