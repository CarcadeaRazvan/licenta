import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from "react-native";
import { useNavigation, withNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Button } from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from 'expo-linear-gradient';

const Profile = ({ token }) => {
  const navigation = useNavigation();
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoHash, setProfilePhotoHash] = useState("default.jpg");
  const [userData, setUserData] = useState("");
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [rewards, setRewards] = useState([]);
  const [points, setPoints] = useState(0);

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
    const fetchUserPoints = async () => {
      try {
        const response = await fetch(
          "http://192.168.1.137:5000/rewards/get_points",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data["currentUser"] == userDataRef.current)
            setPoints(data["points"]);
        } else {
          console.error("Error fetching user points");
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchUserPoints();
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
      <StatusBar style="light" />
      <LinearGradient
        colors={['#000000', '#333338']}
        style={styles.linearGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack}>
            <Text style={styles.backButton}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerText}>Profile</Text>
          <View style={styles.spacer} />
        </View>
      </LinearGradient>
      <View style={styles.content}>
        {userData ? (
          <Text style={styles.greet}>{`Glad to see you, ${userDataRef.current}!`}</Text>
        ) : (
          <Text>Loading...</Text>
        )}
        {profilePhoto && (
          <Image
            source={{
              uri: `http://192.168.1.137:5000/profile/image/${profilePhoto}?${refreshKey}`,
            }}
            style={styles.profilePhoto}
            resizeMode="contain"
          />
        )}
        <TouchableOpacity onPress={pickImage}>
          <Text style={styles.selectButton}>Select Profile Photo</Text>
        </TouchableOpacity>
        <Text style={styles.rewardsHeaderText}>My rewards (points: {points})</Text>
      </View>
      <View style={styles.rewardsContainer}>
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
          <Text style={styles.noReward}>You have no rewards yet</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#333338",
  },
  linearGradient: {
    height: 100,
    width: 400,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    color: "#ccc",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 25,
    marginTop: 30,
    // marginLeft: 25,
  },
  profilePhoto: {
    width: 220,
    height: 220,
    borderRadius: 90,
    marginBottom: 20,
  },
  greet: {
    fontSize: 20,
    marginTop: 20,
    marginBottom: 30,
    color: "#f4f5fd",
  },
  backButton: {
    color: "#ccc",
    marginLeft: 20,
    marginTop: 55,
    fontSize: 18,
  },
  spacer: {
    width: 60,
  },
  content: {
    // flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 20,
  },
  rewardsHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: "#e9e9ea",
    marginTop: 10,
    marginBottom: 10,
  },
  rewardListContainer: {
    paddingHorizontal: 10,
  },
  rewardItem: {
    backgroundColor: '#272829',
    padding: 10,
    marginBottom: 10,
    width: 370,
    borderRadius: 5,
  },
  rewardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: "#e9e9ea",
  },
  rewardDescription: {
    fontSize: 16,
    color: "#e9e9ea",
  },
  noReward: {
    fontSize: 16,
    color: "#e9e9ea",
  },
  selectButton: {
    color: "#ffffff",
    marginBottom: 10,
    fontSize: 18,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    paddingLeft: 5,
    paddingRight: 5,
  },
  rewardsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Profile;
