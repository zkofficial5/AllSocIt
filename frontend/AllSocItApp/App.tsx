import React from "react";
// import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "./src/contexts/ThemeContext";
import AppNavigator from "./src/navigation/AppNavigator";
// export default function App() {
//   return (
//     <ThemeProvider>
//       <StatusBar style="auto" />
//       <AppNavigator />
//     </ThemeProvider>
//   );
// }

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
