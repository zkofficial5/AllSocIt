import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
// Add import
import CharacterSwitcherScreen from "../screens/TweakNow/CharacterSwitcherScreen";

// Import screens
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import UniverseListScreen from "../screens/UniverseListScreen";
import CreateUniverseScreen from "../screens/CreateUniverseScreen";
import UniverseDashboardScreen from "../screens/UniverseDashboardScreen";

// Import TweakNow screens
import TweakNowHomeScreen from "../screens/TweakNow/TweakNowHomeScreen";
import CreateCharacterScreen from "../screens/TweakNow/CreateCharacterScreen";
import EditCharacterScreen from "../screens/TweakNow/EditCharacterScreen";
import CreateTweakScreen from "../screens/TweakNow/CreateTweakScreen";
import CharacterProfileScreen from "../screens/TweakNow/CharacterProfileScreen";

import TweetDetailScreen from "../screens/TweakNow/TweetDetailScreen";
import ReplyComposerScreen from "../screens/TweakNow/ReplyComposerScreen";
import EditTweakScreen from "../screens/TweakNow/EditTweakScreen";

import ReplyDetailScreen from "../screens/TweakNow/ReplyDetailScreen";

import QuoteCreationScreen from "../screens/TweakNow/QuoteCreationScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#15202B" },
        }}
      >
        {/* Auth Screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        {/* Universe Screens */}
        <Stack.Screen name="UniverseList" component={UniverseListScreen} />
        <Stack.Screen name="CreateUniverse" component={CreateUniverseScreen} />
        <Stack.Screen
          name="UniverseDashboard"
          component={UniverseDashboardScreen}
        />
        <Stack.Screen name="TweakNow" component={TweakNowHomeScreen} />
        <Stack.Screen
          name="CreateCharacter"
          component={CreateCharacterScreen}
        />
        <Stack.Screen name="EditCharacter" component={EditCharacterScreen} />
        <Stack.Screen name="CreateTweak" component={CreateTweakScreen} />
        <Stack.Screen
          name="CharacterProfile"
          component={CharacterProfileScreen}
        />
        <Stack.Screen
          name="CharacterSwitcher"
          component={CharacterSwitcherScreen}
        />
        <Stack.Screen name="EditTweak" component={EditTweakScreen} />
        <Stack.Screen name="TweetDetail" component={TweetDetailScreen} />
        <Stack.Screen name="ReplyDetail" component={ReplyDetailScreen} />
        <Stack.Screen name="ReplyComposer" component={ReplyComposerScreen} />
        <Stack.Screen name="QuoteCreation" component={QuoteCreationScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
