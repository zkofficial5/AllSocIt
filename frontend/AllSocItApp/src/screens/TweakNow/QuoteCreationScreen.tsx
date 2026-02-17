import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { characterAPI, tweakAPI } from "../../services/tweaknow";
import { TweakNowCharacter, Tweak } from "../../types/tweaknow";
import CharacterAvatar from "../../components/TweakNow/CharacterAvatar";
import { useTheme } from "../../contexts/ThemeContext";

type RootStackParamList = {
  QuoteCreation: {
    universeId: number;
    quotedTweakId: number;
    quotedTweak: Tweak;
    quotedCharacter: TweakNowCharacter;
  };
  CharacterSwitcher: {
    universeId: number;
    currentCharacterId?: number;
    onSelect: (character: TweakNowCharacter) => void;
  };
};

type QuoteCreationScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "QuoteCreation">;
  route: RouteProp<RootStackParamList, "QuoteCreation">;
};

export default function QuoteCreationScreen({
  navigation,
  route,
}: QuoteCreationScreenProps) {
  const { universeId, quotedTweakId, quotedTweak, quotedCharacter } =
    route.params;
  const { colors } = useTheme();
  const [characters, setCharacters] = useState<TweakNowCharacter[]>([]);
  const [selectedCharacter, setSelectedCharacter] =
    useState<TweakNowCharacter | null>(null);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [commentCount, setCommentCount] = useState("0");
  const [retweetCount, setRetweetCount] = useState("0");
  const [quoteCount, setQuoteCount] = useState("0");
  const [likeCount, setLikeCount] = useState("0");
  const [viewCount, setViewCount] = useState("0");
  const [sourceLabel, setSourceLabel] = useState("Twitter for iPhone");
  const [customDate, setCustomDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const chars = await characterAPI.getAll(universeId);
      setCharacters(chars);
      if (chars.length > 0) setSelectedCharacter(chars[0]);
    } catch (error) {
      Alert.alert("Error", "Could not load characters");
      navigation.goBack();
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setCustomDate(selectedDate);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(customDate);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setCustomDate(newDate);
    }
  };

  const handleAddImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      base64: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets) {
      const newImages = result.assets
        .filter((a) => a.base64)
        .map((a) => `data:image/jpeg;base64,${a.base64}`);
      setImages((prev) => [...prev, ...newImages].slice(0, 4));
    }
  };

  const handlePost = async () => {
    if (!selectedCharacter) {
      Alert.alert("Error", "Please select a character");
      return;
    }
    if (!content.trim() && images.length === 0) {
      Alert.alert("Error", "Please add some content");
      return;
    }
    setLoading(true);
    try {
      await tweakAPI.create({
        universe_id: universeId,
        character_id: selectedCharacter.id,
        content: content.trim(),
        images: images.length > 0 ? images : undefined,
        comment_count: parseInt(commentCount) || 0,
        retweet_count: parseInt(retweetCount) || 0,
        quote_count: parseInt(quoteCount) || 0,
        like_count: parseInt(likeCount) || 0,
        view_count: parseInt(viewCount) || 0,
        source_label: sourceLabel,
        custom_date: customDate.toISOString(),
        quoted_tweak_id: quotedTweakId,
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Could not post quote tweet");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const formatQuoteDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Quote Tweet
        </Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={loading || (!content.trim() && images.length === 0)}
        >
          <View
            style={[
              styles.postButton,
              { backgroundColor: colors.primary },
              ((!content.trim() && images.length === 0) || loading) &&
                styles.postButtonDisabled,
            ]}
          >
            <Text style={styles.postButtonText}>
              {loading ? "Posting..." : "Post"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Compose Area - avatar + text input side by side */}
        <View style={styles.composeRow}>
          {/* Character avatar on left */}
          {selectedCharacter && (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("CharacterSwitcher", {
                  universeId,
                  currentCharacterId: selectedCharacter?.id,
                  onSelect: (character) => setSelectedCharacter(character),
                });
              }}
            >
              <CharacterAvatar
                name={selectedCharacter.name}
                username={selectedCharacter.username}
                profilePicture={selectedCharacter.profile_picture}
                size={44}
              />
            </TouchableOpacity>
          )}

          {/* Text input + quoted tweet on right */}
          <View style={styles.composeRight}>
            {/* Selected character name */}
            {selectedCharacter && (
              <Text
                style={[styles.composingAs, { color: colors.textSecondary }]}
              >
                Posting as{" "}
                <Text style={{ color: colors.primary, fontWeight: "bold" }}>
                  @{selectedCharacter.username}
                </Text>
              </Text>
            )}

            <TextInput
              style={[styles.contentInput, { color: colors.text }]}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textSecondary}
              value={content}
              onChangeText={setContent}
              multiline
              autoFocus
              maxLength={280}
            />
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {content.length}/280
            </Text>

            {/* Images Preview */}
            {images.length > 0 && (
              <View style={styles.imageGrid}>
                {images.map((uri, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImage}
                      onPress={() =>
                        setImages(images.filter((_, i) => i !== index))
                      }
                    >
                      <Ionicons name="close-circle" size={22} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Quoted Tweet Preview Box */}
            <View
              style={[
                styles.quotedTweetContainer,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <View style={styles.quotedHeader}>
                <CharacterAvatar
                  name={quotedCharacter.name}
                  username={quotedCharacter.username}
                  profilePicture={quotedCharacter.profile_picture}
                  size={18}
                />
                <Text
                  style={[styles.quotedName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {quotedCharacter.name}
                </Text>
                <Text
                  style={[
                    styles.quotedUsername,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  @{quotedCharacter.username}
                </Text>
                <Text
                  style={[styles.quotedDot, { color: colors.textSecondary }]}
                >
                  ·
                </Text>
                <Text
                  style={[styles.quotedDate, { color: colors.textSecondary }]}
                >
                  {formatQuoteDate(
                    quotedTweak.custom_date || quotedTweak.created_at,
                  )}
                </Text>
              </View>
              <Text
                style={[styles.quotedContent, { color: colors.text }]}
                numberOfLines={3}
              >
                {quotedTweak.content}
              </Text>
              {quotedTweak.images && quotedTweak.images.length > 0 && (
                <Image
                  source={{ uri: quotedTweak.images[0] }}
                  style={styles.quotedImage}
                  resizeMode="cover"
                />
              )}
            </View>
          </View>
        </View>

        {/* Add Image Button */}
        <TouchableOpacity
          style={[styles.addImageButton, { borderColor: colors.primary }]}
          onPress={handleAddImage}
        >
          <Ionicons name="image-outline" size={20} color={colors.primary} />
          <Text style={[styles.addImageText, { color: colors.primary }]}>
            Add Image
          </Text>
        </TouchableOpacity>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Date & Time
          </Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={[styles.dateTimeText, { color: colors.text }]}>
                {formatDate(customDate)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={[styles.dateTimeText, { color: colors.text }]}>
                {formatTime(customDate)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={customDate}
            mode="date"
            onChange={handleDateChange}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={customDate}
            mode="time"
            onChange={handleTimeChange}
          />
        )}

        {/* Engagement Metrics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Engagement Metrics
          </Text>
          <View style={styles.metricsGrid}>
            {[
              {
                label: "Comments",
                value: commentCount,
                setter: setCommentCount,
              },
              {
                label: "Retweets",
                value: retweetCount,
                setter: setRetweetCount,
              },
              { label: "Quotes", value: quoteCount, setter: setQuoteCount },
              { label: "Likes", value: likeCount, setter: setLikeCount },
              { label: "Views", value: viewCount, setter: setViewCount },
            ].map(({ label, value, setter }) => (
              <View key={label} style={styles.metricItem}>
                <Text
                  style={[styles.metricLabel, { color: colors.textSecondary }]}
                >
                  {label}
                </Text>
                <TextInput
                  style={[
                    styles.metricInput,
                    { color: colors.text, borderBottomColor: colors.primary },
                  ]}
                  value={value}
                  onChangeText={setter}
                  keyboardType="number-pad"
                />
              </View>
            ))}
          </View>
        </View>

        {/* Source Label */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Source
          </Text>
          <TextInput
            style={[
              styles.sourceInput,
              { color: colors.text, borderBottomColor: colors.primary },
            ]}
            value={sourceLabel}
            onChangeText={setSourceLabel}
            placeholder="Twitter for iPhone"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  postButton: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  postButtonDisabled: { opacity: 0.5 },
  postButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  scrollContent: { flex: 1, padding: 16 },
  composeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  composeRight: { flex: 1 },
  composingAs: { fontSize: 13, marginBottom: 6 },
  contentInput: { fontSize: 17, minHeight: 60 },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
    marginBottom: 8,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  imageContainer: { position: "relative" },
  imagePreview: { width: 80, height: 80, borderRadius: 8 },
  removeImage: { position: "absolute", top: 2, right: 2 },
  quotedTweetContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginTop: 4,
  },
  quotedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  quotedName: { fontWeight: "bold", fontSize: 13 },
  quotedUsername: { fontSize: 12 },
  quotedDot: { fontSize: 12 },
  quotedDate: { fontSize: 12 },
  quotedContent: { fontSize: 13, lineHeight: 18 },
  quotedImage: { width: "100%", height: 100, borderRadius: 8, marginTop: 6 },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: "dashed",
    justifyContent: "center",
    marginBottom: 16,
  },
  addImageText: { fontSize: 14 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  dateTimeRow: { flexDirection: "row", gap: 12 },
  dateTimeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  dateTimeText: { fontSize: 15 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  metricItem: { width: "45%" },
  metricLabel: { fontSize: 13, marginBottom: 4 },
  metricInput: { fontSize: 16, borderBottomWidth: 1, paddingBottom: 4 },
  sourceInput: { fontSize: 16, borderBottomWidth: 1, paddingBottom: 8 },
});
