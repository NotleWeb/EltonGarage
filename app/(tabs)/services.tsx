import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AppModal,
  EmptyState,
  FormInput,
  GoldButton,
} from "@/components/shared";
import { Service, useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

const EMPTY_SERVICE = {
  name: "",
  description: "",
  price: "",
  duration: "",
};

function formatDuration(min: number) {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

export default function ServicosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { services, addService, updateService, deleteService } = useData();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_SERVICE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_SERVICE);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditId(s.id);
    setForm({
      name: s.name,
      description: s.description,
      price: String(s.price),
      duration: String(s.duration),
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nome é obrigatório";
    if (!form.price.trim() || isNaN(Number(form.price)))
      e.price = "Preço válido obrigatório";
    if (!form.duration.trim() || isNaN(Number(form.duration)))
      e.duration = "Duração válida em minutos obrigatória";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseFloat(form.price),
      duration: parseInt(form.duration),
    };
    if (editId) {
      updateService(editId, data);
    } else {
      addService(data);
    }
    setModalOpen(false);
  };

  const handleDelete = (s: Service) => {
    Alert.alert("Excluir Serviço", `Remover "${s.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteService(s.id);
        },
      },
    ]);
  };

  const topInsets = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: topInsets + 12,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Serviços
        </Text>
        <Pressable
          onPress={openAdd}
          style={[styles.addBtn, { backgroundColor: colors.accent }]}
        >
          <Feather name="plus" size={20} color={colors.accentForeground} />
        </Pressable>
      </View>

      <View
        style={[
          styles.searchWrap,
          { backgroundColor: colors.input, borderColor: colors.border },
        ]}
      >
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar serviços..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
        />
        {search ? (
          <Pressable onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(s) => s.id}
        scrollEnabled={!!filtered.length}
        contentContainerStyle={[
          styles.list,
          !filtered.length && { flex: 1 },
          { paddingBottom: 100 + (Platform.OS === "web" ? 34 : 0) },
        ]}
        ListEmptyComponent={
          <EmptyState
            icon="tool"
            title={search ? "Sem resultados" : "Nenhum serviço"}
            subtitle={
              search
                ? "Tente outro termo de busca."
                : "Adicione seu primeiro serviço de detalhamento."
            }
            action={
              !search ? (
                <GoldButton label="Adicionar Serviço" onPress={openAdd} />
              ) : undefined
            }
          />
        }
        renderItem={({ item: s }) => (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.serviceIcon,
                { backgroundColor: "rgba(212,175,55,0.12)" },
              ]}
            >
              <Feather name="star" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.serviceName, { color: colors.foreground }]}>
                {s.name}
              </Text>
              {s.description ? (
                <Text
                  style={[
                    styles.serviceDesc,
                    { color: colors.mutedForeground },
                  ]}
                  numberOfLines={2}
                >
                  {s.description}
                </Text>
              ) : null}
              <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Feather name="tag" size={12} color={colors.accent} />
                  <Text
                    style={{
                      color: colors.accent,
                      fontFamily: "Inter_700Bold",
                      fontSize: 14,
                    }}
                  >
                    R$ {s.price.toLocaleString("pt-BR")}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Feather name="clock" size={12} color={colors.mutedForeground} />
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontFamily: "Inter_400Regular",
                      fontSize: 13,
                    }}
                  >
                    {formatDuration(s.duration)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 4 }}>
              <Pressable
                onPress={() => openEdit(s)}
                style={styles.iconAction}
                hitSlop={6}
              >
                <Feather name="edit-2" size={16} color={colors.mutedForeground} />
              </Pressable>
              <Pressable
                onPress={() => handleDelete(s)}
                style={styles.iconAction}
                hitSlop={6}
              >
                <Feather name="trash-2" size={16} color={colors.destructive} />
              </Pressable>
            </View>
          </View>
        )}
      />

      <AppModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? "Editar Serviço" : "Novo Serviço"}
      >
        <ScrollView
          style={{ paddingHorizontal: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FormInput
            label="Nome do Serviço"
            value={form.name}
            onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
            placeholder="Polimento com Cristalização"
            error={errors.name}
          />
          <FormInput
            label="Descrição"
            value={form.description}
            onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
            placeholder="Polimento completo com aplicação de cerâmica..."
            multiline
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Preço (R$)"
                value={form.price}
                onChangeText={(t) => setForm((f) => ({ ...f, price: t }))}
                placeholder="250"
                keyboardType="decimal-pad"
                error={errors.price}
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Duração (min)"
                value={form.duration}
                onChangeText={(t) => setForm((f) => ({ ...f, duration: t }))}
                placeholder="90"
                keyboardType="numeric"
                error={errors.duration}
              />
            </View>
          </View>
          <GoldButton
            label={editId ? "Salvar Alterações" : "Adicionar Serviço"}
            onPress={handleSave}
          />
          <View style={{ height: 20 }} />
        </ScrollView>
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
  },
  list: {
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  serviceDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  iconAction: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
