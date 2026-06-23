import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { apiLoadData, apiSaveData } from "@/services/api";

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

export interface AppData {
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

const EMPTY_DATA: AppData = {
  seeded: false,
  dismissedNotificationIds: [],
  customers: [],
  services: [],
  appointments: [],
  inventory: [],
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

  const completedAppts = appointments.filter(
    (a) => a.status === "concluido" && a.completedAt
  );

  for (const appt of completedAppts) {
    const daysSince = Math.floor(
      (now - new Date(appt.completedAt!).getTime()) / 86400000
    );
    const customer = customers.find((c) => c.id === appt.customerId);
    const name = customer?.name ?? "Cliente";

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
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const stored = await apiLoadData();
        setData(stored ?? EMPTY_DATA);
      } catch {
        setData(EMPTY_DATA);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const save = (updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      void apiSaveData(next).catch(() => undefined);
      return next;
    });
  };

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
            c.id === appt.customerId ? { ...c, lastServiceDate: now } : c
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

  const dismissNotification = (id: string) => {
    save((prev) => ({
      ...prev,
      dismissedNotificationIds: [...(prev.dismissedNotificationIds ?? []), id],
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
