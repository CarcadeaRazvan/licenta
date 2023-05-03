import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const Login = ({ navigation, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      // Send a request to the Flask server to log in the user
      const response = await fetch('http://192.168.1.128:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      // Check if the login was successful
      if (response.ok) {
        // Get the JWT token from the response and save it in the app's state
        const { access_token } = await response.json();
        // Alert.alert(access_token);
        console.log(access_token);
        await SecureStore.setItemAsync('access_token', access_token);
        onLogin(access_token);
        // Save the token in the app's state or in secure storage
      } else {
        // The login was unsuccessful, show an error message
        Alert.alert('Error', 'Invalid credentials');
      }
    } catch (error) {
      console.log(error);
      // An error occurred while sending the request, show an error message
      Alert.alert('Error', 'An error occurred while logging in');
    }
  };

  const handleRegister = async () => {
    try {
      // Send a request to the Flask server to register the user
      const response = await fetch('http://192.168.1.128:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      // Check if the registration was successful
      if (response.ok) {
        // Show a success message
        Alert.alert('Success', 'Registration successful!');
      } else {
        // The registration was unsuccessful, show an error message
        Alert.alert('Error', 'An error occurred while registering');
      }
    } catch (error) {
      console.log(error);
      // An error occurred while sending the request, show an error message
      Alert.alert('Error', 'An error occurred while registering');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text>Username</Text>
        <TextInput value={username} onChangeText={setUsername} />
        <Text>Password</Text>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry />
        <Button title="Log In" onPress={handleLogin} />
        <Button title="Register" onPress={handleRegister} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    marginTop: 100,
  },
});

export default Login;
