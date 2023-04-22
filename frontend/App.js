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

const App = () => {
  const [loggedIn, setIsLoggedIn] = React.useState(true);
  const {authorize, clearSession, user, error} = useAuth0();

  const onLogin = async () => {
    console.log("press");
    try {
      setIsLoggedIn(true);
      await authorize({scope: 'openid profile email'}, {customScheme: 'auth0.com.auth0samples'});
      //
    } catch (e) {
      console.log(e);
    }
  };

  const onLogout = async () => {
    try {
      setIsLoggedIn(false);
      await clearSession({customScheme: 'auth0.com.auth0samples'});
      //
    } catch (e) {
      console.log('Log out cancelled');
    }
  };

  // const loggedIn = true;

  const Stack = createStackNavigator();

  return (
    <NavigationContainer>
      <Auth0Provider domain={"dev-vxzjazs4gxwtyfuv.eu.auth0.com"} clientId={"d1Kt5ewsVEilHku9d7vp1pC0h6TOTKME"}>
        <View style={styles.container}>
          {loggedIn ? (
            <Stack.Navigator>
              <Stack.Screen name="LandingPage" options={{headerShown: false}}>
                {(props) => <LandingPage {...props} onLogout={onLogout} user={user} />}
              </Stack.Screen>
              <Stack.Screen name="Profile" component={Profile} options={{headerShown: false}}/>
              <Stack.Screen name="Chat" component={Chat} options={{headerShown: false}}/>
              <Stack.Screen name="Chores" component={Chores} options={{headerShown: false}}/>
              <Stack.Screen name="Shopping" component={Shopping} options={{headerShown: false}}/>
              <Stack.Screen name="Notifications" component={Notifications} options={{headerShown: false}}/>
              <Stack.Screen name="Friends" component={Friends} options={{headerShown: false}}/>
            </Stack.Navigator>
          ) : (
            <>
              <Text style={styles.header}> Together - Login </Text>
              <Text style={styles.header}> You are not logged in </Text>
              <Button onPress={onLogin} title="Log In" />
            </>
          )}
        </View>
      </Auth0Provider>
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
});

export default App;