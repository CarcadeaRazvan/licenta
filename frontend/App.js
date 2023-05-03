import React from 'react';
import {Alert, Button, StyleSheet, Text, View} from 'react-native';
import {useAuth0, Auth0Provider} from 'react-native-auth0';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LandingPage from './components/LandingPage';
import Profile from './components/Profile';
import Chores from './components/Chores';
import Chat from './components/Chat';
import Friends from './components/Friends';
import Shopping from './components/Shopping';
import Notifications from './components/Notifications';
import Login from './components/Login';

const App = () => {
  const [loggedIn, setIsLoggedIn] = React.useState(false);
  const [token, setToken] = React.useState(null);

  const Stack = createStackNavigator();

  const handleLogin = (token) => {
    setIsLoggedIn(true);
    setToken(token);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken(null);
  };

  return (
    <NavigationContainer>
        <View style={styles.container}>
          {token ? (
            <Stack.Navigator>
              <Stack.Screen name="LandingPage" options={{headerShown: false}}>
                {(props) => <LandingPage {...props} onLogout={handleLogout} />}
              </Stack.Screen>
              <Stack.Screen name="Profile" options={{headerShown: false}}>
                {(props) => <Profile {...props} token={token} />}
              </Stack.Screen>
              <Stack.Screen name="Chat" component={Chat} options={{headerShown: false}}/>
              <Stack.Screen name="Chores" component={Chores} options={{headerShown: false}}/>
              <Stack.Screen name="Shopping" options={{headerShown: false}}>
                {(props) => <Shopping {...props} token={token} />}
              </Stack.Screen>
              <Stack.Screen name="Notifications" component={Notifications} options={{headerShown: false}}/>
              <Stack.Screen name="Friends" component={Friends} options={{headerShown: false}}/>
            </Stack.Navigator>
          ) : (
            <Stack.Navigator>
              <Stack.Screen name="Login" options={{ headerShown: false }}>
                {props => <Login {...props} onLogin={handleLogin} />}
              </Stack.Screen>
            </Stack.Navigator>
          )}
        </View>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F5FCFF',
  },
  header: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default App;