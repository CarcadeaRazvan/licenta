import React from 'react';
import {View, Text} from 'react-native';

const Chat = () => {
  return (
    <View>
      <Text style={{fontSize: 18, fontWeight: 'bold', marginBottom: 10}}>
        Chat
      </Text>
      <Text>You have no chats yet.</Text>
    </View>
  );
};

export default Chat;
