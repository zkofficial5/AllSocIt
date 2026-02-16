import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";

interface CharacterAvatarProps {
  name: string;
  username: string;
  profilePicture?: string;
  size?: number;
  showName?: boolean;
}

export default function CharacterAvatar({
  name,
  username,
  profilePicture,
  size = 48,
  showName = false,
}: CharacterAvatarProps) {
  const getInitials = () => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        {profilePicture ? (
          <Image
            source={{ uri: profilePicture }}
            style={[
              styles.image,
              { width: size, height: size, borderRadius: size / 2 },
            ]}
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              { width: size, height: size, borderRadius: size / 2 },
            ]}
          >
            <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
              {getInitials()}
            </Text>
          </View>
        )}
      </View>
      {showName && (
        <View style={styles.nameContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.username} numberOfLines={1}>
            @{username}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    overflow: "hidden",
  },
  image: {
    resizeMode: "cover",
  },
  placeholder: {
    backgroundColor: "#1DA1F2",
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  nameContainer: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  username: {
    fontSize: 14,
    color: "#8899A6",
  },
});
