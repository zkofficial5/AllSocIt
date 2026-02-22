import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { useTheme } from "../../contexts/ThemeContext";
import { characterAPI, tweakAPI } from "../../services/tweaknow";
import { TweakNowCharacter, Tweak } from "../../types/tweaknow";
import CharacterAvatar from "../../components/TweakNow/CharacterAvatar";

type RootStackParamList = {
  Notifications: {
    universeId: number;
    currentCharacterId: number;
  };
  TweetDetail: { universeId: number; tweakId: number };
  CharacterProfile: {
    universeId: number;
    characterId: number;
    currentCharacterId?: number;
  };
};

type NotificationsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Notifications">;
  route: RouteProp<RootStackParamList, "Notifications">;
};

type NotificationType = "reply" | "retweet" | "like" | "quote" | "follow";

interface NotificationItem {
  id: string;
  type: NotificationType;
  actor: TweakNowCharacter; // who did the action
  tweak?: Tweak; // the tweet involved (reply/RT/like/quote)
  actorTweak?: Tweak; // the actor's own tweet (for replies/quotes)
  timestamp: string;
}

const TABS = ["All", "Mentions"];

function formatDate(dateString: string): string {
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
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function buildNotifications(
  allTweaks: any[],
  allCharacters: TweakNowCharacter[],
  currentCharacterId: number,
): NotificationItem[] {
  const notifications: NotificationItem[] = [];
  const getChar = (id: number) => allCharacters.find((c) => c.id === id);
  const getTweak = (id: number): Tweak | undefined =>
    allTweaks.find((item) => {
      const t = item.tweak || item;
      return t.id === id;
    })?.tweak || allTweaks.find((item) => (item.tweak || item).id === id);

  allTweaks.forEach((item) => {
    const tweak: Tweak = item.tweak || item;
    const actor = getChar(tweak.character_id);
    if (!actor) return;

    // Replies to currentCharacter's tweets — find parent
    if (tweak.reply_to_tweak_id && actor.id !== currentCharacterId) {
      const parentItem = allTweaks.find((i) => {
        const t = i.tweak || i;
        return t.id === tweak.reply_to_tweak_id;
      });
      const parentTweak: Tweak | undefined = parentItem
        ? parentItem.tweak || parentItem
        : undefined;
      if (parentTweak && parentTweak.character_id === currentCharacterId) {
        notifications.push({
          id: `reply-${tweak.id}`,
          type: "reply",
          actor,
          tweak: parentTweak,
          actorTweak: tweak,
          timestamp: tweak.custom_date || tweak.created_at,
        });
      }
    }

    // Quote tweets of currentCharacter's tweets
    if (tweak.quoted_tweak_id && actor.id !== currentCharacterId) {
      const quotedItem = allTweaks.find((i) => {
        const t = i.tweak || i;
        return t.id === tweak.quoted_tweak_id;
      });
      const quotedTweak: Tweak | undefined = quotedItem
        ? quotedItem.tweak || quotedItem
        : undefined;
      if (quotedTweak && quotedTweak.character_id === currentCharacterId) {
        notifications.push({
          id: `quote-${tweak.id}`,
          type: "quote",
          actor,
          tweak: quotedTweak,
          actorTweak: tweak,
          timestamp: tweak.custom_date || tweak.created_at,
        });
      }
    }

    // Retweets of currentCharacter's tweets
    if (item.type === "retweet" && item.retweeted_by_character_id) {
      const retweetActor = getChar(item.retweeted_by_character_id);
      if (
        retweetActor &&
        retweetActor.id !== currentCharacterId &&
        tweak.character_id === currentCharacterId
      ) {
        notifications.push({
          id: `rt-${tweak.id}-${retweetActor.id}`,
          type: "retweet",
          actor: retweetActor,
          tweak,
          timestamp: item.timestamp,
        });
      }
    }
  });

  // Sort newest first
  notifications.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  // Deduplicate by id
  const seen = new Set<string>();
  return notifications.filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });
}

function actionLabel(type: NotificationType): string {
  switch (type) {
    case "reply":
      return "Replying to";
    case "retweet":
      return "Retweeted your tweet";
    case "like":
      return "Liked your tweet";
    case "quote":
      return "Quoted your tweet";
    case "follow":
      return "Followed you";
  }
}

function actionIcon(type: NotificationType): { name: any; color: string } {
  switch (type) {
    case "reply":
      return { name: "chatbubble-outline", color: "#1DA1F2" };
    case "retweet":
      return { name: "repeat-outline", color: "#00BA7C" };
    case "like":
      return { name: "heart", color: "#F91880" };
    case "quote":
      return { name: "quote", color: "#1DA1F2" };
    case "follow":
      return { name: "person-add", color: "#1DA1F2" };
  }
}

export default function NotificationsScreen({
  navigation,
  route,
}: NotificationsScreenProps) {
  const { universeId, currentCharacterId } = route.params;
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentCharacter, setCurrentCharacter] =
    useState<TweakNowCharacter | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [characters, feedData] = await Promise.all([
        characterAPI.getAll(universeId),
        tweakAPI.getAll(universeId),
      ]);
      const me = characters.find((c) => c.id === currentCharacterId) || null;
      setCurrentCharacter(me);
      const notifs = buildNotifications(
        feedData,
        characters,
        currentCharacterId,
      );
      setNotifications(notifs);
    } catch (_) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filter by tab
  const filtered =
    activeTab === 0
      ? notifications
      : notifications.filter((n) => n.type === "reply" || n.type === "quote");

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const icon = actionIcon(item.type);
    const isReplyOrQuote = item.type === "reply" || item.type === "quote";

    return (
      <TouchableOpacity
        style={[styles.notifRow, { borderBottomColor: colors.border }]}
        activeOpacity={0.7}
        onPress={() => {
          if (item.tweak) {
            navigation.navigate("TweetDetail", {
              universeId,
              tweakId: item.actorTweak?.id || item.tweak.id,
            });
          }
        }}
      >
        {/* Left: icon column */}
        <View style={styles.notifLeft}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>

        {/* Right: content */}
        <View style={styles.notifContent}>
          {/* Avatar + dots + timestamp */}
          <View style={styles.notifTopRow}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("CharacterProfile", {
                  universeId,
                  characterId: item.actor.id,
                  currentCharacterId,
                })
              }
            >
              <CharacterAvatar
                name={item.actor.name}
                username={item.actor.username}
                profilePicture={item.actor.profile_picture}
                size={40}
              />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <Ionicons
              name="ellipsis-horizontal"
              size={18}
              color={colors.textSecondary}
            />
          </View>

          {/* Name + action */}
          <View style={styles.notifNameRow}>
            <Text style={[styles.notifName, { color: colors.text }]}>
              {item.actor.name}
            </Text>
            <Text style={[styles.notifHandle, { color: colors.textSecondary }]}>
              {" "}
              @{item.actor.username} · {formatDate(item.timestamp)}
            </Text>
          </View>

          {/* "Replying to @username" or action description */}
          {isReplyOrQuote && item.tweak ? (
            <Text style={[styles.replyingTo, { color: colors.textSecondary }]}>
              {item.type === "reply" ? "Replying to " : "Quoted "}
              <Text style={{ color: colors.primary }}>
                @{currentCharacter?.username}
              </Text>
            </Text>
          ) : (
            <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>
              {actionLabel(item.type)}
            </Text>
          )}

          {/* Actor's tweet text (for replies/quotes) */}
          {item.actorTweak && (
            <Text style={[styles.notifTweetText, { color: colors.text }]}>
              {item.actorTweak.content}
            </Text>
          )}

          {/* Original tweet preview box (for RT/like/quote) */}
          {item.tweak && !isReplyOrQuote && (
            <View
              style={[
                styles.tweetPreview,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <Text
                style={[
                  styles.tweetPreviewText,
                  { color: colors.textSecondary },
                ]}
                numberOfLines={2}
              >
                {item.tweak.content}
              </Text>
            </View>
          )}

          {/* Engagement row (like reply) */}
          {isReplyOrQuote && item.actorTweak && (
            <View style={styles.engagementRow}>
              <TouchableOpacity style={styles.engagementBtn}>
                <Ionicons
                  name="chatbubble-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                {(item.actorTweak.comment_count || 0) > 0 && (
                  <Text
                    style={[
                      styles.engagementCount,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {formatCount(item.actorTweak.comment_count)}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.engagementBtn}>
                <Ionicons
                  name="repeat-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    styles.engagementCount,
                    { color: colors.textSecondary },
                  ]}
                >
                  {formatCount(item.actorTweak.retweet_count)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.engagementBtn}>
                <Ionicons
                  name="heart-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    styles.engagementCount,
                    { color: colors.textSecondary },
                  ]}
                >
                  {formatCount(item.actorTweak.like_count)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.engagementBtn}>
                <Ionicons
                  name="stats-chart-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    styles.engagementCount,
                    { color: colors.textSecondary },
                  ]}
                >
                  {formatCount(item.actorTweak.view_count)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.engagementBtn}>
                <Ionicons
                  name="share-outline"
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerSide}
        >
          <Ionicons name="menu" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Notification
        </Text>
        <TouchableOpacity style={styles.headerSide}>
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === i && {
                borderBottomColor: colors.primary,
                borderBottomWidth: 3,
              },
            ]}
            onPress={() => setActiveTab(i)}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === i ? colors.text : colors.textSecondary,
                  fontWeight: activeTab === i ? "700" : "400",
                },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons
            name="notifications-outline"
            size={60}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {currentCharacter
              ? `No notifications for @${currentCharacter.username} yet`
              : "No notifications yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 52 : 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSide: { width: 40 },
  headerTitle: { fontSize: 20, fontWeight: "700" },

  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    marginBottom: -1,
  },
  tabText: { fontSize: 15 },

  // Notification row
  notifRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  notifLeft: {
    width: 40,
    alignItems: "flex-end",
    paddingTop: 4,
  },
  notifContent: { flex: 1, gap: 6 },
  notifTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  notifNameRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
  },
  notifName: { fontSize: 15, fontWeight: "700" },
  notifHandle: { fontSize: 14 },
  replyingTo: { fontSize: 14 },
  actionDesc: { fontSize: 14 },
  notifTweetText: { fontSize: 15, lineHeight: 20 },

  tweetPreview: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 10,
    marginTop: 4,
  },
  tweetPreviewText: { fontSize: 14, lineHeight: 20 },

  engagementRow: {
    flexDirection: "row",
    gap: 28,
    marginTop: 4,
  },
  engagementBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  engagementCount: { fontSize: 13 },

  emptyText: { fontSize: 15, textAlign: "center", paddingHorizontal: 32 },
});
