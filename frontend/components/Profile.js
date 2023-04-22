import React from 'react';
import {View, Text} from 'react-native';

const Profile = ({user}) => {
  return (
    <View>
      <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 10}}>
        Profile
      </Text>
      {/* <Text>Name: {user.name}</Text>
      <Text>Email: {user.email}</Text> */}
      <Text>Name: name</Text>
      <Text>Email: email</Text>
    </View>
  );
};

export default Profile;
