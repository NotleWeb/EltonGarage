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
  Badge,
  EmptyState,
  FormInput,
  GoldButton,
} from "@/components/shared";
import { InventoryItem, InventoryUnit, useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

const UNITS: InventoryUnit[] = ["L", "ml", "un"];

const EMPTY_FORM = {
  name: "",
  price: "",
  quantity: "",
  unit: "un" as InventoryUnit,
  minStock: "",
};

export default function EstoqueScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useData();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [adjustId, setAdjustId] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState<"in" | "out">("in");

  const filtered = inventory.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const lowCount = inventory.filter((i) => i.quantity < i.minStock).length;

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      price: String(item.price),
      quantity: String(item.quantity),
      unit: item.unit,
      minStock: String(item.minStock),
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nome é obrigatório";
    if (!form.quantity.trim() || isNaN(Number(form.quantity)))
      e.quantity = "Quantidade válida obrigatória";
    if (!form.minStock.trim() || isNaN(Number(form.minStock)))
      e.minStock = "Mínimo válido obrigatório";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const data = {
      name: form.name.trim(),
      price: parseFloat(form.price) || 0,
      quantity: parseFloat(form.quantity),
      unit: form.unit,
      minStock: parseFloat(form.minStock),
    };
    if (editId) {
      updateInventoryItem(editId, data);
    } else {
      addInventoryItem(data);
    }
    setModalOpen(false);
  };

  const handleDelete = (item: InventoryItem) => {
    Alert.alert("Excluir Item", `Remover "${item.name}" do estoque?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => deleteInventoryItem(item.id),
      },
    ]);
  };

  const handleAdjust = () => {
    if (!adjustId || !adjustQty) return;
    const qty = parseFloat(adjustQty);
    if (isNaN(qty) || qty <= 0) return;
    const item = inventory.find((i) => i.id === adjustId);
    if (!item) return;
    const newQty =
      adjustType === "in"
        ? item.quantity + qty
        : Math.max(0, item.quantity - qty);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateInventoryItem(adjustId, { quantity: newQty });
    setAdjustId(null);
    setAdjustQty("");
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
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Estoque
          </Text>
          {lowCount > 0 && (
            <Text style={{ color: colors.warning, fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 }}>
              {lowCount} item{lowCount > 1 ? "s" : ""} abaixo do mínimo
            </Text>
          )}
        </View>
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
          placeholder="Buscar estoque..."
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
        keyExtractor={(i) => i.id}
        scrollEnabled={!!filtered.length}
        contentContainerStyle={[
          styles.list,
          !filtered.length && { flex: 1 },
          { paddingBottom: 100 + (Platform.OS === "web" ? 34 : 0) },
        ]}
        ListEmptyComponent={
          <EmptyState
            icon="package"
            title={search ? "Sem resultados" : "Estoque vazio"}
            subtitle={
              search
                ? "Tente outra busca."
                : "Comece a registrar seus produtos."
            }
            action={
              !search ? (
                <GoldButton label="Adicionar Item" onPress={openAdd} />
              ) : undefined
            }
          />
        }
        renderItem={({ item }) => {
          const isLow = item.quantity < item.minStock;
          return (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: isLow
                    ? "rgba(245,158,11,0.3)"
                    : colors.cardBorder,
                },
              ]}
            >
              <View
                style={[
                  styles.itemIcon,
                  {
                    backgroundColor: isLow
                      ? "rgba(245,158,11,0.12)"
                      : "rgba(107,63,160,0.15)",
                  },
                ]}
              >
                <Feather
                  name="package"
                  size={20}
                  color={isLow ? colors.warning : colors.primary}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={[styles.itemName, { color: colors.foreground }]}>
                    {item.name}
                  </Text>
                  {isLow && <Badge label="Estoque Baixo" variant="warning" />}
                </View>
                <Text style={[styles.itemQty, { color: isLow ? colors.warning : colors.accent }]}>
                  {item.quantity} {item.unit}
                  <Text style={[styles.itemMin, { color: colors.mutedForeground }]}>
                    {" "}/ mín {item.minStock} {item.unit}
                  </Text>
                </Text>
                {item.price > 0 && (
                  <Text style={[styles.itemPrice, { color: colors.mutedForeground }]}>
                    R$ {item.price.toLocaleString("pt-BR")} por {item.unit}
                  </Text>
                )}
              </View>
              <View style={{ gap: 6 }}>
                <Pressable
                  onPress={() => {
                    setAdjustId(item.id);
                    setAdjustType("in");
                    setAdjustQty("");
                  }}
                  style={[styles.adjBtn, { backgroundColor: "rgba(34,197,94,0.12)" }]}
                  hitSlop={4}
                >
                  <Feather name="plus" size={14} color={colors.success} />
                </Pressable>
                <Pressable
                  onPress={() => {
                    setAdjustId(item.id);
                    setAdjustType("out");
                    setAdjustQty("");
                  }}
                  style={[styles.adjBtn, { backgroundColor: "rgba(239,68,68,0.12)" }]}
                  hitSlop={4}
                >
                  <Feather name="minus" size={14} color={colors.destructive} />
                </Pressable>
              </View>
              <View style={{ gap: 6, marginLeft: 2 }}>
                <Pressable
                  onPress={() => openEdit(item)}
                  style={styles.iconAction}
                  hitSlop={6}
                >
                  <Feather name="edit-2" size={15} color={colors.mutedForeground} />
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(item)}
                  style={styles.iconAction}
                  hitSlop={6}
                >
                  <Feather name="trash-2" size={15} color={colors.destructive} />
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      <AppModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? "Editar Item" : "Novo Item"}
      >
        <ScrollView
          style={{ paddingHorizontal: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FormInput
            label="Nome do Produto"
            value={form.name}
            onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
            placeholder="Cristalização Pro"
            error={errors.name}
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Quantidade"
                value={form.quantity}
                onChangeText={(t) => setForm((f) => ({ ...f, quantity: t }))}
                placeholder="100"
                keyboardType="decimal-pad"
                error={errors.quantity}
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormInput
                label="Estoque Mín."
                value={form.minStock}
                onChangeText={(t) => setForm((f) => ({ ...f, minStock: t }))}
                placeholder="50"
                keyboardType="decimal-pad"
                error={errors.minStock}
              />
            </View>
          </View>
          <View style={{ marginBottom: 14 }}>
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 11,
                fontFamily: "Inter_600SemiBold",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              UNIDADE
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {UNITS.map((u) => (
                <Pressable
                  key={u}
                  onPress={() => setForm((f) => ({ ...f, unit: u }))}
                  style={[
                    styles.unitBtn,
                    {
                      backgroundColor:
                        form.unit === u ? colors.primary : colors.muted,
                      borderColor:
                        form.unit === u ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: form.unit === u ? "#fff" : colors.mutedForeground,
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 14,
                    }}
                  >
                    {u}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <FormInput
            label="Preço Unitário (R$)"
            value={form.price}
            onChangeText={(t) => setForm((f) => ({ ...f, price: t }))}
            placeholder="45.00"
            keyboardType="decimal-pad"
          />
          <GoldButton
            label={editId ? "Salvar Alterações" : "Adicionar Item"}
            onPress={handleSave}
          />
          <View style={{ height: 20 }} />
        </ScrollView>
      </AppModal>

      <AppModal
        visible={!!adjustId}
        onClose={() => setAdjustId(null)}
        title={adjustType === "in" ? "Entrada de Estoque" : "Saída de Estoque"}
      >
        <View style={{ paddingHorizontal: 20 }}>
          {adjustId && (
            <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 14, marginBottom: 16 }}>
              {inventory.find((i) => i.id === adjustId)?.name}
            </Text>
          )}
          <FormInput
            label="Quantidade"
            value={adjustQty}
            onChangeText={setAdjustQty}
            placeholder="0"
            keyboardType="decimal-pad"
          />
          <GoldButton
            label={adjustType === "in" ? "Adicionar ao Estoque" : "Remover do Estoque"}
            onPress={handleAdjust}
            variant={adjustType === "in" ? "gold" : "danger"}
          />
          <View style={{ height: 20 }} />
        </View>
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
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  itemQty: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  itemMin: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  itemPrice: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  adjBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  iconAction: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  unitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
});
