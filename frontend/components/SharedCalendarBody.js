import React, { useState, useEffect } from "react";
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
import { Button } from "react-native";
import { Calendar } from "react-native-calendars";
import { Agenda } from "react-native-big-calendar";

// tabela cu disponibilitatea userilor
// la add event selectare ora de inceput si de final eveniment
// dupa selectarea orei sa scot toti userii disponibili in intervalul orar
// selectare din lista useri -> crearea evenimentului + stocare
// la apasarea pe data din calendar sa afisez toate evenimentele userului din
// ziua respectiva
// interfata: lista evenimente, adaugare disponibilitate, buton add event
// -> deschidere modal in care introduc ora de inceput si de final ->
// buton check availabilities -> flat list cu toti userii disponibili

const SharedCalendarBody = ({ token }) => {
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

  const handleDateSelect = (date) => {
    // Handle the selected date
    console.log("Selected date:", date);
    setEvents([]);
    setSelectedDate(date.dateString);
    // setModalVisible(true);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleActivityCreate = async () => {
    setUserAvailabilities(false);
    setModalVisible(true);

    try {
      const response = await fetch(
        "http://192.168.1.128:5000/utils/get_user_ids",
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
    // Handle adding event to the desired hour
    // You can implement your logic here
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
        "http://192.168.1.128:5000/calendar/add_activity",
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
        console.log(data);
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

  // useEffect(() => {
  //   console.log(events);
  // }, [selectedDate]);

  useEffect(() => {
    // Fetch events for the current user from the backend
    if (selectedDate) {
      fetch("http://192.168.1.128:5000/calendar/get_user_events", {
        method: "POST",
        body: JSON.stringify({ selectedDate: selectedDate }),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data["events"].length);

          if (data["events"].length == 0) setEvents([]);
          else {
            const date = new Date(data["events"][0][3]);
            const formattedDate = date.toISOString().slice(0, 10);
            if (selectedDate == formattedDate) {
              setEvents(data["events"]);
            }
          }
        })
        .catch((error) => {
          console.error("Error retrieving events:", error);
        });
    }
  }, [selectedDate]);

  const handleCheckAvailabilities = () => {
    fetch("http://192.168.1.128:5000/calendar/get_user_availabilities", {
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
                <View style={styles.eventItemContainer}>
                  <View style={styles.eventItem}>
                    <Text style={styles.eventName}>{item[1]}</Text>
                    <Text style={styles.eventDescription}>{item[2]}</Text>
                    <Text style={styles.eventSchedule}>
                      {item[3]}, {item[4]} - {item[5]}
                    </Text>
                  </View>
                </View>
              )}
            />
          ) : (
            <Text>No events found</Text>
          )}

          <TouchableOpacity
            style={styles.addButton}
            onPress={handleActivityCreate}
          >
            <Text style={styles.addButtonText}>Schedule activity</Text>
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
});

export default SharedCalendarBody;
