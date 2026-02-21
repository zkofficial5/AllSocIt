import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";

type RootStackParamList = {
  TrendsSearch: { universeId: number };
};

type TrendsSearchScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "TrendsSearch">;
  route: RouteProp<RootStackParamList, "TrendsSearch">;
};

interface Trend {
  id: number;
  name: string;
  tweet_count: number;
}

export default function TrendsSearchScreen({
  navigation,
  route,
}: TrendsSearchScreenProps) {
  const { universeId } = route.params;
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTrendName, setNewTrendName] = useState("");
  const [newTrendCount, setNewTrendCount] = useState("");

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    try {
      // TODO: Replace with actual API call
      // const data = await trendAPI.getAll(universeId);
      // setTrends(data);

      // Placeholder data
      setTrends([
        { id: 1, name: "#React Native", tweet_count: 15000 },
        { id: 2, name: "#TypeScript", tweet_count: 12000 },
        { id: 3, name: "#AI", tweet_count: 25000 },
        { id: 4, name: "#WebDev", tweet_count: 8000 },
      ]);
    } catch (error) {
      Alert.alert("Error", "Could not load trends");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrend = () => {
    if (!newTrendName.trim() || !newTrendCount.trim()) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    // TODO: Replace with actual API call
    // await trendAPI.create(universeId, newTrendName, parseInt(newTrendCount));

    const newTrend = {
      id: trends.length + 1,
      name: newTrendName,
      tweet_count: parseInt(newTrendCount) || 0,
    };

    setTrends([newTrend, ...trends]);
    setNewTrendName("");
    setNewTrendCount("");
    setShowCreateModal(false);
  };

  const renderTopTrend = (trend: Trend, index: number) => (
    <TouchableOpacity
      key={trend.id}
      style={[
        styles.topTrendBox,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text
        style={[styles.topTrendName, { color: colors.text }]}
        numberOfLines={1}
      >
        {trend.name}
      </Text>
      <Text style={[styles.topTrendCount, { color: colors.textSecondary }]}>
        {trend.tweet_count.toLocaleString()} Tweets
      </Text>
    </TouchableOpacity>
  );

  const renderTrendItem = ({ item }: { item: Trend }) => (
    <TouchableOpacity
      style={[styles.trendItem, { borderBottomColor: colors.border }]}
    >
      <View style={styles.trendLeft}>
        <Text style={[styles.trendName, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.trendCount, { color: colors.textSecondary }]}>
          {item.tweet_count.toLocaleString()} Tweets
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Trends</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)}>
          <Ionicons name="pencil" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar (non-functional for now) */}
      <View
        style={[styles.searchContainer, { backgroundColor: colors.surface }]}
      >
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={trends.slice(4)}
        renderItem={renderTrendItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <>
            {/* Top 4 Trends Grid */}
            {trends.length >= 4 && (
              <View style={styles.topTrendsGrid}>
                {trends
                  .slice(0, 4)
                  .map((trend, index) => renderTopTrend(trend, index))}
              </View>
            )}

            {/* Section Header */}
            <View
              style={[
                styles.sectionHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                All Trends
              </Text>
            </View>
          </>
        }
      />

      {/* Create Trend Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Create New Trend
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                { color: colors.text, borderColor: colors.border },
              ]}
              placeholder="Trend name (e.g., #ReactNative)"
              placeholderTextColor={colors.textSecondary}
              value={newTrendName}
              onChangeText={setNewTrendName}
            />

            <TextInput
              style={[
                styles.modalInput,
                { color: colors.text, borderColor: colors.border },
              ]}
              placeholder="Number of tweets"
              placeholderTextColor={colors.textSecondary}
              value={newTrendCount}
              onChangeText={setNewTrendCount}
              keyboardType="number-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setShowCreateModal(false);
                  setNewTrendName("");
                  setNewTrendCount("");
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleCreateTrend}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    padding: 12,
    borderRadius: 24,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16 },
  topTrendsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 8,
    gap: 8,
  },
  topTrendBox: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    justifyContent: "center",
  },
  topTrendName: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  topTrendCount: { fontSize: 14 },
  sectionHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: "bold" },
  trendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  trendLeft: { flex: 1 },
  trendName: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  trendCount: { fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
