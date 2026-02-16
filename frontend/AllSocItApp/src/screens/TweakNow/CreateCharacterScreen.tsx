import React, { useState } from "react";
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
import * as ImagePicker from "expo-image-picker";
import { characterAPI } from "../../services/tweaknow";
import { useTheme } from "../../contexts/ThemeContext";

type RootStackParamList = {
  CreateCharacter: { universeId: number };
  TweakNow: { universeId: number };
};

type CreateCharacterScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "CreateCharacter">;
  route: RouteProp<RootStackParamList, "CreateCharacter">;
};

export default function CreateCharacterScreen({
  navigation,
  route,
}: CreateCharacterScreenProps) {
  const { universeId } = route.params;
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [proCategory, setProCategory] = useState("");
  const [officialMark, setOfficialMark] = useState<
    "Blue" | "Gold" | "Grey" | "None"
  >("None");
  const [isPrivate, setIsPrivate] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [displayFollowersCount, setDisplayFollowersCount] = useState("0"); // ADD
  const [displayFollowingCount, setDisplayFollowingCount] = useState("0"); // ADD

  const pickProfilePicture = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setProfilePicture(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const pickBannerImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setBannerImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !username.trim()) {
      Alert.alert("Error", "Name and username are required");
      return;
    }

    if (loading) return;

    setLoading(true);
    try {
      await characterAPI.create({
        universe_id: universeId,
        name: name.trim(),
        username: username.trim(),
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
        website: website.trim() || undefined,
        birth_date: birthDate.trim() || undefined,
        pro_category: proCategory.trim() || undefined,
        official_mark: officialMark,
        banner_image: bannerImage || undefined,
        display_followers_count: parseInt(displayFollowersCount) || 0,
        display_following_count: parseInt(displayFollowingCount) || 0,
        is_private: isPrivate,
        profile_picture: profilePicture || undefined,
      });

      setLoading(false);
      navigation.goBack();
    } catch (error: any) {
      setLoading(false);
      Alert.alert(
        "Error",
        error.response?.data?.detail || "Could not create character",
      );
    }
  };

  const renderOfficialMarkButton = (
    mark: "Blue" | "Gold" | "Grey" | "None",
    color: string,
    label: string,
  ) => (
    <TouchableOpacity
      style={[
        styles.markButton,
        officialMark === mark && styles.markButtonActive,
      ]}
      onPress={() => setOfficialMark(mark)}
    >
      <View style={[styles.markCircle, { backgroundColor: color }]} />
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Add user
        </Text>
        <TouchableOpacity onPress={handleCreate} disabled={loading}>
          <Text
            style={[
              styles.saveButton,
              { color: colors.primary },
              loading && styles.saveButtonDisabled,
            ]}
          >
            {loading ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <TouchableOpacity
          style={[styles.banner, { backgroundColor: colors.surface }]}
          onPress={pickBannerImage}
        >
          {bannerImage ? (
            <Image source={{ uri: bannerImage }} style={styles.bannerImage} />
          ) : (
            <Ionicons name="camera" size={32} color={colors.textSecondary} />
          )}
        </TouchableOpacity>

        {/* Profile Picture */}
        <View style={styles.profilePictureContainer}>
          <TouchableOpacity
            style={[
              styles.profilePicture,
              {
                backgroundColor: colors.surface,
                borderColor: colors.background,
              },
            ]}
            onPress={pickProfilePicture}
          >
            {profilePicture ? (
              <Image
                source={{ uri: profilePicture }}
                style={styles.profilePictureImage}
              />
            ) : (
              <Ionicons name="camera" size={32} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {/* Name */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Name
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderBottomColor: colors.primary },
              ]}
              placeholder="name"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {name.length}/50
            </Text>
          </View>

          {/* Username */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              User id
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderBottomColor: colors.primary },
              ]}
              placeholder="name"
              placeholderTextColor={colors.textSecondary}
              value={username}
              onChangeText={(text) => setUsername(text.replace(/\s/g, ""))}
              maxLength={15}
              autoCapitalize="none"
            />
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {username.length}/15
            </Text>
          </View>

          {/* Bio */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Bio
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { color: colors.text, borderBottomColor: colors.primary },
              ]}
              placeholder=""
              placeholderTextColor={colors.textSecondary}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              maxLength={160}
            />
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {bio.length}/160
            </Text>
          </View>

          {/* Location */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Location
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderBottomColor: colors.primary },
              ]}
              placeholder=""
              placeholderTextColor={colors.textSecondary}
              value={location}
              onChangeText={setLocation}
              maxLength={30}
            />
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {location.length}/15
            </Text>
          </View>

          {/* Website */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Website
            </Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderBottomColor: colors.primary },
              ]}
              placeholder=""
              placeholderTextColor={colors.textSecondary}
              value={website}
              onChangeText={setWebsite}
              maxLength={100}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {website.length}/100
            </Text>
          </View>

          {/* Birth Date */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Birth date
            </Text>
            <View style={styles.inputWithIcon}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderBottomColor: colors.primary,
                    flex: 1,
                  },
                ]}
                placeholder=""
                placeholderTextColor={colors.textSecondary}
                value={birthDate}
                onChangeText={setBirthDate}
                maxLength={10}
              />
              {birthDate.length > 0 && (
                <TouchableOpacity onPress={() => setBirthDate("")}>
                  <Ionicons
                    name="close"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Pro Category */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWithIcon}>
              <Ionicons
                name="briefcase-outline"
                size={20}
                color={colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderBottomColor: colors.primary,
                    flex: 1,
                  },
                ]}
                placeholder="Pro category"
                placeholderTextColor={colors.textSecondary}
                value={proCategory}
                onChangeText={setProCategory}
                maxLength={50}
              />
            </View>
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {proCategory.length}/50
            </Text>
          </View>

          {/* Follower & Following Counts */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Social Stats (Display Only)
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.label,
                    { color: colors.textSecondary, fontSize: 12 },
                  ]}
                >
                  Following
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, borderBottomColor: colors.primary },
                  ]}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  value={displayFollowingCount}
                  onChangeText={setDisplayFollowingCount}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.label,
                    { color: colors.textSecondary, fontSize: 12 },
                  ]}
                >
                  Followers
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, borderBottomColor: colors.primary },
                  ]}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  value={displayFollowersCount}
                  onChangeText={setDisplayFollowersCount}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>

          {/* Official Mark */}
          <View style={styles.checkboxSection}>
            <View style={styles.checkboxRow}>
              <View style={[styles.checkbox, { borderColor: colors.border }]} />
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                Official mark
              </Text>
            </View>
            <View style={styles.markContainer}>
              {renderOfficialMarkButton("None", colors.textSecondary, "None")}
              {renderOfficialMarkButton("Blue", "#1DA1F2", "Blue")}
              {renderOfficialMarkButton("Grey", "#8899A6", "Grey")}
              {renderOfficialMarkButton("Gold", "#FFD700", "Gold")}
            </View>
          </View>

          {/* Private Account */}
          <TouchableOpacity
            style={styles.checkboxSection}
            onPress={() => setIsPrivate(!isPrivate)}
          >
            <View style={styles.checkboxRow}>
              <View
                style={[
                  styles.checkbox,
                  { borderColor: colors.border },
                  isPrivate && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
              >
                {isPrivate && (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                )}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                Private account
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  saveButton: {
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  banner: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  profilePictureContainer: {
    paddingHorizontal: 16,
    marginTop: -40,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  profilePictureImage: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
  },
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    paddingVertical: 8,
    borderBottomWidth: 2,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputIcon: {
    marginTop: 8,
  },
  checkboxSection: {
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  markContainer: {
    flexDirection: "row",
    gap: 12,
    paddingLeft: 32,
  },
  markButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  markButtonActive: {
    borderColor: "#1DA1F2",
    borderWidth: 3,
  },
  markCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
