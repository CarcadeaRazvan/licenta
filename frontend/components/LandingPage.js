import React, { useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useNavigation, withNavigation } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from "expo-status-bar";

const calculateAngle = (i, n) => 90 - (360 / n) * i;

const CircleButton = ({ index, total, label }) => {
  const angle = calculateAngle(index, total);
  const rotation = 180 - angle;

  const navigation = useNavigation();

  const handlePress = () => {
    console.log(`Pressed ${label}`);
    navigation.navigate(label);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.circleButton,
        {
          transform: [
            { translateX: 0 },
            { rotate: `${rotation}deg` },
            { translateX: 145 },
            { rotate: `-${rotation}deg` },
          ],
        },
      ]}
    >
      <Text style={styles.circleButtonLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const LandingPage = ({ navigation, onLogout }) => {
  const features = [
    { label: "Profile" },
    { label: "Chat" },
    { label: "Chores" },
    { label: "Shopping" },
    { label: "Notifications" },
    { label: "Calendar" },
  ];

  const handleLogout = () => {
    onLogout();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={['#772cf9', '#040209']}
        style={styles.linearGradient}
      >
        <Text style={styles.greet}>Together</Text>
        {features.map((feature, index) => (
          <CircleButton
            key={index}
            index={index}
            total={features.length}
            label={feature.label}
          />
        ))}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Log out</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  linearGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    height: 850,
    width: 400,
  },
  circleButton: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#611abe",
    alignItems: "center",
    justifyContent: "center",
  },
  circleButtonLabel: {
    color: "#ffffff",
    fontSize: 18,
    fontStyle: 'italic',
  },
  logoutButton: {
    position: "absolute",
    bottom: 40,
  },
  logoutButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 25,
  },
  greet: {
    fontSize: 60,
    marginTop: -630,
    color: "#19191a",
    // fontFamily: 'normal',
    // fontStyle: 'italic',
    fontWeight: 'bold',
  },
});

export default LandingPage;
