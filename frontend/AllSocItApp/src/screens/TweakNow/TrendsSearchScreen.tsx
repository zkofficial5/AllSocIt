import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../contexts/ThemeContext";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { trendAPI } from "../../services/tweaknow";
import { Trend } from "../../types/tweaknow";

type RootStackParamList = {
  TrendsSearch: { universeId: number };
};

type TrendsSearchScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "TrendsSearch">;
  route: RouteProp<RootStackParamList, "TrendsSearch">;
};

const TABS = ["For you", "Trends", "News", "Sports", "Fun", "Entertainment"];

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

export default function TrendsSearchScreen({
  navigation,
  route,
}: TrendsSearchScreenProps) {
  const { universeId } = route.params;
  const { colors, theme } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);

  // Header state
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [headerText, setHeaderText] = useState<string>("");
  const [showHeaderModal, setShowHeaderModal] = useState(false);
  const [editHeaderImage, setEditHeaderImage] = useState<string | null>(null);
  const [editHeaderText, setEditHeaderText] = useState<string>("");

  // Create/Edit trend modal
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [editingTrend, setEditingTrend] = useState<Trend | null>(null);
  const [trendName, setTrendName] = useState("");
  const [trendCount, setTrendCount] = useState("");

  // Dots menu
  const [menuTrendId, setMenuTrendId] = useState<number | null>(null);

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    try {
      setLoading(true);
      const data = await trendAPI.getAll(universeId);
      setTrends(data);
      // Sync header from first trend that has it (or we store separately)
      if (data.length > 0 && data[0].header_image) {
        setHeaderImage(data[0].header_image);
        setHeaderText(data[0].header_text || "");
      }
    } catch (error) {
      Alert.alert("Error", "Could not load trends");
    } finally {
      setLoading(false);
    }
  };

  // ── Header edit ──────────────────────────────────────────────
  const openHeaderModal = () => {
    setEditHeaderImage(headerImage);
    setEditHeaderText(headerText);
    setShowHeaderModal(true);
  };

  const pickHeaderImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setEditHeaderImage(uri);
    }
  };

  const submitHeader = async () => {
    setHeaderImage(editHeaderImage);
    setHeaderText(editHeaderText);
    // Persist to first trend or a universe-level setting
    // For now update all trends with the header (or just store locally)
    // If you want full persistence, you'd call a dedicated endpoint
    if (trends.length > 0) {
      try {
        await trendAPI.update(universeId, trends[0].id, {
          header_image: editHeaderImage || undefined,
          header_text: editHeaderText || undefined,
        });
      } catch (_) {}
    }
    setShowHeaderModal(false);
  };

  // ── Trend create/edit ────────────────────────────────────────
  const openCreateTrend = () => {
    setEditingTrend(null);
    setTrendName("");
    setTrendCount("");
    setShowTrendModal(true);
  };

  const openEditTrend = (trend: Trend) => {
    setMenuTrendId(null);
    setEditingTrend(trend);
    setTrendName(trend.name);
    setTrendCount(String(trend.tweet_count));
    setShowTrendModal(true);
  };

  const submitTrend = async () => {
    if (!trendName.trim()) {
      Alert.alert("Error", "Trend name is required");
      return;
    }
    const count = parseInt(trendCount) || 0;
    try {
      if (editingTrend) {
        const updated = await trendAPI.update(universeId, editingTrend.id, {
          name: trendName.trim(),
          tweet_count: count,
        });
        setTrends((prev) =>
          prev.map((t) => (t.id === editingTrend.id ? updated : t)),
        );
      } else {
        const created = await trendAPI.create(
          universeId,
          trendName.trim(),
          count,
        );
        setTrends((prev) => [created, ...prev]);
      }
    } catch (error) {
      Alert.alert("Error", "Could not save trend");
    }
    setShowTrendModal(false);
  };

  const deleteTrend = async (trendId: number) => {
    setMenuTrendId(null);
    Alert.alert("Delete Trend", "Remove this trend?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await trendAPI.delete(universeId, trendId);
            setTrends((prev) => prev.filter((t) => t.id !== trendId));
          } catch {
            Alert.alert("Error", "Could not delete trend");
          }
        },
      },
    ]);
  };

  // ── Colors ───────────────────────────────────────────────────
  const bg = colors.background;
  const surface = colors.surface;
  const border = colors.border;
  const text = colors.text;
  const secondary = colors.textSecondary;
  const primary = colors.primary;
  const searchBg = theme === "light" ? "#EFF3F4" : colors.surface;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* ── Top bar ── */}
      <View style={[styles.topBar, { borderBottomColor: border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
        >
          <Ionicons name="menu" size={26} color={text} />
        </TouchableOpacity>

        <View style={[styles.searchBox, { backgroundColor: searchBg }]}>
          <Ionicons name="search" size={18} color={secondary} />
          <Text style={[styles.searchPlaceholder, { color: secondary }]}>
            Search twitter
          </Text>
        </View>

        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="settings-outline" size={24} color={text} />
        </TouchableOpacity>
      </View>

      {/* ── Category tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[
          styles.tabScroll,
          { borderBottomColor: border, borderBottomWidth: 1 },
        ]}
        contentContainerStyle={styles.tabContent}
      >
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(i)}
            style={[
              styles.tab,
              activeTab === i && {
                borderBottomColor: primary,
                borderBottomWidth: 3,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === i ? text : secondary },
                activeTab === i && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Main scroll ── */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header image */}
        <TouchableOpacity onPress={openHeaderModal} activeOpacity={0.9}>
          {headerImage ? (
            <View style={styles.headerImageWrapper}>
              <Image source={{ uri: headerImage }} style={styles.headerImage} />
              {headerText ? (
                <View style={styles.headerTextOverlay}>
                  <Text style={styles.headerTextLabel}>{headerText}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View
              style={[styles.headerPlaceholder, { backgroundColor: searchBg }]}
            >
              <Ionicons name="camera" size={40} color={secondary} />
            </View>
          )}
        </TouchableOpacity>

        {/* Trends for you header */}
        <View style={[styles.sectionHeader, { borderBottomColor: border }]}>
          <Text style={[styles.sectionTitle, { color: text }]}>
            Trends for you
          </Text>
          <TouchableOpacity onPress={openHeaderModal} style={{ padding: 4 }}>
            <Ionicons name="pencil-outline" size={18} color={secondary} />
          </TouchableOpacity>
        </View>

        {/* Trend items */}
        {trends.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: secondary }]}>
              No trends yet. Tap + to add one.
            </Text>
          </View>
        ) : (
          trends.map((trend) => (
            <View key={trend.id}>
              <TouchableOpacity
                style={[styles.trendRow, { borderBottomColor: border }]}
                activeOpacity={0.7}
              >
                <View style={styles.trendInfo}>
                  <Text style={[styles.trendCategory, { color: secondary }]}>
                    Trends
                  </Text>
                  <Text style={[styles.trendName, { color: text }]}>
                    {trend.name}
                  </Text>
                  <Text style={[styles.trendCount, { color: secondary }]}>
                    {formatCount(trend.tweet_count)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.dotsBtn}
                  onPress={() =>
                    setMenuTrendId(menuTrendId === trend.id ? null : trend.id)
                  }
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={20}
                    color={secondary}
                  />
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Inline dots menu */}
              {menuTrendId === trend.id && (
                <View
                  style={[
                    styles.dotsMenu,
                    { backgroundColor: surface, borderColor: border },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.dotsMenuItem}
                    onPress={() => openEditTrend(trend)}
                  >
                    <Ionicons name="pencil-outline" size={18} color={text} />
                    <Text style={[styles.dotsMenuText, { color: text }]}>
                      Edit trend
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dotsMenuItem}
                    onPress={() => deleteTrend(trend.id)}
                  >
                    <Ionicons name="trash-outline" size={18} color="#F4212E" />
                    <Text style={[styles.dotsMenuText, { color: "#F4212E" }]}>
                      Delete trend
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: primary }]}
        onPress={openCreateTrend}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ── Edit Trend Modal ── */}
      <Modal visible={showTrendModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTrendModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalBox, { backgroundColor: colors.background }]}
          >
            <Text style={[styles.modalTitle, { color: text }]}>
              {editingTrend ? "Edit trends" : "New trend"}
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                { color: text, borderBottomColor: primary },
              ]}
              placeholder={editingTrend ? "Trend name" : "e.g. #ReactNative"}
              placeholderTextColor={secondary}
              value={trendName}
              onChangeText={setTrendName}
            />

            <TextInput
              style={[
                styles.modalInput,
                { color: text, borderBottomColor: primary },
              ]}
              placeholder="Tweet count (e.g. 62353)"
              placeholderTextColor={secondary}
              value={trendCount}
              onChangeText={setTrendCount}
              keyboardType="number-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowTrendModal(false)}>
                <Text style={[styles.modalActionText, { color: primary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitTrend}>
                <Text style={[styles.modalActionText, { color: primary }]}>
                  Submit
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Edit Header Modal ── */}
      <Modal visible={showHeaderModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowHeaderModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalBox, { backgroundColor: colors.background }]}
          >
            <Text style={[styles.modalTitle, { color: text }]}>
              Edit header
            </Text>

            <TouchableOpacity
              style={[styles.addImageBtn, { backgroundColor: primary }]}
              onPress={pickHeaderImage}
            >
              <Text style={styles.addImageBtnText}>Add image</Text>
            </TouchableOpacity>

            {editHeaderImage ? (
              <Image
                source={{ uri: editHeaderImage }}
                style={styles.headerPreview}
              />
            ) : null}

            <TextInput
              style={[
                styles.modalInput,
                { color: text, borderBottomColor: primary },
              ]}
              placeholder="Header text"
              placeholderTextColor={secondary}
              value={editHeaderText}
              onChangeText={setEditHeaderText}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowHeaderModal(false)}>
                <Text style={[styles.modalActionText, { color: primary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitHeader}>
                <Text style={[styles.modalActionText, { color: primary }]}>
                  Submit
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Dismiss dots menu on outside tap */}
      {menuTrendId !== null && (
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={() => setMenuTrendId(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 52 : 40,
    paddingBottom: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  iconBtn: { padding: 4 },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  searchPlaceholder: { fontSize: 16 },

  // Tabs
  tabScroll: { flexGrow: 0 },
  tabContent: { paddingHorizontal: 4 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: -1,
  },
  tabText: { fontSize: 15 },
  tabTextActive: { fontWeight: "700" },

  // Header image
  headerImageWrapper: { width: "100%", height: 200 },
  headerImage: { width: "100%", height: "100%", resizeMode: "cover" },
  headerTextOverlay: {
    position: "absolute",
    bottom: 12,
    left: 14,
  },
  headerTextLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  headerPlaceholder: {
    width: "100%",
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: { fontSize: 20, fontWeight: "800" },

  // Trend rows
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  trendInfo: { flex: 1 },
  trendCategory: { fontSize: 13, marginBottom: 2 },
  trendName: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  trendCount: { fontSize: 13 },
  dotsBtn: { padding: 8 },

  // Dots menu
  dotsMenu: {
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  dotsMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dotsMenuText: { fontSize: 15 },

  // Empty state
  emptyState: {
    paddingTop: 40,
    alignItems: "center",
  },
  emptyText: { fontSize: 15 },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  modalBox: {
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  modalInput: {
    fontSize: 16,
    paddingVertical: 6,
    borderBottomWidth: 2,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 24,
    marginTop: 4,
  },
  modalActionText: { fontSize: 16, fontWeight: "600" },

  addImageBtn: {
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
  },
  addImageBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  headerPreview: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    resizeMode: "cover",
  },
});
