import React from 'react';
import {View, Text} from 'react-native';

const Chores = () => {
  return (
    <View>
      <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 10}}>
        Chores
      </Text>
      <Text>You have no chores yet.</Text>
    </View>
  );
};

export default Chores;
