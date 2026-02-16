import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { universeAPI } from "../services/api";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { Ionicons } from "@expo/vector-icons";

type CreateUniverseScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, "CreateUniverse">;
};

export default function CreateUniverseScreen({
  navigation,
}: CreateUniverseScreenProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || loading) {
      return;
    }

    setLoading(true);
    try {
      const universe = await universeAPI.create(
        name.trim(),
        description.trim() || undefined,
      );

      // Reset state
      setLoading(false);
      setName("");
      setDescription("");

      // Navigate directly without Alert
      navigation.navigate("UniverseList");

      // Small delay to ensure list updates
      setTimeout(() => {
        navigation.navigate("UniverseDashboard", {
          universeId: universe.id,
          universeName: universe.name,
        });
      }, 200);
    } catch (error: any) {
      setLoading(false);
      console.error("Create universe error:", error.response?.data);
      Alert.alert(
        "Error",
        error.response?.data?.detail || "Could not create universe",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Universe</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="planet-outline" size={64} color="#1DA1F2" />
        </View>

        <Text style={styles.label}>Universe Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Time Travel AU"
          placeholderTextColor="#657786"
          value={name}
          onChangeText={setName}
          maxLength={50}
        />
        <Text style={styles.charCount}>{name.length}/50</Text>

        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="What's this universe about?"
          placeholderTextColor="#657786"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          maxLength={200}
        />
        <Text style={styles.charCount}>{description.length}/200</Text>

        <TouchableOpacity
          style={[
            styles.button,
            (loading || !name.trim()) && styles.buttonDisabled,
          ]}
          onPress={handleCreate}
          disabled={loading || !name.trim()}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>
            {loading ? "Creating..." : "Create Universe"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    padding: 24,
  },
  iconContainer: {
    alignItems: "center",
    marginVertical: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#192734",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#38444d",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "#657786",
    textAlign: "right",
    marginTop: 4,
  },
  button: {
    backgroundColor: "#1DA1F2",
    borderRadius: 25,
    padding: 16,
    alignItems: "center",
    marginTop: 32,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
