import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, isLoggedIn, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace("/(tabs)");
    }
  }, [isLoggedIn, isLoading]);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Por favor, insira suas credenciais.");
      return;
    }
    setError("");
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await login(username.trim(), password);
    setSubmitting(false);
    if (!success) {
      setError("Credenciais inválidas.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    }
  };

  return (
    <LinearGradient
      colors={["#0A0518", "#08060F", "#120830"]}
      locations={[0, 0.5, 1]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
              paddingBottom: insets.bottom + 24,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              alignItems: "center",
            }}
          >
            {/* Logo */}
            <View style={styles.logoWrap}>
              <LinearGradient
                colors={["#5B2D9E", "#3D1A6E"]}
                style={styles.logoGradient}
              >
                <Text style={styles.logoText}>EG</Text>
              </LinearGradient>
              <View style={styles.logoRing} />
            </View>

            <Text style={[styles.brand, { color: colors.foreground }]}>
              ELTON GARAGE
            </Text>
            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
              Gestão de Estética Automotiva
            </Text>

            <View
              style={[styles.accentLine, { backgroundColor: colors.accent }]}
            />
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={[
              styles.form,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={[styles.formTitle, { color: colors.foreground }]}>
              Entrar
            </Text>

            {/* Username */}
            <View style={{ marginBottom: 14 }}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                USUÁRIO
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: colors.input,
                    borderColor: error ? colors.destructive : colors.border,
                  },
                ]}
              >
                <Feather name="user" size={18} color={colors.mutedForeground} />
                <TextInput
                  value={username}
                  onChangeText={(t) => {
                    setUsername(t);
                    setError("");
                  }}
                  placeholder="Digite o usuário"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.textInput, { color: colors.foreground }]}
                />
              </View>
            </View>

            {/* Password */}
            <View style={{ marginBottom: 20 }}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                SENHA
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: colors.input,
                    borderColor: error ? colors.destructive : colors.border,
                  },
                ]}
              >
                <Feather name="lock" size={18} color={colors.mutedForeground} />
                <TextInput
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    setError("");
                  }}
                  placeholder="Digite a senha"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword}
                  style={[styles.textInput, { color: colors.foreground }]}
                />
                <Pressable
                  onPress={() => setShowPassword((s) => !s)}
                  hitSlop={8}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              </View>
            </View>

            {error ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {error}
              </Text>
            ) : null}

            {/* Login Button */}
            <Pressable
              onPress={handleLogin}
              disabled={submitting}
              style={({ pressed }) => [
                styles.loginBtn,
                { opacity: pressed || submitting ? 0.8 : 1 },
              ]}
            >
              <LinearGradient
                colors={["#D4AF37", "#A8882A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginGradient}
              >
                {submitting ? (
                  <Text style={styles.loginBtnText}>Entrando...</Text>
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>Entrar</Text>
                    <Feather name="arrow-right" size={18} color="#08060F" />
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <Text
              style={[styles.hint, { color: colors.mutedForeground }]}
            >
              Dica: Nome e senha
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoWrap: {
    width: 100,
    height: 100,
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  logoGradient: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6B3FA0",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  logoRing: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "rgba(212,175,55,0.3)",
  },
  logoText: {
    color: "#D4AF37",
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  brand: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: 4,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
    marginBottom: 24,
  },
  accentLine: {
    width: 40,
    height: 2,
    borderRadius: 1,
    marginBottom: 40,
  },
  form: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  formTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
  },
  loginBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
  },
  loginGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  loginBtnText: {
    color: "#08060F",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
    textAlign: "center",
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
