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
  Modal,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { characterAPI, tweakAPI, templateAPI } from "../../services/tweaknow";
import { TweakNowCharacter } from "../../types/tweaknow";
import CharacterAvatar from "../../components/TweakNow/CharacterAvatar";
import { useTheme } from "../../contexts/ThemeContext";

type RootStackParamList = {
  ReplyComposer: {
    universeId: number;
    replyToTweakId: number;
    replyToCharacter: TweakNowCharacter;
  };
  TweetDetail: { universeId: number; tweakId: number };
  CharacterSwitcher: {
    universeId: number;
    currentCharacterId?: number;
    onSelect: (character: TweakNowCharacter) => void;
  };
};

type ReplyComposerScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ReplyComposer">;
  route: RouteProp<RootStackParamList, "ReplyComposer">;
};

export default function ReplyComposerScreen({
  navigation,
  route,
}: ReplyComposerScreenProps) {
  const { universeId, replyToTweakId, replyToCharacter } = route.params;
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
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    loadCharacters();
    loadTemplates();
  }, []);

  const loadCharacters = async () => {
    try {
      const chars = await characterAPI.getAll(universeId);
      setCharacters(chars);
      if (chars.length > 0) {
        setSelectedCharacter(chars[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Could not load characters");
      navigation.goBack();
    }
  };

  const loadTemplates = async () => {
    try {
      const temps = await templateAPI.getAll();
      setTemplates(temps);
    } catch (error) {
      console.log("Could not load templates");
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setCustomDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(customDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setCustomDate(newDate);
    }
  };

  const formatDateTime = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
  };

  const pickImages = async () => {
    if (images.length >= 4) {
      Alert.alert("Limit Reached", "You can only attach up to 4 images");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets
        .slice(0, 4 - images.length)
        .map((asset) => `data:image/jpeg;base64,${asset.base64}`);
      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const saveAsTemplate = async () => {
    setShowSaveTemplateModal(true);
  };

  const confirmSaveTemplate = async () => {
    if (!templateName.trim()) {
      Alert.alert("Error", "Please enter a template name");
      return;
    }

    try {
      await templateAPI.create({
        name: templateName.trim(),
        comment_count: parseInt(commentCount) || 0,
        retweet_count: parseInt(retweetCount) || 0,
        quote_count: parseInt(quoteCount) || 0,
        like_count: parseInt(likeCount) || 0,
        view_count: parseInt(viewCount) || 0,
        source_label: sourceLabel,
      });
      Alert.alert("Success", "Template saved!");
      setTemplateName("");
      setShowSaveTemplateModal(false);
      loadTemplates();
    } catch (error) {
      Alert.alert("Error", "Could not save template");
    }
  };

  const loadTemplate = (template: any) => {
    setCommentCount(template.comment_count.toString());
    setRetweetCount(template.retweet_count.toString());
    setQuoteCount(template.quote_count.toString());
    setLikeCount(template.like_count.toString());
    setViewCount(template.view_count.toString());
    setSourceLabel(template.source_label);
    setShowTemplates(false);
    Alert.alert("Template Loaded", `"${template.name}" applied!`);
  };

  const deleteTemplate = async (id: number) => {
    try {
      await templateAPI.delete(id);
      setTemplates(templates.filter((t) => t.id !== id));
      Alert.alert("Success", "Template deleted");
    } catch (error) {
      Alert.alert("Error", "Could not delete template");
    }
  };

  const handleReply = async () => {
    if (!content.trim() && images.length === 0) {
      Alert.alert("Error", "Please add some content or images");
      return;
    }

    if (!selectedCharacter) {
      Alert.alert("Error", "Please select a character");
      return;
    }

    if (loading) return;

    setLoading(true);
    try {
      await tweakAPI.create({
        universe_id: universeId,
        character_id: selectedCharacter.id,
        content: content.trim(),
        images: images.length > 0 ? images : undefined,
        reply_to_tweak_id: replyToTweakId,
        comment_count: parseInt(commentCount) || 0,
        retweet_count: parseInt(retweetCount) || 0,
        quote_count: parseInt(quoteCount) || 0,
        like_count: parseInt(likeCount) || 0,
        view_count: parseInt(viewCount) || 0,
        source_label: sourceLabel.trim(),
        custom_date: customDate.toISOString(),
      });

      setLoading(false);
      navigation.goBack();
    } catch (error: any) {
      setLoading(false);
      Alert.alert(
        "Error",
        error.response?.data?.detail || "Could not post reply",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Reply</Text>
        <TouchableOpacity
          onPress={handleReply}
          disabled={loading || (!content.trim() && images.length === 0)}
        >
          <View
            style={[
              styles.replyButton,
              { backgroundColor: colors.primary },
              ((!content.trim() && images.length === 0) || loading) &&
                styles.replyButtonDisabled,
            ]}
          >
            <Text style={styles.replyButtonText}>
              {loading ? "Posting..." : "Reply"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Replying To */}
        <View style={styles.replyingTo}>
          <Text
            style={[styles.replyingToText, { color: colors.textSecondary }]}
          >
            Replying to{" "}
            <Text style={{ color: colors.primary }}>
              @{replyToCharacter.username}
            </Text>
          </Text>
        </View>

        {/* Character Switcher (the tacky one)
        <TouchableOpacity
          style={[
            styles.characterSelector,
            { backgroundColor: colors.surface },
          ]}
          onPress={() => {
            navigation.navigate("CharacterSwitcher", {
              universeId,
              currentCharacterId: selectedCharacter?.id,
              onSelect: (character) => {
                setSelectedCharacter(character);
              },
            });
          }}
        >
          {selectedCharacter && (
            <>
              <CharacterAvatar
                name={selectedCharacter.name}
                username={selectedCharacter.username}
                profilePicture={selectedCharacter.profile_picture}
                size={40}
              />
              <Text style={[styles.characterName, { color: colors.text }]}>
                {selectedCharacter.name}
              </Text>
            </>
          )}
          <Ionicons name="swap-horizontal" size={24} color={colors.primary} />
        </TouchableOpacity> */}

        {/* Character Selector */}
        {selectedCharacter && (
          <View style={styles.composerSection}>
            <TouchableOpacity
              style={{ alignItems: "center" }}
              onPress={() => {
                navigation.navigate("CharacterSwitcher", {
                  universeId,
                  currentCharacterId: selectedCharacter?.id,
                  onSelect: (character) => {
                    setSelectedCharacter(character);
                  },
                });
              }}
            >
              <CharacterAvatar
                name={selectedCharacter.name}
                username={selectedCharacter.username}
                profilePicture={selectedCharacter.profile_picture}
                size={48}
              />
              <Ionicons
                name="swap-horizontal"
                size={16}
                color={colors.primary}
                style={{ marginTop: 4 }}
              />
            </TouchableOpacity>

            <View style={styles.composerInput}>
              <TextInput
                style={[styles.contentInput, { color: colors.text }]}
                placeholder="Tweet your reply"
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
            </View>
          </View>
        )}

        {/* Image Upload Section */}
        <View style={styles.imageSection}>
          {images.length > 0 && (
            <View style={styles.imageGrid}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#E0245E" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {images.length < 4 && (
            <TouchableOpacity
              style={[styles.addImageButton, { borderColor: colors.primary }]}
              onPress={pickImages}
            >
              <Ionicons name="image-outline" size={24} color={colors.primary} />
              <Text style={[styles.addImageText, { color: colors.primary }]}>
                Add Image {images.length > 0 ? `(${images.length}/4)` : ""}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Date & Time Picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Date & Time
          </Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={[
                styles.dateTimeButton,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: colors.primary,
                },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.primary}
              />
              <Text style={[styles.dateTimeText, { color: colors.text }]}>
                {formatDateTime(customDate).split(" ")[0]}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.dateTimeButton,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: colors.primary,
                },
              ]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={[styles.dateTimeText, { color: colors.text }]}>
                {formatDateTime(customDate).split(" ").slice(1).join(" ")}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={customDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={customDate}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </View>

        {/* Templates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Templates
            </Text>
            <View style={styles.templateButtons}>
              <TouchableOpacity
                style={[
                  styles.templateButton,
                  { backgroundColor: colors.surface },
                ]}
                onPress={() => setShowTemplates(!showTemplates)}
              >
                <Ionicons
                  name="list-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={[styles.templateButtonText, { color: colors.primary }]}
                >
                  Load
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.templateButton,
                  { backgroundColor: colors.surface },
                ]}
                onPress={saveAsTemplate}
              >
                <Ionicons
                  name="save-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={[styles.templateButtonText, { color: colors.primary }]}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showTemplates && templates.length > 0 && (
            <View
              style={[styles.templateList, { backgroundColor: colors.surface }]}
            >
              {templates.map((template) => (
                <View
                  key={template.id}
                  style={[
                    styles.templateItem,
                    { borderBottomColor: colors.border },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.templateItemContent}
                    onPress={() => loadTemplate(template)}
                  >
                    <Text style={[styles.templateName, { color: colors.text }]}>
                      {template.name}
                    </Text>
                    <Text
                      style={[
                        styles.templateDetails,
                        { color: colors.textSecondary },
                      ]}
                    >
                      💬{template.comment_count} 🔄{template.retweet_count} ❤️
                      {template.like_count}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteTemplate(template.id)}>
                    <Ionicons name="trash-outline" size={20} color="#E0245E" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Engagement Counts */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Engagement Metrics
          </Text>

          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Comments
              </Text>
              <TextInput
                style={[
                  styles.numberInput,
                  {
                    backgroundColor: colors.surface,
                    borderBottomColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={commentCount}
                onChangeText={setCommentCount}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Retweets
              </Text>
              <TextInput
                style={[
                  styles.numberInput,
                  {
                    backgroundColor: colors.surface,
                    borderBottomColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={retweetCount}
                onChangeText={setRetweetCount}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Quotes
              </Text>
              <TextInput
                style={[
                  styles.numberInput,
                  {
                    backgroundColor: colors.surface,
                    borderBottomColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={quoteCount}
                onChangeText={setQuoteCount}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={[styles.inputLabel, { color: colors.textSecondary }]}
              >
                Likes
              </Text>
              <TextInput
                style={[
                  styles.numberInput,
                  {
                    backgroundColor: colors.surface,
                    borderBottomColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={likeCount}
                onChangeText={setLikeCount}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Views
            </Text>
            <TextInput
              style={[
                styles.numberInput,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={viewCount}
              onChangeText={setViewCount}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* Source Label */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Source
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
                color: colors.text,
              },
            ]}
            value={sourceLabel}
            onChangeText={setSourceLabel}
            placeholder="e.g., Twitter for iPhone"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Save Template Modal */}
      <Modal
        visible={showSaveTemplateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Save Template
            </Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder="Template name"
              placeholderTextColor={colors.textSecondary}
              value={templateName}
              onChangeText={setTemplateName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonCancel,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  setTemplateName("");
                  setShowSaveTemplateModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalButtonTextCancel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonSave,
                  { backgroundColor: colors.primary },
                ]}
                onPress={confirmSaveTemplate}
              >
                <Text style={styles.modalButtonTextSave}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  replyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  replyButtonDisabled: {
    opacity: 0.5,
  },
  replyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  replyingTo: {
    marginBottom: 16,
  },
  replyingToText: {
    fontSize: 14,
  },
  composerSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  composerInput: {
    flex: 1,
  },
  contentInput: {
    fontSize: 18,
    minHeight: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 8,
  },
  imageSection: {
    marginBottom: 16,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  imageContainer: {
    position: "relative",
    width: "48%",
    aspectRatio: 1,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#15202B",
    borderRadius: 12,
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 8,
  },
  addImageText: {
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  templateButtons: {
    flexDirection: "row",
    gap: 8,
  },
  templateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  templateButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  templateList: {
    borderRadius: 12,
    overflow: "hidden",
  },
  templateItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
  },
  templateItemContent: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  templateDetails: {
    fontSize: 14,
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderBottomWidth: 2,
    gap: 8,
  },
  dateTimeText: {
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  numberInput: {
    borderBottomWidth: 2,
    padding: 12,
    fontSize: 16,
  },
  input: {
    borderBottomWidth: 2,
    padding: 12,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modalInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonCancel: {
    borderWidth: 1,
  },
  modalButtonSave: {},
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  characterSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  characterName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginLeft: 12,
  },
});
