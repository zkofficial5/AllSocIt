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

// for the implementation of screenshot feature I WANT i will need these imports later
// import { useRef } from "react";
// import { captureRef } from "react-native-view-shot";
// import * as MediaLibrary from "expo-media-library";
// import * as Sharing from "expo-sharing";

import { useRef } from "react";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

type RootStackParamList = {
  TweetDetail: { universeId: number; tweakId: number };
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

type TweetDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "TweetDetail">;
  route: RouteProp<RootStackParamList, "TweetDetail">;
};

export default function TweetDetailScreen({
  navigation,
  route,
}: TweetDetailScreenProps) {
  const { universeId, tweakId } = route.params;
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [mainTweak, setMainTweak] = useState<Tweak | null>(null);
  const [replies, setReplies] = useState<Tweak[]>([]);
  const [characters, setCharacters] = useState<TweakNowCharacter[]>([]);
  const viewRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  // ADD THIS NEW useEffect
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      loadData(); // Reload when screen comes into focus
    });
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      const [allTweaks, allCharacters] = await Promise.all([
        tweakAPI.getAll(universeId),
        characterAPI.getAll(universeId),
      ]);

      const tweak = allTweaks.find((t) => t.id === tweakId);
      if (tweak) {
        setMainTweak(tweak);
        // Get ALL replies in this thread (not just direct replies)
        const getAllRepliesInThread = (
          rootId: number,
          tweets: Tweak[],
        ): Tweak[] => {
          const directReplies = tweets.filter(
            (t) => t.reply_to_tweak_id === rootId,
          );
          const nestedReplies = directReplies.flatMap((reply) =>
            getAllRepliesInThread(reply.id, tweets),
          );
          return [...directReplies, ...nestedReplies];
        };

        const tweetReplies = getAllRepliesInThread(tweakId, allTweaks);
        setReplies(tweetReplies);
      }
      setCharacters(allCharacters);
    } catch (error) {
      Alert.alert("Error", "Could not load tweet");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // LATER IMPLEMENTATION OF SCREENSHOT FEATURE talked about above
  // const handleScreenshot = async () => {
  //   try {
  //     // Request media library permissions
  //     const { status } = await MediaLibrary.requestPermissionsAsync();
  //     if (status !== "granted") {
  //       Alert.alert(
  //         "Permission needed",
  //         "Please grant media library access to save screenshots",
  //       );
  //       return;
  //     }

  //     // Capture the view
  //     const uri = await captureRef(viewRef, {
  //       format: "png",
  //       quality: 1,
  //     });

  //     // Save to media library
  //     await MediaLibrary.saveToLibraryAsync(uri);
  //     Alert.alert("Success", "Screenshot saved to gallery!");
  //   } catch (error) {
  //     console.error("Screenshot error:", error);
  //     Alert.alert("Error", "Could not save screenshot");
  //   }
  // };

  const handleScreenshot = async () => {
    try {
      // Capture the view
      const uri = await captureRef(viewRef, {
        format: "png",
        quality: 1,
      });

      // Share the image (user can save from share menu)
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

  // Build nested reply tree
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

  // Get parent tweet for "Replying to" display
  const getParentTweet = (replyToId: number): Tweak | undefined => {
    if (mainTweak && mainTweak.id === replyToId) return mainTweak;
    return replies.find((r) => r.id === replyToId);
  };
  // Count direct replies to a tweet
  const countReplies = (tweakId: number): number => {
    return replies.filter((r) => r.reply_to_tweak_id === tweakId).length;
  };

  const handleReply = () => {
    if (!mainTweak) return;
    const character = getCharacterById(mainTweak.character_id);
    if (!character) return;

    navigation.navigate("ReplyComposer", {
      universeId,
      replyToTweakId: mainTweak.id,
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
            if (tweak.id === tweakId) {
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

  // old render reply function before implementing threaded replies:
  // const renderReply = ({ item, index }: { item: Tweak; index: number }) => {
  //   const character = getCharacterById(item.character_id);
  //   if (!character) return null;

  //   // Check if next reply is replying to this one
  //   const nextReply = replies[index + 1];
  //   const showThreadLine = nextReply && nextReply.reply_to_tweak_id === item.id;

  //   return (
  //     <View>
  //       <TweetCard
  //         tweak={item}
  //         character={character}
  //         isReply
  //         showThreadLine={showThreadLine}
  //         onPress={() => {
  //           // Allow replying to this reply
  //           navigation.navigate("ReplyComposer", {
  //             universeId,
  //             replyToTweakId: item.id,
  //             replyToCharacter: character,
  //           });
  //         }}
  //         onLongPress={() => handleDeleteTweak(item)}
  //       />
  //     </View>
  //   );
  // };

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

        {/* Render children recursively */}
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

  if (!mainTweak) {
    return null;
  }

  const mainCharacter = getCharacterById(mainTweak.character_id);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      {/* <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tweet</Text>
        <View style={{ width: 24 }} />
      </View> */}

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

      {/* Main Tweet + Replies */}
      {/* <View ref={viewRef} collapsable={false} style={{ flex: 1 }}> */}
      <FlatList
        data={buildReplyTree(tweakId, replies)}
        renderItem={({ item }) => renderThreadedReply(item, false)}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          mainCharacter ? (
            <View ref={viewRef} collapsable={false}>
              <TweetCard
                tweak={mainTweak}
                character={mainCharacter}
                replyCount={
                  replies.filter((r) => r.reply_to_tweak_id === tweakId).length
                }
                onPress={() =>
                  navigation.navigate("CharacterProfile", {
                    universeId,
                    characterId: mainCharacter.id,
                  })
                }
                onLongPress={() => handleDeleteTweak(mainTweak)}
                isDetailView
              />
              {/* Only include replies if they exist (removing cus double rendering)
              {replies.length > 0 &&
                replies.map((reply, index) => {
                  const character = getCharacterById(reply.character_id);
                  if (!character) return null;
                  const nextReply = replies[index + 1];
                  const showThreadLine =
                    nextReply && nextReply.reply_to_tweak_id === reply.id;
                  return (
                    <TweetCard
                      key={reply.id}
                      tweak={reply}
                      character={character}
                      isReply
                      showThreadLine={showThreadLine}
                      onPress={() => {
                        navigation.navigate("ReplyComposer", {
                          universeId,
                          replyToTweakId: reply.id,
                          replyToCharacter: character,
                        });
                      }}
                      onLongPress={() => handleDeleteTweak(reply)}
                    />
                  );
                })} */}
            </View>
          ) : null
        }
        // ListEmptyComponent={
        //   <View style={styles.emptyReplies}>
        //     <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        //       No replies yet
        //     </Text>
        //   </View>
        // }
      />

      {/* Reply Button */}
      {/* <TouchableOpacity
        style={[styles.replyButton, { backgroundColor: colors.primary }]}
        onPress={handleReply}
      >
        <Ionicons name="chatbubble-outline" size={24} color="#FFFFFF" />
      </TouchableOpacity> */}

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
  // repliesHeader: {
  //   padding: 16,
  //   borderBottomWidth: 1,
  // },
  // repliesHeaderText: {
  //   fontSize: 14,
  //   fontWeight: "bold",
  // },
  emptyReplies: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
  // replyButton: {
  //   position: "absolute",
  //   right: 16,
  //   bottom: 16,
  //   width: 56,
  //   height: 56,
  //   borderRadius: 28,
  //   justifyContent: "center",
  //   alignItems: "center",
  //   elevation: 4,
  //   shadowColor: "#000",
  //   shadowOffset: { width: 0, height: 2 },
  //   shadowOpacity: 0.25,
  //   shadowRadius: 4,
  // },

  replyInputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24, // Extra padding for navigation buttons
  },
  replyInput: {
    paddingVertical: 8,
  },
  replyInputText: {
    fontSize: 16,
  },
});
