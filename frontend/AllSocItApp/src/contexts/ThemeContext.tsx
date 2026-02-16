import React, { createContext, useContext, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "darkBlue";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colors: {
    background: string;
    surface: string;
    border: string;
    text: string;
    textSecondary: string;
    primary: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const lightTheme = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  border: "#E1E8ED",
  text: "#0F1419",
  textSecondary: "#536471",
  primary: "#1DA1F2",
};

const darkTheme = {
  background: "#000000",
  surface: "#16181C",
  border: "#2F3336",
  text: "#E7E9EA",
  textSecondary: "#71767B",
  primary: "#1DA1F2",
};

const darkBlueTheme = {
  background: "#15202B",
  surface: "#192734",
  border: "#38444d",
  text: "#FFFFFF",
  textSecondary: "#8899A6",
  primary: "#1DA1F2",
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light"); // Default to light

  const colors =
    theme === "light"
      ? lightTheme
      : theme === "dark"
        ? darkTheme
        : darkBlueTheme;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
