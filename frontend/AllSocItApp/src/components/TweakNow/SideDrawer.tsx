import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import CharacterAvatar from "./CharacterAvatar";
import { TweakNowCharacter } from "../../types/tweaknow";

interface SideDrawerProps {
  currentCharacter: TweakNowCharacter | null;
  onClose: () => void;
  onProfile: () => void;
  onAddUser: () => void;
  onSwitchUser: () => void;
  onBackToAssets: () => void;
  onThemeChange: () => void;
}

export default function SideDrawer({
  currentCharacter,
  onClose,
  onProfile,
  onAddUser,
  onSwitchUser,
  onBackToAssets,
  onThemeChange,
}: SideDrawerProps) {
  const { colors } = useTheme();

  const MenuItem = ({
    icon,
    label,
    onPress,
  }: {
    icon: string;
    label: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Ionicons
        name={icon as any}
        size={22}
        color={colors.text}
        style={styles.menuIcon}
      />
      <Text style={[styles.menuText, { color: colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        {/* Profile Section */}
        {currentCharacter && (
          <View style={styles.profileSection}>
            <CharacterAvatar
              name={currentCharacter.name}
              username={currentCharacter.username}
              profilePicture={currentCharacter.profile_picture}
              size={48}
            />
            <View style={styles.nameSection}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: colors.text }]}>
                  {currentCharacter.name}
                </Text>
                {currentCharacter.is_private && (
                  <Ionicons
                    name="lock-closed"
                    size={14}
                    color={colors.textSecondary}
                  />
                )}
              </View>
              <Text style={[styles.username, { color: colors.textSecondary }]}>
                @{currentCharacter.username}
              </Text>
            </View>
            <View style={styles.stats}>
              <Text style={[styles.stat, { color: colors.textSecondary }]}>
                <Text style={[styles.statNumber, { color: colors.text }]}>
                  0
                </Text>{" "}
                Following
              </Text>
              <Text style={[styles.stat, { color: colors.textSecondary }]}>
                <Text style={[styles.statNumber, { color: colors.text }]}>
                  0
                </Text>{" "}
                Followers
              </Text>
            </View>
          </View>
        )}

        {/* Menu Items */}
        <View style={[styles.menu, { borderTopColor: colors.border }]}>
          <MenuItem icon="person-outline" label="Profile" onPress={onProfile} />
          <MenuItem
            icon="person-add-outline"
            label="Add user"
            onPress={onAddUser}
          />
          <MenuItem
            icon="repeat-outline"
            label="Switch user"
            onPress={onSwitchUser}
          />
          <MenuItem
            icon="bookmark-outline"
            label="Bookmarks"
            onPress={() => {}}
          />
          <MenuItem icon="list-outline" label="Lists" onPress={() => {}} />
          <MenuItem
            icon="arrow-back-outline"
            label="Back to Assets"
            onPress={onBackToAssets}
          />
          <MenuItem
            icon="settings-outline"
            label="Settings"
            onPress={() => {}}
          />
        </View>

        {/* Theme Toggle */}
        <TouchableOpacity style={styles.themeToggle} onPress={onThemeChange}>
          <Ionicons name="bulb-outline" size={28} color={colors.text} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: 280,
  },
  profileSection: {
    padding: 16,
    paddingTop: 48,
  },
  nameSection: {
    marginTop: 12,
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
  stats: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
  },
  stat: {
    fontSize: 13,
  },
  statNumber: {
    fontWeight: "bold",
  },
  menu: {
    borderTopWidth: 1,
    paddingTop: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingLeft: 16,
  },
  menuIcon: {
    width: 28,
  },
  menuText: {
    fontSize: 18,
    marginLeft: 12,
  },
  themeToggle: {
    padding: 16,
    paddingLeft: 18,
  },
});
