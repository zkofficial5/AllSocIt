import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { characterAPI, tweakAPI } from "../../services/tweaknow";
import { TweakNowCharacter, Tweak } from "../../types/tweaknow";
import TweetCard from "../../components/TweakNow/TweetCard";
import { useTheme } from "../../contexts/ThemeContext";
import { useRef } from "react";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

type RootStackParamList = {
  ReplyDetail: { universeId: number; replyId: number };
  CharacterProfile: {
    universeId: number;
    characterId: number;
    currentCharacterId?: number;
  };
  ReplyComposer: {
    universeId: number;
    replyToTweakId: number;
    replyToCharacter: TweakNowCharacter;
  };
};

type ReplyDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ReplyDetail">;
  route: RouteProp<RootStackParamList, "ReplyDetail">;
};

export default function ReplyDetailScreen({
  navigation,
  route,
}: ReplyDetailScreenProps) {
  const { universeId, replyId } = route.params;
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [mainReply, setMainReply] = useState<Tweak | null>(null);
  const [replies, setReplies] = useState<Tweak[]>([]);
  const [characters, setCharacters] = useState<TweakNowCharacter[]>([]);
  const [parentTweet, setParentTweet] = useState<Tweak | null>(null);
  const viewRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      const [allTweaks, allCharacters] = await Promise.all([
        tweakAPI.getAll(universeId),
        characterAPI.getAll(universeId),
      ]);

      const reply = allTweaks.find((t) => t.id === replyId);
      if (reply) {
        setMainReply(reply);

        // Get the parent tweet for "Replying to" display
        if (reply.reply_to_tweak_id) {
          const parent = allTweaks.find(
            (t) => t.id === reply.reply_to_tweak_id,
          );
          setParentTweet(parent || null);
        }

        // Get ALL replies to this reply (nested)
        const getAllRepliesInThread = (
          rootId: number,
          tweets: Tweak[],
        ): Tweak[] => {
          const directReplies = tweets.filter(
            (t) => t.reply_to_tweak_id === rootId,
          );
          const nestedReplies = directReplies.flatMap((r) =>
            getAllRepliesInThread(r.id, tweets),
          );
          return [...directReplies, ...nestedReplies];
        };

        const replyReplies = getAllRepliesInThread(replyId, allTweaks);
        setReplies(replyReplies);
      }
      setCharacters(allCharacters);
    } catch (error) {
      Alert.alert("Error", "Could not load reply");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleScreenshot = async () => {
    try {
      const uri = await captureRef(viewRef, {
        format: "png",
        quality: 1,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Screenshot error:", error);
      Alert.alert("Error", "Could not capture screenshot");
    }
  };

  const getCharacterById = (id: number): TweakNowCharacter | undefined => {
    return characters.find((c) => c.id === id);
  };

  const buildReplyTree = (
    parentId: number | null,
    allReplies: Tweak[],
    depth: number = 0,
  ): any[] => {
    const directReplies = allReplies.filter(
      (r) => r.reply_to_tweak_id === parentId,
    );

    return directReplies.map((reply) => ({
      ...reply,
      depth,
      children: buildReplyTree(reply.id, allReplies, depth + 1),
    }));
  };

  const getParentTweet = (replyToId: number): Tweak | undefined => {
    if (mainReply && mainReply.id === replyToId) return mainReply;
    return replies.find((r) => r.id === replyToId);
  };

  const countReplies = (tweakId: number): number => {
    return replies.filter((r) => r.reply_to_tweak_id === tweakId).length;
  };

  const handleReply = () => {
    if (!mainReply) return;
    const character = getCharacterById(mainReply.character_id);
    if (!character) return;

    navigation.navigate("ReplyComposer", {
      universeId,
      replyToTweakId: mainReply.id,
      replyToCharacter: character,
    });
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
            if (tweak.id === replyId) {
              navigation.goBack();
            } else {
              setReplies(replies.filter((r) => r.id !== tweak.id));
            }
          } catch (error) {
            Alert.alert("Error", "Could not delete tweet");
          }
        },
      },
    ]);
  };

  const renderThreadedReply = (item: any, isLast: boolean = false) => {
    const character = getCharacterById(item.character_id);
    if (!character) return null;

    const parentTweet = item.reply_to_tweak_id
      ? getParentTweet(item.reply_to_tweak_id)
      : null;
    const parentCharacter = parentTweet
      ? getCharacterById(parentTweet.character_id)
      : null;

    const hasChildren = item.children && item.children.length > 0;

    return (
      <View key={item.id}>
        <TweetCard
          tweak={item}
          character={character}
          isReply
          showThreadLine={hasChildren}
          replyingTo={parentCharacter?.username}
          replyCount={countReplies(item.id)}
          onPress={() => {
            navigation.navigate("ReplyComposer", {
              universeId,
              replyToTweakId: item.id,
              replyToCharacter: character,
            });
          }}
          onLongPress={() => handleDeleteTweak(item)}
        />

        {item.children &&
          item.children.map((child: any, index: number) =>
            renderThreadedReply(child, index === item.children.length - 1),
          )}
      </View>
    );
  };

  if (loading) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!mainReply) {
    return null;
  }

  const mainCharacter = getCharacterById(mainReply.character_id);
  const parentCharacter = parentTweet
    ? getCharacterById(parentTweet.character_id)
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tweet</Text>
        <TouchableOpacity onPress={handleScreenshot}>
          <Ionicons name="camera-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Main Reply + Sub-Replies */}
      <FlatList
        data={buildReplyTree(replyId, replies)}
        renderItem={({ item }) => renderThreadedReply(item, false)}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          mainCharacter ? (
            <View ref={viewRef} collapsable={false}>
              <TweetCard
                tweak={mainReply}
                character={mainCharacter}
                replyingTo={parentCharacter?.username}
                replyCount={
                  replies.filter((r) => r.reply_to_tweak_id === replyId).length
                }
                onPress={undefined}
                onLongPress={() => handleDeleteTweak(mainReply)}
                isDetailView
              />
            </View>
          ) : null
        }
      />

      {/* Reply Input */}
      <View
        style={[
          styles.replyInputContainer,
          { borderTopColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <TouchableOpacity style={styles.replyInput} onPress={handleReply}>
          <Text
            style={[styles.replyInputText, { color: colors.textSecondary }]}
          >
            reply
          </Text>
        </TouchableOpacity>
      </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  replyInputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  replyInput: {
    paddingVertical: 8,
  },
  replyInputText: {
    fontSize: 16,
  },
});
