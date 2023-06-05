import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from "react-native";
import { useNavigation, withNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Button } from "react-native";

const Profile = ({ token }) => {
  const navigation = useNavigation();
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoHash, setProfilePhotoHash] = useState("default.jpg");
  const [userData, setUserData] = useState("");
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [rewards, setRewards] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(
          "http://192.168.1.137:5000/utils/get_username",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          console.error("Error fetching user data");
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchUserData();
  }, []);

  const userDataRef = useRef(userData);

  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  useEffect(() => {
    const fetchUserRewards = async () => {
      try {
        const response = await fetch(
          "http://192.168.1.137:5000/rewards/get_user_rewards",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setRewards(data["rewards"]);
        } else {
          console.error("Error fetching user rewards");
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchUserRewards();
  }, []);

  useEffect(() => {
    const fetchProfilePicture = async () => {
      try {
        const response = await fetch(
          "http://192.168.1.137:5000/profile/get_picture",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // console.log("data[]", data["user_id"]);
          // console.log("userData", userDataRef.current);
          if (data["user_id"] == userDataRef.current)
            setProfilePhoto(data["profile_picture"]);
        } else {
          console.error("Error fetching profile photo");
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchProfilePicture();
  }, [refreshKey]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access the camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    console.log("result ::", result);

    if (!result.canceled) {
      const uri = result["assets"][0]["uri"];
      const fileName = `${userData}.jpg`;
      setProfilePhoto(fileName);
      uploadProfilePhoto(uri, fileName);
    }
  };

  const uploadProfilePhoto = async (photoUri, fileName) => {
    const formData = new FormData();
    formData.append("file", {
      uri: photoUri,
      type: "image",
      name: fileName,
    });

    try {
      const response = await fetch("http://192.168.1.137:5000/profile/upload", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data["user_id"] == userDataRef.current) {
        setProfilePhoto(data["profile_picture"]);
        setRefreshKey(Date.now());
      }
    } catch (error) {
      console.error("Error uploading profile photo:", error);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Profile</Text>
        <View style={styles.spacer} />
      </View>
      <View style={styles.content}>
        {userData ? (
          <Text>{`Logged in as ${userDataRef.current}`}</Text>
        ) : (
          <Text>Loading...</Text>
        )}
        {profilePhoto && (
          <Image
            source={{
              uri: `http://192.168.1.137:5000/profile/image/${profilePhoto}?${refreshKey}`,
            }}
            style={{ width: 200, height: 200 }}
            resizeMode="contain"
          />
        )}
        <Button title="Select Profile Photo" onPress={pickImage} />
        <Text style={styles.rewardsHeaderText}>My rewards</Text>
        {rewards.length > 0 ? (
          <FlatList
            data={rewards}
            keyExtractor={(item) => item[0].toString()}
            contentContainerStyle={styles.rewardListContainer}
            renderItem={({ item }) => (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardName}>{item[1]}</Text>
                <Text style={styles.rewardDescription}>{item[2]}</Text>
              </View>
            )}
          />
        ) : (
          <Text>You have no rewards yet</Text>
        )}

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    height: 80,
  },
  headerText: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 25,
    marginTop: 50,
    marginLeft: -15,
  },
  backButton: {
    marginLeft: 30,
    marginTop: 50,
    fontSize: 18,
  },
  spacer: {
    width: 60,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 20,
  },
  rewardsHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  rewardListContainer: {
    paddingHorizontal: 10,
  },
  rewardItem: {
    backgroundColor: 'lightgray',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  rewardName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rewardDescription: {
    fontSize: 16,
  },
});

export default Profile;
