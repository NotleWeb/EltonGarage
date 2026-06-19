import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "@eg_data_v2";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppointmentStatus = "agendado" | "concluido" | "cancelado";
export type InventoryUnit = "L" | "ml" | "un";
export type PaymentMethod = "dinheiro" | "pix" | "debito" | "credito";
export type DiscountType = "fixo" | "porcentagem";

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: string;
  plate: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  vehicles: Vehicle[];
  createdAt: string;
  lastServiceDate?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  photoUri?: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  vehicleId: string;
  serviceIds: string[];
  date: string;
  time: string;
  notes: string;
  status: AppointmentStatus;
  createdAt: string;
  completedAt?: string;
  discountValue: number;
  discountType: DiscountType;
  paymentMethod?: PaymentMethod;
  totalValue: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: InventoryUnit;
  minStock: number;
}

export interface GalleryEntry {
  id: string;
  customerId: string;
  vehicleId: string;
  serviceId: string;
  beforeUri: string;
  afterUri: string;
  date: string;
  notes: string;
}

export interface AppNotification {
  id: string;
  type: "estoque" | "retorno_15" | "retorno_20" | "retorno_30" | "retorno_45" | "agendamento";
  message: string;
  date: string;
  read: boolean;
  customerId?: string;
  appointmentId?: string;
  itemId?: string;
}

// ─── Context interface ────────────────────────────────────────────────────────

interface AppData {
  customers: Customer[];
  services: Service[];
  appointments: Appointment[];
  inventory: InventoryItem[];
  gallery: GalleryEntry[];
  dismissedNotificationIds: string[];
  seeded: boolean;
}

interface DataContextType {
  customers: Customer[];
  services: Service[];
  appointments: Appointment[];
  inventory: InventoryItem[];
  gallery: GalleryEntry[];
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;

  addCustomer: (c: Omit<Customer, "id" | "createdAt">) => string;
  updateCustomer: (id: string, c: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  addService: (s: Omit<Service, "id">) => void;
  updateService: (id: string, s: Partial<Service>) => void;
  deleteService: (id: string) => void;

  addAppointment: (a: Omit<Appointment, "id" | "createdAt">) => void;
  updateAppointment: (id: string, a: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;

  addInventoryItem: (i: Omit<InventoryItem, "id">) => void;
  updateInventoryItem: (id: string, i: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;

  addGalleryEntry: (g: Omit<GalleryEntry, "id">) => void;
  deleteGalleryEntry: (id: string) => void;

  dismissNotification: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const DataContext = createContext<DataContextType>({} as DataContextType);

const genId = () =>
  Date.now().toString() + Math.random().toString(36).substr(2, 9);

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_DATA: AppData = {
  seeded: true,
  dismissedNotificationIds: [],
  customers: [
    {
      id: "c1",
      name: "Carlos Mendes",
      phone: "(11) 98765-4321",
      address: "Rua das Flores, 123 - São Paulo",
      vehicles: [
        { id: "v1", brand: "BMW", model: "Série 3", year: "2022", plate: "ABC-1234" },
      ],
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      lastServiceDate: new Date(Date.now() - 18 * 86400000).toISOString(),
    },
    {
      id: "c2",
      name: "Ana Souza",
      phone: "(11) 91234-5678",
      address: "Av. Paulista, 500 - São Paulo",
      vehicles: [
        { id: "v2", brand: "Audi", model: "A4", year: "2021", plate: "XYZ-9876" },
        { id: "v3", brand: "Mercedes", model: "GLE", year: "2023", plate: "DEF-4567" },
      ],
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      lastServiceDate: new Date(Date.now() - 32 * 86400000).toISOString(),
    },
    {
      id: "c3",
      name: "Roberto Lima",
      phone: "(11) 99876-5432",
      address: "Rua Oscar Freire, 200 - São Paulo",
      vehicles: [
        { id: "v4", brand: "Porsche", model: "Cayenne", year: "2023", plate: "GHI-7890" },
      ],
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
  ],
  services: [
    { id: "s1", name: "Lavagem Premium", description: "Lavagem completa com proteção de cera cerâmica e brilho de pneus.", price: 250, duration: 90 },
    { id: "s2", name: "Correção de Pintura", description: "Polimento mecânico em múltiplos estágios para remover riscos e swirls.", price: 1800, duration: 480 },
    { id: "s3", name: "Higienização Interior", description: "Detalhamento completo do interior: aspiração, condicionamento de couro e limpeza a vapor.", price: 450, duration: 180 },
    { id: "s4", name: "Revestimento Cerâmico", description: "Aplicação profissional de coating cerâmico para proteção de longa duração.", price: 2500, duration: 600 },
    { id: "s5", name: "Restauração de Faróis", description: "Restauração completa de faróis amarelados ou opacos com selante UV.", price: 180, duration: 60 },
  ],
  appointments: [
    {
      id: "a1",
      customerId: "c1",
      vehicleId: "v1",
      serviceIds: ["s1"],
      date: new Date().toISOString().slice(0, 10),
      time: "09:00",
      notes: "Cliente solicita atenção especial nas rodas.",
      status: "agendado",
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      discountValue: 0,
      discountType: "fixo",
      totalValue: 250,
    },
    {
      id: "a2",
      customerId: "c2",
      vehicleId: "v2",
      serviceIds: ["s2", "s3"],
      date: new Date().toISOString().slice(0, 10),
      time: "13:00",
      notes: "",
      status: "agendado",
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      discountValue: 50,
      discountType: "fixo",
      paymentMethod: "pix",
      totalValue: 2200,
    },
    {
      id: "a3",
      customerId: "c3",
      vehicleId: "v4",
      serviceIds: ["s4"],
      date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      time: "08:00",
      notes: "Porsche novo — manusear com muito cuidado.",
      status: "agendado",
      createdAt: new Date().toISOString(),
      discountValue: 0,
      discountType: "fixo",
      totalValue: 2500,
    },
    {
      id: "a4",
      customerId: "c2",
      vehicleId: "v3",
      serviceIds: ["s3"],
      date: new Date(Date.now() - 32 * 86400000).toISOString().slice(0, 10),
      time: "10:00",
      notes: "",
      status: "concluido",
      createdAt: new Date(Date.now() - 34 * 86400000).toISOString(),
      completedAt: new Date(Date.now() - 32 * 86400000).toISOString(),
      discountValue: 0,
      discountType: "fixo",
      paymentMethod: "credito",
      totalValue: 450,
    },
    {
      id: "a5",
      customerId: "c1",
      vehicleId: "v1",
      serviceIds: ["s1", "s5"],
      date: new Date(Date.now() - 18 * 86400000).toISOString().slice(0, 10),
      time: "09:00",
      notes: "",
      status: "concluido",
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      completedAt: new Date(Date.now() - 18 * 86400000).toISOString(),
      discountValue: 10,
      discountType: "porcentagem",
      paymentMethod: "dinheiro",
      totalValue: 387,
    },
  ],
  inventory: [
    { id: "i1", name: "Shampoo Automotivo", price: 45, quantity: 8, unit: "L", minStock: 5 },
    { id: "i2", name: "Desengraxante", price: 38, quantity: 500, unit: "ml", minStock: 1000 },
    { id: "i3", name: "Coating Cerâmico Pro", price: 320, quantity: 2, unit: "un", minStock: 3 },
    { id: "i4", name: "Panos Microfibra", price: 12, quantity: 24, unit: "un", minStock: 10 },
    { id: "i5", name: "Kit Clay Bar", price: 85, quantity: 1, unit: "un", minStock: 2 },
    { id: "i6", name: "Condicionador Interior", price: 92, quantity: 3, unit: "L", minStock: 2 },
  ],
  gallery: [],
};

// ─── Notification builder ─────────────────────────────────────────────────────

function buildNotifications(
  appointments: Appointment[],
  customers: Customer[],
  inventory: InventoryItem[],
  dismissed: string[]
): AppNotification[] {
  const now = Date.now();
  const notes: AppNotification[] = [];

  // Low stock
  for (const item of inventory) {
    if (item.quantity < item.minStock) {
      const id = `estoque_${item.id}`;
      if (!dismissed.includes(id)) {
        notes.push({
          id,
          type: "estoque",
          message: `Estoque baixo: ${item.name} — ${item.quantity} ${item.unit} (mín. ${item.minStock} ${item.unit})`,
          date: new Date().toISOString(),
          read: false,
          itemId: item.id,
        });
      }
    }
  }

  // Follow-up reminders for completed appointments only (not cancelled)
  const completedAppts = appointments.filter(
    (a) => a.status === "concluido" && a.completedAt
  );

  for (const appt of completedAppts) {
    const daysSince = Math.floor(
      (now - new Date(appt.completedAt!).getTime()) / 86400000
    );
    const customer = customers.find((c) => c.id === appt.customerId);
    const name = customer?.name ?? "Cliente";

    // Stage 1 — 15 days: offer a maintenance wash
    if (daysSince >= 15 && daysSince < 20) {
      const id = `retorno_15_${appt.id}`;
      if (!dismissed.includes(id)) {
        notes.push({
          id,
          type: "retorno_15",
          message: `Cliente ${name} realizou um serviço há ${daysSince} dias. Entre em contato para oferecer uma lavagem de manutenção.`,
          date: appt.completedAt!,
          read: false,
          customerId: appt.customerId,
          appointmentId: appt.id,
        });
      }
    }

    // Stage 2 — 20 days: second follow-up, check satisfaction
    if (daysSince >= 20 && daysSince < 30) {
      const id = `retorno_20_${appt.id}`;
      if (!dismissed.includes(id)) {
        notes.push({
          id,
          type: "retorno_20",
          message: `Cliente ${name} realizou um serviço há ${daysSince} dias. Entre em contato para verificar a satisfação e oferecer manutenção.`,
          date: appt.completedAt!,
          read: false,
          customerId: appt.customerId,
          appointmentId: appt.id,
        });
      }
    }

    // Stage 3 — 30 days: encourage a new appointment
    if (daysSince >= 30 && daysSince < 45) {
      const id = `retorno_30_${appt.id}`;
      if (!dismissed.includes(id)) {
        notes.push({
          id,
          type: "retorno_30",
          message: `Cliente ${name} realizou um serviço há ${daysSince} dias. Entre em contato para oferecer um novo agendamento.`,
          date: appt.completedAt!,
          read: false,
          customerId: appt.customerId,
          appointmentId: appt.id,
        });
      }
    }

    // Stage 4 — 45 days: retention campaign
    if (daysSince >= 45 && daysSince < 90) {
      const id = `retorno_45_${appt.id}`;
      if (!dismissed.includes(id)) {
        notes.push({
          id,
          type: "retorno_45",
          message: `Cliente ${name} está há ${daysSince} dias sem retornar. Considere oferecer uma condição especial para reativação.`,
          date: appt.completedAt!,
          read: false,
          customerId: appt.customerId,
          appointmentId: appt.id,
        });
      }
    }
  }

  // Upcoming today
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter(
    (a) => a.date === todayStr && a.status === "agendado"
  );
  for (const appt of todayAppts) {
    const id = `agendamento_${appt.id}`;
    if (!dismissed.includes(id)) {
      const customer = customers.find((c) => c.id === appt.customerId);
      notes.push({
        id,
        type: "agendamento",
        message: `Agendamento hoje às ${appt.time} — ${customer?.name ?? "Cliente"}`,
        date: new Date().toISOString(),
        read: false,
        customerId: appt.customerId,
        appointmentId: appt.id,
      });
    }
  }

  return notes.sort((a, b) => {
    const order: Record<string, number> = {
      retorno_45: 0,
      retorno_30: 1,
      retorno_20: 2,
      retorno_15: 3,
      estoque: 4,
      agendamento: 5,
    };
    return (order[a.type] ?? 9) - (order[b.type] ?? 9);
  });
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>({ ...SEED_DATA, seeded: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          // Migration: convert old serviceId to serviceIds
          if (parsed.appointments) {
            parsed.appointments = parsed.appointments.map((a: any) => ({
              discountValue: 0,
              discountType: "fixo",
              totalValue: 0,
              ...a,
              serviceIds: a.serviceIds ?? (a.serviceId ? [a.serviceId] : []),
            }));
          }
          if (!parsed.dismissedNotificationIds) {
            parsed.dismissedNotificationIds = [];
          }
          setData(parsed);
        } catch {
          setData(SEED_DATA);
        }
      } else {
        setData(SEED_DATA);
      }
      setIsLoading(false);
    });
  }, []);

  /**
   * Functional updater pattern — always derives next state from the latest
   * committed state (prev), avoiding stale-closure bugs in async callbacks
   * such as Alert.alert confirmations.
   */
  const save = (updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  // ── Customers ──

  const addCustomer = (c: Omit<Customer, "id" | "createdAt">): string => {
    const id = genId();
    save((prev) => ({
      ...prev,
      customers: [
        ...prev.customers,
        { ...c, id, createdAt: new Date().toISOString() },
      ],
    }));
    return id;
  };

  const updateCustomer = (id: string, c: Partial<Customer>) => {
    save((prev) => ({
      ...prev,
      customers: prev.customers.map((x) => (x.id === id ? { ...x, ...c } : x)),
    }));
  };

  const deleteCustomer = (id: string) => {
    save((prev) => ({
      ...prev,
      customers: prev.customers.filter((x) => x.id !== id),
      appointments: prev.appointments.filter((x) => x.customerId !== id),
    }));
  };

  // ── Services ──

  const addService = (s: Omit<Service, "id">) => {
    save((prev) => ({
      ...prev,
      services: [...prev.services, { ...s, id: genId() }],
    }));
  };

  const updateService = (id: string, s: Partial<Service>) => {
    save((prev) => ({
      ...prev,
      services: prev.services.map((x) => (x.id === id ? { ...x, ...s } : x)),
    }));
  };

  const deleteService = (id: string) => {
    save((prev) => ({
      ...prev,
      services: prev.services.filter((x) => x.id !== id),
    }));
  };

  // ── Appointments ──

  const addAppointment = (a: Omit<Appointment, "id" | "createdAt">) => {
    save((prev) => ({
      ...prev,
      appointments: [
        ...prev.appointments,
        { ...a, id: genId(), createdAt: new Date().toISOString() },
      ],
    }));
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    save((prev) => {
      const now = new Date().toISOString();

      const newAppts = prev.appointments.map((x) => {
        if (x.id !== id) return x;
        const updated = { ...x, ...updates };
        if (updates.status === "concluido" && !updated.completedAt) {
          updated.completedAt = now;
        }
        return updated;
      });

      let newCustomers = prev.customers;
      if (updates.status === "concluido") {
        const appt = prev.appointments.find((a) => a.id === id);
        if (appt) {
          newCustomers = prev.customers.map((c) =>
            c.id === appt.customerId
              ? { ...c, lastServiceDate: now }
              : c
          );
        }
      }

      return { ...prev, appointments: newAppts, customers: newCustomers };
    });
  };

  const deleteAppointment = (id: string) => {
    save((prev) => ({
      ...prev,
      appointments: prev.appointments.filter((x) => x.id !== id),
    }));
  };

  // ── Inventory ──

  const addInventoryItem = (i: Omit<InventoryItem, "id">) => {
    save((prev) => ({
      ...prev,
      inventory: [...prev.inventory, { ...i, id: genId() }],
    }));
  };

  const updateInventoryItem = (id: string, i: Partial<InventoryItem>) => {
    save((prev) => ({
      ...prev,
      inventory: prev.inventory.map((x) => (x.id === id ? { ...x, ...i } : x)),
    }));
  };

  const deleteInventoryItem = (id: string) => {
    save((prev) => ({
      ...prev,
      inventory: prev.inventory.filter((x) => x.id !== id),
    }));
  };

  // ── Gallery ──

  const addGalleryEntry = (g: Omit<GalleryEntry, "id">) => {
    save((prev) => ({
      ...prev,
      gallery: [...prev.gallery, { ...g, id: genId() }],
    }));
  };

  const deleteGalleryEntry = (id: string) => {
    save((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((x) => x.id !== id),
    }));
  };

  // ── Notifications ──

  const dismissNotification = (id: string) => {
    save((prev) => ({
      ...prev,
      dismissedNotificationIds: [
        ...(prev.dismissedNotificationIds ?? []),
        id,
      ],
    }));
  };

  const markAllNotificationsRead = () => {
    save((prev) => {
      const all = buildNotifications(
        prev.appointments,
        prev.customers,
        prev.inventory,
        prev.dismissedNotificationIds ?? []
      );
      return {
        ...prev,
        dismissedNotificationIds: [
          ...(prev.dismissedNotificationIds ?? []),
          ...all.map((n) => n.id),
        ],
      };
    });
  };

  // ── Computed notifications ──

  const notifications = useMemo(
    () =>
      buildNotifications(
        data.appointments,
        data.customers,
        data.inventory,
        data.dismissedNotificationIds ?? []
      ),
    [data.appointments, data.customers, data.inventory, data.dismissedNotificationIds]
  );

  const unreadCount = notifications.length;

  return (
    <DataContext.Provider
      value={{
        customers: data.customers,
        services: data.services,
        appointments: data.appointments,
        inventory: data.inventory,
        gallery: data.gallery,
        notifications,
        unreadCount,
        isLoading,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addService,
        updateService,
        deleteService,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        addGalleryEntry,
        deleteGalleryEntry,
        dismissNotification,
        markAllNotificationsRead,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
