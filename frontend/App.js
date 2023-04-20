import React from 'react';
import {Alert, Button, StyleSheet, Text, View} from 'react-native';
import {useAuth0, Auth0Provider} from 'react-native-auth0';
import * as Notifications from 'expo-notifications';

const config = {
  clientId: "d1Kt5ewsVEilHku9d7vp1pC0h6TOTKME",
  domain: "dev-vxzjazs4gxwtyfuv.eu.auth0.com"
};

const Home = () => {
  const {authorize, clearSession, user, error, getCredentials} = useAuth0();

  const onLogin = async () => {
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      console.log(token.data);
      await authorize({scope: 'openid profile email'}, {customScheme: 'auth0.com.auth0samples'});
      let credentials = await getCredentials();
      Alert.alert('AccessToken: ' + credentials.accessToken);
    } catch (e) {
      console.log(e);
    }
  };

  const loggedIn = user !== undefined && user !== null;

  const onLogout = async () => {
    try {
      await clearSession({customScheme: 'auth0.com.auth0samples'});
    } catch (e) {
      console.log('Log out cancelled');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}> MyNewApp1 - Login </Text>
      {user && <Text>YOU are logged in as {user.name}</Text>}
      {!user && <Text>You are not logged in</Text>}
      {error && <Text>{error.message}</Text>}
      <Button
        onPress={loggedIn ? onLogout : onLogin}
        title={loggedIn ? 'Log Out' : 'Log In'}
      />
    </View>
  );
};

const App = () => {
  return (
    <Auth0Provider domain={config.domain} clientId={config.clientId}>
      <Home />
    </Auth0Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  header: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
});

export default App;