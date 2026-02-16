import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import { Ionicons } from "@expo/vector-icons";

type UniverseDashboardScreenProps = {
  navigation: NativeStackNavigationProp<
    RootStackParamList,
    "UniverseDashboard"
  >;
  route: RouteProp<RootStackParamList, "UniverseDashboard">;
};

export default function UniverseDashboardScreen({
  navigation,
  route,
}: UniverseDashboardScreenProps) {
  const { universeId, universeName } = route.params;

  const handleModulePress = (moduleName: string) => {
    if (moduleName === "TweakNow") {
      navigation.navigate("TweakNow", { universeId });
    } else {
      Alert.alert("Coming Soon", `${moduleName} module is under development`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{universeName}</Text>
          <Text style={styles.headerSubtitle}>Choose a module</Text>
        </View>
        <TouchableOpacity
          onPress={() => Alert.alert("Settings", "Coming soon")}
        >
          <Ionicons name="settings-outline" size={24} color="#1DA1F2" />
        </TouchableOpacity>
      </View>

      {/* Module Cards */}
      <View style={styles.modulesContainer}>
        {/* TweakNow Module */}
        <TouchableOpacity
          style={styles.moduleCard}
          onPress={() => handleModulePress("TweakNow")}
        >
          <View style={[styles.moduleIcon, { backgroundColor: "#1DA1F220" }]}>
            <Ionicons name="logo-twitter" size={48} color="#1DA1F2" />
          </View>
          <Text style={styles.moduleName}>TweakNow</Text>
          <Text style={styles.moduleDescription}>Create Twitter/X posts</Text>
        </TouchableOpacity>

        {/* iTextz Module */}
        <TouchableOpacity
          style={styles.moduleCard}
          onPress={() => handleModulePress("iTextz")}
        >
          <View style={[styles.moduleIcon, { backgroundColor: "#34C75920" }]}>
            <Ionicons name="chatbubbles" size={48} color="#34C759" />
          </View>
          <Text style={styles.moduleName}>iTextz</Text>
          <Text style={styles.moduleDescription}>Create iMessage chats</Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Soon</Text>
          </View>
        </TouchableOpacity>

        {/* WriteNow Module */}
        <TouchableOpacity
          style={styles.moduleCard}
          onPress={() => handleModulePress("WriteNow")}
        >
          <View style={[styles.moduleIcon, { backgroundColor: "#FF9F0A20" }]}>
            <Ionicons name="document-text" size={48} color="#FF9F0A" />
          </View>
          <Text style={styles.moduleName}>WriteNow</Text>
          <Text style={styles.moduleDescription}>Write your stories</Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Soon</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
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
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#8899A6",
    marginTop: 2,
  },
  modulesContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 20,
  },
  moduleCard: {
    backgroundColor: "#192734",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#38444d",
  },
  moduleIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  moduleName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  moduleDescription: {
    fontSize: 14,
    color: "#8899A6",
    textAlign: "center",
  },
  comingSoonBadge: {
    backgroundColor: "#657786",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
