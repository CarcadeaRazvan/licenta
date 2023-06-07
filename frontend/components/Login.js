import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity } from "react-native";
import * as SecureStore from "expo-secure-store";
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from "expo-status-bar";

const Login = ({ navigation, onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch("http://192.168.1.137:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const { access_token } = await response.json();
        await SecureStore.setItemAsync("access_token", access_token);
        onLogin(access_token);
      } else {
        Alert.alert("Error", "Invalid credentials");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "An error occurred while logging in");
    }
  };

  const handleRegister = async () => {
    try {
      const response = await fetch("http://192.168.1.137:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        Alert.alert("Success", "Registration successful!");
      } else {
        Alert.alert("Error", "An error occurred while registering");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "An error occurred while registering");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#171618', '#68656b']}
        style={styles.linearGradient}
      >
      <Text style={styles.greet}>Welcome back!</Text>
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            keyboardAppearance="dark"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            keyboardAppearance="dark"
          />
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
            <Text style={styles.loginButtonText}>LOGIN</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleRegister}>
            <Text style={styles.registerLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#2c2a2d",
  },
  formContainer: {
    marginTop: 100,
  },
  inputContainer: {
    marginBottom: 20,
    width: 300,
    // height: 60,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 2,
    marginBottom: 1,
    color: "#eeecf0",
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    color: "#ffffff",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 20,
  },
  greet: {
    fontSize: 45,
    marginTop: 20,
    color: "#ffffff",
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButton: {
    borderColor: "#828282",
    backgroundColor: "#828282",
    borderWidth: 1,
    borderRadius: 5,
    marginTop: 50,
    paddingHorizontal: 50,
    paddingVertical: 10,
  },
  loginButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 25,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: "#ffffff",
    fontSize: 16,
  },
  registerLink: {
    color: "#ffffff",
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  linearGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    height: 850,
    width: 400,
  },
});

export default Login;
