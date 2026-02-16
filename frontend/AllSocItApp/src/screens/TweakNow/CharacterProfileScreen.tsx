import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { characterAPI, tweakAPI, followAPI } from "../../services/tweaknow";
import { TweakNowCharacter, Tweak } from "../../types/tweaknow";
import TweetCard from "../../components/TweakNow/TweetCard";
import CharacterAvatar from "../../components/TweakNow/CharacterAvatar";
import { useTheme } from "../../contexts/ThemeContext";

const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return count.toString();
};

type RootStackParamList = {
  CharacterProfile: {
    universeId: number;
    characterId: number;
    currentCharacterId?: number;
  };
  EditCharacter: { universeId: number; characterId: number };
};

type CharacterProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "CharacterProfile">;
  route: RouteProp<RootStackParamList, "CharacterProfile">;
};

type TabType = "tweets" | "replies" | "media" | "likes";

export default function CharacterProfileScreen({
  navigation,
  route,
}: CharacterProfileScreenProps) {
  const { universeId, characterId, currentCharacterId } = route.params;
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [character, setCharacter] = useState<TweakNowCharacter | null>(null);
  const [tweaks, setTweaks] = useState<Tweak[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("tweets");
  const [isFollowing, setIsFollowing] = useState(false);
  // const [followersCount, setFollowersCount] = useState(0);
  // const [followingCount, setFollowingCount] = useState(0);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadData(); // Reload when screen comes into focus
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      const [charactersData, tweaksData] = await Promise.all([
        characterAPI.getAll(universeId),
        tweakAPI.getAll(universeId),
      ]);

      const char = charactersData.find((c) => c.id === characterId);
      if (!char) {
        Alert.alert("Error", "Character not found");
        navigation.goBack();
        return;
      }

      setCharacter(char);

      const characterTweaks = tweaksData.filter(
        (t) => t.character_id === characterId,
      );
      setTweaks(characterTweaks);

      const isOwn = currentCharacterId === characterId;
      setIsOwnProfile(isOwn);

      if (currentCharacterId && !isOwn) {
        const followData = await followAPI.checkFollowing(
          universeId,
          currentCharacterId,
          characterId,
        );
        setIsFollowing(followData.is_following);
        // setFollowersCount(followData.followers_count);
        // setFollowingCount(followData.following_count);
      } else {
        const followData = await followAPI.checkFollowing(
          universeId,
          characterId,
          characterId,
        );
        // setFollowersCount(followData.followers_count);
        // setFollowingCount(followData.following_count);
      }
    } catch (error) {
      Alert.alert("Error", "Could not load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentCharacterId) return;

    try {
      if (isFollowing) {
        await followAPI.unfollow(universeId, currentCharacterId, characterId);
        setIsFollowing(false);
        // Removed setFollowersCount - using manual display count now
      } else {
        await followAPI.follow(universeId, currentCharacterId, characterId);
        setIsFollowing(true);
        // Removed setFollowersCount - using manual display count now
      }
    } catch (error) {
      Alert.alert("Error", "Could not update follow status");
    }
  };

  const getFilteredTweaks = () => {
    switch (activeTab) {
      case "tweets":
        return tweaks.filter((t) => !t.reply_to_tweak_id);
      case "replies":
        return tweaks;
      case "media":
        return tweaks.filter((t) => t.images && t.images.length > 0);
      case "likes":
        return [];
      default:
        return tweaks;
    }
  };

  const getVerificationBadge = () => {
    if (!character) return null;
    switch (character.official_mark) {
      case "Blue":
        return (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color="#1DA1F2"
            style={{ marginLeft: 4 }}
          />
        );
      case "Gold":
        return (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color="#FFD700"
            style={{ marginLeft: 4 }}
          />
        );
      case "Grey":
        return (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color="#8899A6"
            style={{ marginLeft: 4 }}
          />
        );
      default:
        return null;
    }
  };

  const handleDeleteTweak = (tweak: Tweak) => {
    Alert.alert("Delete Tweet", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await tweakAPI.delete(universeId, tweak.id);
            setTweaks(tweaks.filter((t) => t.id !== tweak.id));
          } catch (error) {
            Alert.alert("Error", "Could not delete tweet");
          }
        },
      },
    ]);
  };

  const renderTweak = ({ item }: { item: Tweak }) => {
    if (!character) return null;
    return (
      <TweetCard
        tweak={item}
        character={character}
        onLongPress={() => handleDeleteTweak(item)}
      />
    );
  };

  if (loading || !character) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={
          isOwnProfile || !character.is_private || isFollowing
            ? getFilteredTweaks()
            : []
        }
        renderItem={renderTweak}
        keyExtractor={(item) => item.id.toString()}
        style={{ backgroundColor: colors.background }}
        ListHeaderComponent={
          <View>
            {/* Banner with overlay buttons */}
            <View style={styles.bannerContainer}>
              {character.banner_image ? (
                <Image
                  source={{ uri: character.banner_image }}
                  style={styles.bannerImage}
                />
              ) : (
                <View
                  style={[
                    styles.bannerPlaceholder,
                    { backgroundColor: colors.surface },
                  ]}
                />
              )}

              {/* Back Button */}
              <TouchableOpacity
                style={[
                  styles.backButton,
                  { backgroundColor: "rgba(0, 0, 0, 0.5)" },
                ]}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Follow/Edit Button */}
              {isOwnProfile ? (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() =>
                    navigation.navigate("EditCharacter", {
                      universeId,
                      characterId: character.id,
                    })
                  }
                >
                  <Text
                    style={[styles.actionButtonText, { color: colors.text }]}
                  >
                    Edit profile
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    isFollowing
                      ? {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        }
                      : { backgroundColor: colors.primary },
                  ]}
                  onPress={handleFollowToggle}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      { color: isFollowing ? colors.text : "#FFFFFF" },
                    ]}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfo}>
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                <CharacterAvatar
                  name={character.name}
                  username={character.username}
                  profilePicture={character.profile_picture}
                  size={80}
                />
              </View>

              {/* Name & Username */}
              <View style={styles.nameSection}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: colors.text }]}>
                    {character.name}
                  </Text>
                  {getVerificationBadge()}
                  {character.is_private && (
                    <Ionicons
                      name="lock-closed"
                      size={16}
                      color={colors.textSecondary}
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>
                <Text
                  style={[styles.username, { color: colors.textSecondary }]}
                >
                  @{character.username}
                </Text>
              </View>

              {/* Bio */}
              {character.bio && (
                <Text style={[styles.bio, { color: colors.text }]}>
                  {character.bio}
                </Text>
              )}

              {/* Metadata */}
              <View style={styles.metadata}>
                {character.location && (
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[styles.metaText, { color: colors.textSecondary }]}
                    >
                      {character.location}
                    </Text>
                  </View>
                )}
                {character.website && (
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="link-outline"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text style={[styles.metaLink, { color: colors.primary }]}>
                      {character.website}
                    </Text>
                  </View>
                )}
                {character.birth_date && (
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[styles.metaText, { color: colors.textSecondary }]}
                    >
                      Born {character.birth_date}
                    </Text>
                  </View>
                )}
                {character.pro_category && (
                  <View style={styles.metaItem}>
                    <Ionicons
                      name="briefcase-outline"
                      size={16}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[styles.metaText, { color: colors.textSecondary }]}
                    >
                      {character.pro_category}
                    </Text>
                  </View>
                )}
              </View>

              {/* Stats */}
              <View style={styles.stats}>
                <Text
                  style={[styles.statText, { color: colors.textSecondary }]}
                >
                  <Text style={[styles.statNumber, { color: colors.text }]}>
                    {formatCount(character.display_following_count || 0)}
                  </Text>{" "}
                  Following
                </Text>
                <Text
                  style={[styles.statText, { color: colors.textSecondary }]}
                >
                  <Text style={[styles.statNumber, { color: colors.text }]}>
                    {formatCount(character.display_followers_count || 0)}
                  </Text>{" "}
                  Followers
                </Text>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "tweets" && [
                    styles.tabActive,
                    { borderBottomColor: colors.primary },
                  ],
                ]}
                onPress={() => setActiveTab("tweets")}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: colors.textSecondary },
                    activeTab === "tweets" && [
                      styles.tabTextActive,
                      { color: colors.text },
                    ],
                  ]}
                >
                  Tweets
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "replies" && [
                    styles.tabActive,
                    { borderBottomColor: colors.primary },
                  ],
                ]}
                onPress={() => setActiveTab("replies")}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: colors.textSecondary },
                    activeTab === "replies" && [
                      styles.tabTextActive,
                      { color: colors.text },
                    ],
                  ]}
                >
                  Tweets & replies
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "media" && [
                    styles.tabActive,
                    { borderBottomColor: colors.primary },
                  ],
                ]}
                onPress={() => setActiveTab("media")}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: colors.textSecondary },
                    activeTab === "media" && [
                      styles.tabTextActive,
                      { color: colors.text },
                    ],
                  ]}
                >
                  Media
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "likes" && [
                    styles.tabActive,
                    { borderBottomColor: colors.primary },
                  ],
                ]}
                onPress={() => setActiveTab("likes")}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: colors.textSecondary },
                    activeTab === "likes" && [
                      styles.tabTextActive,
                      { color: colors.text },
                    ],
                  ]}
                >
                  Likes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          !isOwnProfile && character.is_private && !isFollowing ? (
            <View style={styles.blockedContent}>
              <Ionicons
                name="lock-closed"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={[styles.blockedTitle, { color: colors.text }]}>
                This account is private
              </Text>
              <Text
                style={[styles.blockedText, { color: colors.textSecondary }]}
              >
                Follow this account to see their tweets
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bannerContainer: {
    position: "relative",
    height: 180,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerPlaceholder: {
    width: "100%",
    height: "100%",
  },
  backButton: {
    position: "absolute",
    top: 45,
    left: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButton: {
    position: "absolute",
    bottom: -6, // Changed from top: 16
    right: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "bold",
  },
  profileInfo: {
    padding: 16,
  },
  avatarContainer: {
    marginTop: -60,
    marginBottom: 12,
    marginLeft: -5,
  },
  nameSection: {
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
  },
  username: {
    fontSize: 15,
    marginTop: 2,
  },
  bio: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 12,
  },
  metadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 14,
  },
  metaLink: {
    fontSize: 14,
  },
  stats: {
    flexDirection: "row",
    gap: 20,
  },
  statText: {
    fontSize: 14,
  },
  statNumber: {
    fontWeight: "bold",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
  },
  tabTextActive: {
    fontWeight: "bold",
  },
  blockedContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    paddingTop: 60,
  },
  blockedTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  blockedText: {
    fontSize: 14,
    textAlign: "center",
  },
});
