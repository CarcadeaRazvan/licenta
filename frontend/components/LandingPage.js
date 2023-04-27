import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useNavigation, withNavigation } from '@react-navigation/native';

const calculateAngle = (i, n) => 90 - (360 / n) * i;

const CircleButton = ({ index, total, label }) => {
  const angle = calculateAngle(index, total);
  const isUpperHalf = index < total / 2;
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
    { label: 'Profile' },
    { label: 'Chat' },
    { label: 'Chores' },
    { label: 'Shopping' },
    { label: 'Notifications' },
    { label: 'Friends' },
  ];

  const handleLogout = () => {
    onLogout();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.greet}>Welcome, X</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#696969',
  },
  circleButton: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ba55d3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButtonLabel: {
    color: '#fff',
    fontSize: 20,
  },
  logoutButton: {
    position: 'absolute',
    bottom: 30,
    backgroundColor: 'lightblue',
    padding: 10,
    borderRadius: 10,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  greet: {
    position: 'absolute',
    fontSize: 25,
    alignSelf: 'center',
    color: '#000000',
  },
});

export default LandingPage;
