import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

const WINDOW_HEIGHT = Dimensions.get("window").height;

export function GoldButton({
  label,
  onPress,
  icon,
  disabled,
  variant = "gold",
  size = "md",
  loading,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  variant?: "gold" | "purple" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}) {
  const colors = useColors();
  const bg =
    variant === "gold"
      ? colors.accent
      : variant === "purple"
      ? colors.primary
      : variant === "danger"
      ? colors.destructive
      : "transparent";
  const fg =
    variant === "gold"
      ? colors.accentForeground
      : variant === "outline"
      ? colors.accent
      : "#fff";
  const borderColor = variant === "outline" ? colors.accent : "transparent";
  const paddingV = size === "sm" ? 8 : size === "lg" ? 16 : 12;
  const fontSize = size === "sm" ? 13 : size === "lg" ? 17 : 15;

  return (
    <Pressable
      onPress={() => {
        if (!disabled && !loading) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderWidth: variant === "outline" ? 1.5 : 0,
          borderColor,
          borderRadius: 12,
          paddingVertical: paddingV,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: pressed || disabled ? 0.65 : 1,
        },
      ]}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          {icon}
          <Text
            style={{
              color: fg,
              fontFamily: "Inter_600SemiBold",
              fontSize,
              letterSpacing: 0.3,
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function FormInput({
  label,
  error,
  leftIcon,
  ...props
}: TextInputProps & { label?: string; error?: string; leftIcon?: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 14 }}>
      {label && (
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: 12,
            fontFamily: "Inter_500Medium",
            marginBottom: 6,
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.input,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: error ? colors.destructive : colors.border,
          paddingHorizontal: 14,
          gap: 10,
        }}
      >
        {leftIcon}
        <TextInput
          placeholderTextColor={colors.mutedForeground}
          style={{
            flex: 1,
            color: colors.foreground,
            fontFamily: "Inter_400Regular",
            fontSize: 15,
            paddingVertical: Platform.OS === "ios" ? 14 : 10,
          }}
          {...props}
        />
      </View>
      {error && (
        <Text
          style={{
            color: colors.destructive,
            fontSize: 12,
            marginTop: 4,
            fontFamily: "Inter_400Regular",
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

export function Badge({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "gold";
}) {
  const colors = useColors();
  const bg =
    variant === "success"
      ? "rgba(34,197,94,0.15)"
      : variant === "warning"
      ? "rgba(245,158,11,0.15)"
      : variant === "danger"
      ? "rgba(239,68,68,0.15)"
      : variant === "gold"
      ? "rgba(212,175,55,0.15)"
      : colors.muted;
  const fg =
    variant === "success"
      ? colors.success
      : variant === "warning"
      ? colors.warning
      : variant === "danger"
      ? colors.destructive
      : variant === "gold"
      ? colors.accent
      : colors.mutedForeground;

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          color: fg,
          fontSize: 11,
          fontFamily: "Inter_600SemiBold",
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: colors.muted,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Feather name={icon as keyof typeof Feather.glyphMap} size={28} color={colors.mutedForeground} />
      </View>
      <Text
        style={{
          color: colors.foreground,
          fontSize: 18,
          fontFamily: "Inter_600SemiBold",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: 14,
            fontFamily: "Inter_400Regular",
            textAlign: "center",
            lineHeight: 20,
            marginBottom: 24,
          }}
        >
          {subtitle}
        </Text>
      )}
      {action}
    </View>
  );
}

export function StatCard({
  label,
  value,
  subtext,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: string;
  accent?: boolean;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: accent ? colors.goldBorder : colors.cardBorder,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: accent
            ? "rgba(212,175,55,0.15)"
            : "rgba(107,63,160,0.2)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Feather
          name={icon as keyof typeof Feather.glyphMap}
          size={18}
          color={accent ? colors.accent : colors.primary}
        />
      </View>
      <Text
        style={{
          color: accent ? colors.accent : colors.foreground,
          fontSize: 22,
          fontFamily: "Inter_700Bold",
          marginBottom: 2,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          color: colors.mutedForeground,
          fontSize: 12,
          fontFamily: "Inter_500Medium",
        }}
      >
        {label}
      </Text>
      {subtext && (
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: 11,
            fontFamily: "Inter_400Regular",
            marginTop: 4,
          }}
        >
          {subtext}
        </Text>
      )}
    </View>
  );
}

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
        marginTop: 4,
      }}
    >
      <Text
        style={{
          color: colors.foreground,
          fontSize: 17,
          fontFamily: "Inter_700Bold",
          letterSpacing: 0.2,
        }}
      >
        {title}
      </Text>
      {action}
    </View>
  );
}

export function AppModal({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={{ flex: 1 }}>
          <Pressable
            style={[StyleSheet.absoluteFillObject, { backgroundColor: colors.overlay }]}
            onPress={onClose}
          />

          <View
            style={{
              flex: 1,
              backgroundColor: colors.card,
              paddingTop: 12,
              paddingBottom: Platform.OS === "ios" ? 34 : 20,
              width: "100%",
              overflow: "hidden",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                backgroundColor: colors.border,
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: 16,
              }}
            />

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: 18,
                  fontFamily: "Inter_700Bold",
                }}
              >
                {title}
              </Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View style={{ flex: 1, minHeight: 0 }}>{children}</View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Divider() {
  const colors = useColors();
  return (
    <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
  );
}

export function IconBtn({
  icon,
  onPress,
  color,
  size = 22,
}: {
  icon: string;
  onPress: () => void;
  color?: string;
  size?: number;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 6 })}
      hitSlop={8}
    >
      <Feather
        name={icon as keyof typeof Feather.glyphMap}
        size={size}
        color={color ?? colors.foreground}
      />
    </Pressable>
  );
}
