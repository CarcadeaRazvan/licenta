import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation, withNavigation } from "@react-navigation/native";
import { Button } from "react-native";
import SharedCalendarBody from "./SharedCalendarBody";

const SharedCalendar = ({ token }) => {
  const handleDateSelect = (selectedDate) => {
    // Handle the selected date
    console.log("Selected date:", selectedDate);
  };

  return (
    <View>
      <SharedCalendarBody token={token} />
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

export default SharedCalendar;
