import React from 'react';
import {View, Text} from 'react-native';

const Notifications = () => {
  return (
    <View>
      <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 10}}>
        Notifications
      </Text>
      <Text>You have no notifications yet.</Text>
    </View>
  );
};

export default Notifications;
