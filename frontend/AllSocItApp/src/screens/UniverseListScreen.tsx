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
import { universeAPI, authAPI } from "../services/api";
import { Universe } from "../types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

type UniverseListScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "UniverseList">;
};

export default function UniverseListScreen({
  navigation,
}: UniverseListScreenProps) {
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async () => {
    try {
      const [universesData, userData] = await Promise.all([
        universeAPI.getAll(),
        authAPI.getCurrentUser(),
      ]);
      setUniverses(universesData);
      setUser(userData);
    } catch (error) {
      Alert.alert("Error", "Could not load universes");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await authAPI.logout();
          navigation.replace("Login");
        },
      },
    ]);
  };

  const handleDeleteUniverse = (universe: Universe) => {
    Alert.alert(
      "Delete Universe",
      `Are you sure you want to delete "${universe.name}"? This will delete all content inside.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await universeAPI.delete(universe.id);
              setUniverses(universes.filter((u) => u.id !== universe.id));
              Alert.alert("Success", "Universe deleted");
            } catch (error) {
              Alert.alert("Error", "Could not delete universe");
            }
          },
        },
      ],
    );
  };

  const renderUniverse = ({ item }: { item: Universe }) => (
    <TouchableOpacity
      style={styles.universeCard}
      onPress={() =>
        navigation.navigate("UniverseDashboard", {
          universeId: item.id,
          universeName: item.name,
        })
      }
    >
      <View style={styles.universeContent}>
        <View style={styles.universeIcon}>
          <Ionicons name="folder" size={32} color="#1DA1F2" />
        </View>
        <View style={styles.universeInfo}>
          <Text style={styles.universeName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.universeDescription}>{item.description}</Text>
          )}
          <Text style={styles.universeDate}>
            Created {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteUniverse(item)}
      >
        <Ionicons name="trash-outline" size={20} color="#E0245E" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1DA1F2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Universes</Text>
          {user && <Text style={styles.headerSubtitle}>@{user.username}</Text>}
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#1DA1F2" />
        </TouchableOpacity>
      </View>

      {/* Universe List */}
      {universes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={64} color="#657786" />
          <Text style={styles.emptyText}>No universes yet</Text>
          <Text style={styles.emptySubtext}>
            Create your first story universe!
          </Text>
        </View>
      ) : (
        <FlatList
          data={universes}
          renderItem={renderUniverse}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Create Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreateUniverse")}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#15202B",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#15202B",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: "#38444d",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#8899A6",
    marginTop: 2,
  },
  listContent: {
    padding: 16,
  },
  universeCard: {
    backgroundColor: "#192734",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#38444d",
  },
  universeContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  universeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1c2938",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  universeInfo: {
    flex: 1,
  },
  universeName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  universeDescription: {
    fontSize: 14,
    color: "#8899A6",
    marginBottom: 4,
  },
  universeDate: {
    fontSize: 12,
    color: "#657786",
  },
  deleteButton: {
    padding: 8,
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
    color: "#FFFFFF",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#8899A6",
    marginTop: 8,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1DA1F2",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
