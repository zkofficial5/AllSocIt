import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { characterAPI } from "../../services/tweaknow";
import { TweakNowCharacter } from "../../types/tweaknow";
import CharacterAvatar from "../../components/TweakNow/CharacterAvatar";
import { useTheme } from "../../contexts/ThemeContext";

type RootStackParamList = {
  CharacterSwitcher: {
    universeId: number;
    currentCharacterId?: number;
    onSelect: (character: TweakNowCharacter) => void;
  };
  CreateCharacter: { universeId: number };
};

type CharacterSwitcherScreenProps = {
  navigation: NativeStackNavigationProp<
    RootStackParamList,
    "CharacterSwitcher"
  >;
  route: RouteProp<RootStackParamList, "CharacterSwitcher">;
};

export default function CharacterSwitcherScreen({
  navigation,
  route,
}: CharacterSwitcherScreenProps) {
  const { universeId, currentCharacterId, onSelect } = route.params;
  const { colors } = useTheme();
  const [characters, setCharacters] = useState<TweakNowCharacter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const chars = await characterAPI.getAll(universeId);
      setCharacters(chars);
    } catch (error) {
      Alert.alert("Error", "Could not load characters");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCharacter = (character: TweakNowCharacter) => {
    onSelect(character);
    navigation.goBack();
  };
  const handleDeleteCharacter = (character: TweakNowCharacter) => {
    Alert.alert(
      "Delete Character",
      `Delete "${character.name}"? This will delete all their tweets.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await characterAPI.delete(universeId, character.id);
              setCharacters(characters.filter((c) => c.id !== character.id));
              Alert.alert("Success", "Character deleted");
            } catch (error) {
              Alert.alert("Error", "Could not delete character");
            }
          },
        },
      ],
    );
  };

  const renderCharacter = ({ item }: { item: TweakNowCharacter }) => {
    const isSelected = item.id === currentCharacterId;

    return (
      <TouchableOpacity
        style={[styles.characterItem, { borderBottomColor: colors.border }]}
        onPress={() => handleSelectCharacter(item)}
      >
        <View style={styles.characterContent}>
          <CharacterAvatar
            name={item.name}
            username={item.username}
            profilePicture={item.profile_picture}
            size={48}
          />
          <View style={styles.characterInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.text }]}>
                {item.name}
              </Text>
              {item.is_private && (
                <Ionicons
                  name="lock-closed"
                  size={14}
                  color={colors.textSecondary}
                />
              )}
            </View>
            <Text style={[styles.username, { color: colors.textSecondary }]}>
              @{item.username}
            </Text>
          </View>
          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={colors.primary}
            />
          )}
        </View>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => handleDeleteCharacter(item)}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Switch user
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("CreateCharacter", { universeId })}
        >
          <Ionicons
            name="person-add-outline"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Character List */}
      <FlatList
        data={characters}
        renderItem={renderCharacter}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
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
  listContent: {
    padding: 16,
  },
  characterItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  characterContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  characterInfo: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
  },
  username: {
    fontSize: 14,
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  },
});
