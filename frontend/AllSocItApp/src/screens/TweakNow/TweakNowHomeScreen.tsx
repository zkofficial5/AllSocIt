import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { characterAPI, tweakAPI } from "../../services/tweaknow";
import { TweakNowCharacter, Tweak } from "../../types/tweaknow";
import TweetCard from "../../components/TweakNow/TweetCard";
import CharacterAvatar from "../../components/TweakNow/CharacterAvatar";
import SideDrawer from "../../components/TweakNow/SideDrawer";
import { useTheme } from "../../contexts/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";

type RootStackParamList = {
  TweakNow: { universeId: number };
  CreateCharacter: { universeId: number };
  EditCharacter: { universeId: number; characterId: number };
  CreateTweak: { universeId: number; characterId?: number };
  CharacterProfile: {
    universeId: number;
    characterId: number;
    currentCharacterId?: number;
  }; // ADD currentCharacterId HERE
  UniverseDashboard: { universeId: number; universeName: string };
  // CharacterSwitcher: {
  //   universeId: number;
  //   currentCharacterId?: number;
  //   onSelect: (character: TweakNowCharacter) => void;
  // };
  CharacterSwitcher: {
    universeId: number;
    currentCharacterId?: number;
    onSelect: (character: TweakNowCharacter) => void;
  };
};

type TweakNowHomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "TweakNow">;
  route: RouteProp<RootStackParamList, "TweakNow">;
};

export default function TweakNowHomeScreen({
  navigation,
  route,
}: TweakNowHomeScreenProps) {
  const { universeId } = route.params;
  const { colors, theme, setTheme } = useTheme();
  const [characters, setCharacters] = useState<TweakNowCharacter[]>([]);
  const [tweaks, setTweaks] = useState<Tweak[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCharacter, setCurrentCharacter] =
    useState<TweakNowCharacter | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showCharacterSelector, setShowCharacterSelector] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [charactersData, tweaksData] = await Promise.all([
        characterAPI.getAll(universeId),
        tweakAPI.getAll(universeId),
      ]);
      setCharacters(charactersData);

      // Filter out replies - only show main tweets in feed
      const mainTweaks = tweaksData.filter((t) => !t.reply_to_tweak_id);
      setTweaks(mainTweaks);

      if (charactersData.length > 0 && !currentCharacter) {
        setCurrentCharacter(charactersData[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Could not load data");
    } finally {
      setLoading(false);
    }
  };

  const getCharacterById = (id: number): TweakNowCharacter | undefined => {
    return characters.find((c) => c.id === id);
  };

  const handleDeleteTweak = (tweak: Tweak) => {
    Alert.alert("Delete Tweak", "Are you sure you want to delete this tweak?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await tweakAPI.delete(universeId, tweak.id);
            setTweaks(tweaks.filter((t) => t.id !== tweak.id));
          } catch (error) {
            Alert.alert("Error", "Could not delete tweak");
          }
        },
      },
    ]);
  };

  const handleThemeChange = () => {
    setTheme(theme === "light" ? "dark" : "light");
    setShowDrawer(false);
  };

  const [likedTweaks, setLikedTweaks] = useState<Set<number>>(new Set());
  const [retweetedTweaks, setRetweetedTweaks] = useState<Set<number>>(
    new Set(),
  );

  const handleFeedLike = (item: Tweak) => {
    const alreadyLiked = likedTweaks.has(item.id);
    setLikedTweaks((prev) => {
      const next = new Set(prev);
      alreadyLiked ? next.delete(item.id) : next.add(item.id);
      return next;
    });
    setTweaks((prev) =>
      prev.map((t) =>
        t.id === item.id
          ? {
              ...t,
              like_count: alreadyLiked ? t.like_count - 1 : t.like_count + 1,
            }
          : t,
      ),
    );
  };

  const handleFeedRetweet = (item: Tweak) => {
    Alert.alert("Retweet", "", [
      {
        text: retweetedTweaks.has(item.id) ? "Undo Retweet" : "Retweet",
        onPress: async () => {
          try {
            if (retweetedTweaks.has(item.id)) {
              setRetweetedTweaks((prev) => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
              });
              setTweaks((prev) =>
                prev.map((t) =>
                  t.id === item.id
                    ? { ...t, retweet_count: Math.max(0, t.retweet_count - 1) }
                    : t,
                ),
              );
              loadData();
            } else {
              await tweakAPI.retweet(universeId, item.id, item.character_id);
              setRetweetedTweaks((prev) => new Set(prev).add(item.id));
              setTweaks((prev) =>
                prev.map((t) =>
                  t.id === item.id
                    ? { ...t, retweet_count: t.retweet_count + 1 }
                    : t,
                ),
              );
              loadData();
            }
          } catch (error) {
            Alert.alert("Error", "Could not retweet");
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const renderTweak = ({ item }: { item: Tweak }) => {
    const character = getCharacterById(item.character_id);
    if (!character) return null;

    // For retweets: show currentCharacter name (whoever pressed RT)
    const retweetedByName = item.is_retweet
      ? (currentCharacter?.name ?? character.name)
      : undefined;

    // For quote tweets: find the quoted tweet and its character
    const quotedTweak = item.quoted_tweak_id
      ? (tweaks.find((t) => t.id === item.quoted_tweak_id) ?? null)
      : null;
    const quotedCharacter = quotedTweak
      ? (getCharacterById(quotedTweak.character_id) ?? null)
      : null;

    return (
      <TweetCard
        tweak={item}
        character={character}
        isLiked={likedTweaks.has(item.id)}
        isRetweeted={retweetedTweaks.has(item.id)}
        onLike={() => handleFeedLike(item)}
        onRetweet={() => handleFeedRetweet(item)}
        onLongPress={() => handleDeleteTweak(item)}
        retweetedByName={retweetedByName}
        quotedTweak={quotedTweak}
        quotedCharacter={quotedCharacter}
      />
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

  if (characters.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            TweakNow
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons
            name="people-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No characters yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Create your first character to start tweaking!
          </Text>
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={() =>
              navigation.navigate("CreateCharacter", { universeId })
            }
          >
            <Text style={styles.createButtonText}>Create Character</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => setShowDrawer(true)}>
          {currentCharacter ? (
            <CharacterAvatar
              name={currentCharacter.name}
              username={currentCharacter.username}
              profilePicture={currentCharacter.profile_picture}
              size={40}
            />
          ) : (
            <Ionicons name="menu" size={24} color={colors.text} />
          )}
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          TweakNow
        </Text>
        <TouchableOpacity
          onPress={() => setShowCharacterSelector(!showCharacterSelector)}
        >
          <Ionicons name="people" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Character Selector */}
      {showCharacterSelector && (
        <View
          style={[
            styles.characterSelector,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <FlatList
            horizontal
            data={characters}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.characterItem,
                  currentCharacter?.id === item.id && {
                    backgroundColor: colors.background,
                  },
                ]}
                onPress={() => {
                  setCurrentCharacter(item);
                  setShowCharacterSelector(false);
                }}
              >
                <CharacterAvatar
                  name={item.name}
                  username={item.username}
                  profilePicture={item.profile_picture}
                  size={40}
                />
                <Text
                  style={[styles.characterName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.characterList}
            showsHorizontalScrollIndicator={false}
          />
          <TouchableOpacity
            style={styles.addCharacterButton}
            onPress={() => {
              setShowCharacterSelector(false);
              navigation.navigate("CreateCharacter", { universeId });
            }}
          >
            <Ionicons name="add-circle" size={40} color={colors.primary} />
            <Text style={[styles.addCharacterText, { color: colors.primary }]}>
              Add
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tweet Feed */}
      {tweaks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="document-text-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No tweaks yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Create your first tweak!
          </Text>
        </View>
      ) : (
        <FlatList
          data={tweaks}
          renderItem={renderTweak}
          keyExtractor={(item) => item.id.toString()}
          refreshing={loading}
          onRefresh={loadData}
          style={{ backgroundColor: colors.background }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() =>
          navigation.navigate("CreateTweak", {
            universeId,
            characterId: currentCharacter?.id,
          })
        }
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Side Drawer */}
      <Modal
        visible={showDrawer}
        animationType="none"
        transparent
        onRequestClose={() => setShowDrawer(false)}
      >
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={() => setShowDrawer(false)}
        >
          <View
            style={styles.drawerContent}
            onStartShouldSetResponder={() => true}
          >
            <SideDrawer
              currentCharacter={currentCharacter}
              onClose={() => setShowDrawer(false)}
              onProfile={() => {
                setShowDrawer(false);
                if (currentCharacter) {
                  navigation.navigate("CharacterProfile", {
                    universeId,
                    characterId: currentCharacter.id,
                    currentCharacterId: currentCharacter.id,
                  });
                }
              }}
              onAddUser={() => {
                setShowDrawer(false);
                navigation.navigate("CreateCharacter", { universeId });
              }}
              // onSwitchUser={() => {
              //   setShowDrawer(false);
              //   navigation.navigate("CharacterSwitcher", {
              //     universeId,
              //     currentCharacterId: currentCharacter?.id,
              //     onSelect: (character) => {
              //       setCurrentCharacter(character);
              //     },
              //   });
              // }}
              onSwitchUser={() => {
                setShowDrawer(false);
                navigation.navigate("CharacterSwitcher", {
                  universeId,
                  currentCharacterId: currentCharacter?.id,
                  onSelect: (character) => {
                    setCurrentCharacter(character);
                  },
                });
              }}
              onBackToAssets={() => {
                setShowDrawer(false);
                navigation.goBack();
              }}
              onThemeChange={() => {
                setShowDrawer(false);
                setShowThemeModal(true);
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Theme Modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <TouchableOpacity
          style={styles.themeModalOverlay}
          activeOpacity={1}
          onPress={() => setShowThemeModal(false)}
        >
          <View
            style={[styles.themeModal, { backgroundColor: colors.background }]}
          >
            <Text style={[styles.themeTitle, { color: colors.text }]}>
              Theme
            </Text>

            <TouchableOpacity
              style={styles.themeOption}
              onPress={() => {
                setTheme("light");
                setShowThemeModal(false);
              }}
            >
              <View
                style={[styles.radio, theme === "light" && styles.radioActive]}
              >
                {theme === "light" && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.themeOptionText, { color: colors.text }]}>
                Default
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.themeOption}
              onPress={() => {
                setTheme("dark");
                setShowThemeModal(false);
              }}
            >
              <View
                style={[styles.radio, theme === "dark" && styles.radioActive]}
              >
                {theme === "dark" && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.themeOptionText, { color: colors.text }]}>
                Black
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.themeOption}
              onPress={() => {
                setTheme("darkBlue");
                setShowThemeModal(false);
              }}
            >
              <View
                style={[
                  styles.radio,
                  theme === "darkBlue" && styles.radioActive,
                ]}
              >
                {theme === "darkBlue" && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.themeOptionText, { color: colors.text }]}>
                Dark blue
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Navigation */}
      {/* <SafeAreaView
        edges={["bottom"]}
        style={[
          styles.bottomNav,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingVertical: 8,
          },
        ]}
      >
        <View
          style={[
            styles.bottomNav,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <SafeAreaView
            edges={["bottom"]}
            style={[
              styles.bottomNav,
              {
                backgroundColor: colors.background,
                borderTopColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity style={styles.bottomNavIcon}>
              <Ionicons name="home" size={26} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomNavIcon}>
              <Ionicons
                name="search-outline"
                size={26}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomNavIcon}>
              <Ionicons
                name="notifications-outline"
                size={26}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomNavIcon}>
              <Ionicons
                name="mail-outline"
                size={26}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </SafeAreaView> */}

      {/* <View
        style={[
          styles.bottomNav,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity style={styles.bottomNavIcon}>
          <Ionicons name="home" size={26} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomNavIcon}>
          <Ionicons
            name="search-outline"
            size={26}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomNavIcon}>
          <Ionicons
            name="notifications-outline"
            size={26}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomNavIcon}>
          <Ionicons
            name="mail-outline"
            size={26}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View> */}

      {/* Bottom Navigation */}
      <SafeAreaView
        edges={["bottom"]}
        style={{ backgroundColor: colors.background }}
      >
        <View
          style={[
            styles.bottomNav,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity style={styles.bottomNavIcon}>
            <Ionicons name="home" size={26} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomNavIcon}>
            <Ionicons
              name="search-outline"
              size={26}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomNavIcon}>
            <Ionicons
              name="notifications-outline"
              size={26}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomNavIcon}>
            <Ionicons
              name="mail-outline"
              size={26}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
    fontSize: 20,
    fontWeight: "bold",
  },
  characterSelector: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  characterList: {
    paddingHorizontal: 12,
  },
  characterItem: {
    alignItems: "center",
    marginHorizontal: 8,
    padding: 8,
    borderRadius: 12,
  },
  characterName: {
    fontSize: 12,
    marginTop: 4,
    maxWidth: 60,
  },
  addCharacterButton: {
    alignItems: "center",
    marginHorizontal: 8,
    padding: 8,
  },
  addCharacterText: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 24,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 100, // Positioned well above nav
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1DA1F2",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000, // Ensure it's always on top
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  bottomNavIcon: {
    padding: 8, // Add padding around each icon
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
  },
  drawerContent: {
    width: 280,
    height: "100%",
  },
  themeModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  themeModal: {
    width: 280,
    borderRadius: 16,
    padding: 24,
  },
  themeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  themeOptionText: {
    fontSize: 16,
    marginLeft: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#8899A6",
    justifyContent: "center",
    alignItems: "center",
  },
  radioActive: {
    borderColor: "#1DA1F2",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1DA1F2",
  },

  navButton: {
    padding: 8,
  },
});
