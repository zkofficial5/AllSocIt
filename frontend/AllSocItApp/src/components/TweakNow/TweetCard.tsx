import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Tweak, TweakNowCharacter } from "../../types/tweaknow";
import CharacterAvatar from "../TweakNow/CharacterAvatar";
import { useTheme } from "../../contexts/ThemeContext";

interface TweetCardProps {
  tweak: Tweak;
  character: TweakNowCharacter;
  onPress?: () => void;
  onLongPress?: () => void;
  isDetailView?: boolean;
  showThreadLine?: boolean; // ADD THIS
  isReply?: boolean; // ADD THIS
  replyingTo?: string;
}

export default function TweetCard({
  tweak,
  character,
  onPress,
  onLongPress,
  isDetailView = false,
  showThreadLine = false, // ADD THIS
  isReply = false, // ADD THIS
  replyingTo,
}: TweetCardProps) {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return count.toString();
  };

  const formatCountWithLabel = (count: number, label: string): string => {
    const formatted = formatCount(count);
    return `${formatted} ${label}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatFullDate = (dateString: string): string => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const fullDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
    return `${time} · ${fullDate}`;
  };

  const getVerificationBadge = () => {
    switch (character.official_mark) {
      case "Blue":
        return (
          <Ionicons
            name="checkmark-circle"
            size={isDetailView ? 20 : 16}
            color="#1DA1F2"
          />
        );
      case "Gold":
        return (
          <Ionicons
            name="checkmark-circle"
            size={isDetailView ? 20 : 16}
            color="#FFD700"
          />
        );
      case "Grey":
        return (
          <Ionicons
            name="checkmark-circle"
            size={isDetailView ? 20 : 16}
            color="#8899A6"
          />
        );
      default:
        return null;
    }
  };

  const renderImages = () => {
    if (!tweak.images || tweak.images.length === 0) return null;

    const imageCount = tweak.images.length;

    if (imageCount === 1) {
      return (
        <Image
          source={{ uri: tweak.images[0] }}
          style={styles.singleImage}
          resizeMode="cover"
        />
      );
    }

    if (imageCount === 2) {
      return (
        <View style={styles.twoImageGrid}>
          {tweak.images.map((uri: string, index: number) => (
            <Image
              key={index}
              source={{ uri }}
              style={styles.twoImage}
              resizeMode="cover"
            />
          ))}
        </View>
      );
    }

    if (imageCount === 3 || imageCount === 4) {
      return (
        <View style={styles.multiImageGrid}>
          <Image
            source={{ uri: tweak.images[0] }}
            style={styles.largeImage}
            resizeMode="cover"
          />
          <View style={styles.smallImagesColumn}>
            {tweak.images.slice(1).map((uri: string, index: number) => (
              <Image
                key={index}
                source={{ uri }}
                style={styles.smallImage}
                resizeMode="cover"
              />
            ))}
          </View>
        </View>
      );
    }

    return null;
  };

  if (isDetailView) {
    // DETAIL VIEW LAYOUT (like Twitter detail view)
    return (
      <View
        style={[
          styles.detailContainer,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.detailHeader}>
          <CharacterAvatar
            name={character.name}
            username={character.username}
            profilePicture={character.profile_picture}
            size={48}
          />
          <View style={styles.detailHeaderInfo}>
            <View style={styles.detailNameRow}>
              <Text style={[styles.detailName, { color: colors.text }]}>
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
              style={[styles.detailUsername, { color: colors.textSecondary }]}
            >
              @{character.username}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              Alert.alert("Tweet Options", "", [
                {
                  text: "Edit",
                  onPress: () => {
                    navigation.navigate("EditTweak", {
                      universeId: tweak.universe_id,
                      tweakId: tweak.id,
                    });
                  },
                },
                { text: "Delete", style: "destructive", onPress: onLongPress },
                {
                  text: "Pin to profile",
                  onPress: () => Alert.alert("Coming Soon", "Pin feature"),
                },
                { text: "Cancel", style: "cancel" },
              ]);
            }}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <Text style={[styles.detailContent, { color: colors.text }]}>
          {tweak.content}
        </Text>

        {/* Images */}
        {renderImages()}

        {/* Timestamp */}
        <Text style={[styles.detailTimestamp, { color: colors.textSecondary }]}>
          {formatFullDate(tweak.custom_date || tweak.created_at)}
        </Text>

        {/* Stats (Bold with labels)
        <View
          style={[
            styles.detailStats,
            { borderTopColor: colors.border, borderBottomColor: colors.border },
          ]}
        >
          <Text style={[styles.detailStat, { color: colors.textSecondary }]}>
            <Text style={[styles.detailStatNumber, { color: colors.text }]}>
              {formatCount(tweak.retweet_count)}
            </Text>{" "}
            Retweet
          </Text>
          <Text style={[styles.detailStat, { color: colors.textSecondary }]}>
            <Text style={[styles.detailStatNumber, { color: colors.text }]}>
              {formatCount(tweak.quote_count)}
            </Text>{" "}
            Quotes
          </Text>
          <Text style={[styles.detailStat, { color: colors.textSecondary }]}>
            <Text style={[styles.detailStatNumber, { color: colors.text }]}>
              {formatCount(tweak.like_count)}
            </Text>{" "}
            Likes
          </Text>
        </View> */}

        {/* Stats (Bold with labels) */}
        <View
          style={[
            styles.detailStats,
            { borderTopColor: colors.border, borderBottomColor: colors.border },
          ]}
        >
          {tweak.view_count > 0 && (
            <Text style={[styles.detailStat, { color: colors.textSecondary }]}>
              <Text style={[styles.detailStatNumber, { color: colors.text }]}>
                {formatCount(tweak.view_count)}
              </Text>{" "}
              Views
            </Text>
          )}
          <Text style={[styles.detailStat, { color: colors.textSecondary }]}>
            <Text style={[styles.detailStatNumber, { color: colors.text }]}>
              {formatCount(tweak.retweet_count)}
            </Text>{" "}
            Retweet
          </Text>
          <Text style={[styles.detailStat, { color: colors.textSecondary }]}>
            <Text style={[styles.detailStatNumber, { color: colors.text }]}>
              {formatCount(tweak.quote_count)}
            </Text>{" "}
            Quotes
          </Text>
          <Text style={[styles.detailStat, { color: colors.textSecondary }]}>
            <Text style={[styles.detailStatNumber, { color: colors.text }]}>
              {formatCount(tweak.like_count)}
            </Text>{" "}
            Likes
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.detailActions}>
          <TouchableOpacity style={styles.detailActionButton}>
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.detailActionButton}>
            <Ionicons
              name="repeat-outline"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.detailActionButton}>
            <Ionicons
              name="heart-outline"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.detailActionButton}>
            <Ionicons
              name="share-outline"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // FEED VIEW LAYOUT (compact)
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          borderBottomWidth: isReply && showThreadLine ? 0 : 1, // No border if it has children
        },
      ]}
      onPress={() => {
        if (isReply && onPress) {
          // If it's a reply, call the custom onPress (to open reply composer)
          onPress();
        } else {
          // If it's not a reply, navigate to detail view
          navigation.navigate("TweetDetail", {
            universeId: tweak.universe_id,
            tweakId: tweak.id,
          });
        }
      }}
      onLongPress={onLongPress}
    >
      {showThreadLine && (
        <View style={[styles.threadLine, { backgroundColor: colors.border }]} />
      )}

      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation(); // Prevent tweet card click
          navigation.navigate("CharacterProfile", {
            universeId: tweak.universe_id,
            characterId: character.id,
          });
        }}
      >
        <CharacterAvatar
          name={character.name}
          username={character.username}
          profilePicture={character.profile_picture}
          size={48}
        />
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Header: Name, badge, @username, date - ALL ON ONE LINE */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text
              style={[styles.name, { color: colors.text }]}
              numberOfLines={1}
            >
              {character.name}
            </Text>
            {getVerificationBadge()}
            {character.is_private && (
              <Ionicons
                name="lock-closed"
                size={14}
                color={colors.textSecondary}
                style={{ marginLeft: 4 }}
              />
            )}
            <Text
              style={[styles.username, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {" "}
              @{character.username}
            </Text>
            <Text style={[styles.dot, { color: colors.textSecondary }]}>
              {" "}
              ·{" "}
            </Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>
              {formatDate(tweak.custom_date || tweak.created_at)}
            </Text>
          </View>

          {replyingTo && (
            <Text style={[styles.replyingTo, { color: colors.textSecondary }]}>
              Replying to{" "}
              <Text style={{ color: colors.primary }}>@{replyingTo}</Text>
            </Text>
          )}

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              Alert.alert("Tweet Options", "", [
                {
                  text: "Edit",
                  onPress: () => {
                    navigation.navigate("EditTweak", {
                      universeId: tweak.universe_id,
                      tweakId: tweak.id,
                    });
                  },
                },
                { text: "Delete", style: "destructive", onPress: onLongPress },
                {
                  text: "Pin to profile",
                  onPress: () => Alert.alert("Coming Soon", "Pin feature"),
                },
                { text: "Cancel", style: "cancel" },
              ]);
            }}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Tweet content */}
        <Text style={[styles.tweetContent, { color: colors.text }]}>
          {tweak.content}
        </Text>

        {/* Images */}
        {renderImages()}

        {/* Compact engagement stats */}
        <View style={styles.engagement}>
          <TouchableOpacity
            style={styles.engagementItem}
            onPress={(e) => {
              e.stopPropagation();
              if (onPress) onPress();
            }}
          >
            <Ionicons
              name="chatbubble-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.engagementCount, { color: colors.textSecondary }]}
            >
              {formatCount(tweak.comment_count)}
            </Text>
          </TouchableOpacity>
          <View style={styles.engagementItem}>
            <Ionicons
              name="repeat-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.engagementCount, { color: colors.textSecondary }]}
            >
              {formatCount(tweak.retweet_count)}
            </Text>
          </View>
          <View style={styles.engagementItem}>
            <Ionicons
              name="heart-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.engagementCount, { color: colors.textSecondary }]}
            >
              {formatCount(tweak.like_count)}
            </Text>
          </View>
          <View style={styles.engagementItem}>
            <Ionicons
              name="stats-chart-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.engagementCount, { color: colors.textSecondary }]}
            >
              {formatCount(tweak.view_count)}
            </Text>
          </View>
          <TouchableOpacity>
            <Ionicons
              name="share-outline"
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // FEED VIEW STYLES
  // container: {
  //   flexDirection: "row",
  //   padding: 12,
  //   borderBottomWidth: 1,
  //   gap: 12,
  // },
  container: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    gap: 12,
    alignItems: "flex-start", // ADD THIS - keeps avatar at top
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    flexWrap: "wrap",
  },
  // userInfo: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   flex: 1,
  // },
  name: {
    fontSize: 15,
    fontWeight: "bold",
    marginRight: 4,
  },
  username: {
    fontSize: 15,
  },
  dot: {
    fontSize: 15,
  },
  date: {
    fontSize: 15,
  },
  tweetContent: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 12,
  },
  singleImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    marginBottom: 12,
  },
  twoImageGrid: {
    flexDirection: "row",
    gap: 2,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  twoImage: {
    flex: 1,
    aspectRatio: 1,
  },
  multiImageGrid: {
    flexDirection: "row",
    gap: 2,
    height: 280,
    marginBottom: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  largeImage: {
    flex: 2,
    height: "100%",
  },
  smallImagesColumn: {
    flex: 1,
    gap: 2,
  },
  smallImage: {
    flex: 1,
  },
  engagement: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
    marginTop: 4,
  },
  engagementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  engagementCount: {
    fontSize: 13,
  },

  // DETAIL VIEW STYLES
  detailContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  detailHeaderInfo: {
    flex: 1,
  },
  detailNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  detailUsername: {
    fontSize: 15,
    marginTop: 2,
  },
  detailContent: {
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 12, // Changed from 16
  },
  detailTimestamp: {
    fontSize: 15,
    marginTop: 8, // Changed from 12
    marginBottom: 12, // Changed from 16
  },
  detailStats: {
    flexDirection: "row",
    gap: 16, // Changed from 20
    paddingVertical: 10, // Changed from 12
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  detailActions: {
    flexDirection: "row",
    justifyContent: "flex-start", // Changed from space-around
    gap: 80, // Add specific gap
    paddingTop: 8,
    paddingLeft: 20, // Add left padding
  },
  detailStat: {
    fontSize: 14,
  },
  detailStatNumber: {
    fontWeight: "bold",
    fontSize: 15,
  },
  detailActionButton: {
    padding: 8,
  },
  menuButton: {
    position: "absolute",
    right: 0,
    top: 0,
    padding: 4,
  },
  threadLine: {
    position: "absolute",
    left: 36, // Center of avatar
    top: 60,
    bottom: 0,
    width: 2,
    backgroundColor: "#2F3336",
  },

  replyingTo: {
    fontSize: 13,
    marginTop: 2,
  },
});
