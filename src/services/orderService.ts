import type { CartItem, CartTotals } from "@/domain/cart";
import type {
  Order,
  OrderAddress,
  OrderRepository,
  PaymentMethod,
  PaymentStatus,
} from "@/domain/order";
import { seedOrders } from "@/data/orders";

const STORAGE_KEY = "bhendi-bazaar-orders";

function generateOrderCode(index: number) {
  const base = 1000 + index;
  return `BB-${base}`;
}

function nowIso() {
  return new Date().toISOString();
}

class LocalStorageOrderRepository implements OrderRepository {
  private memory: Order[] = [...seedOrders];

  private loadFromStorage(): Order[] {
    if (typeof window === "undefined") return this.memory;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return this.memory;
    try {
      const parsed = JSON.parse(raw) as Order[];
      this.memory = parsed;
    } catch {
      // ignore parse errors
    }
    return this.memory;
  }

  private persist(orders: Order[]) {
    this.memory = orders;
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }

  async list(): Promise<Order[]> {
    return this.loadFromStorage().slice().reverse();
  }

  async findById(id: string): Promise<Order | undefined> {
    return this.loadFromStorage().find((o) => o.id === id);
  }

  async createFromCart(input: {
    items: CartItem[];
    totals: CartTotals;
    address: OrderAddress;
    notes?: string;
    paymentMethod?: PaymentMethod;
    paymentStatus?: PaymentStatus;
    paymentId?: string;
  }): Promise<Order> {
    const existing = this.loadFromStorage();
    const id = `${Date.now()}-${existing.length + 1}`;
    const order: Order = {
      id,
      code: generateOrderCode(existing.length),
      items: input.items,
      totals: input.totals,
      status: "processing",
      address: input.address,
      notes: input.notes,
      placedAt: nowIso(),
      estimatedDelivery: new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000
      ).toISOString(),
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentStatus,
      paymentId: input.paymentId,
    };
    this.persist([...existing, order]);
    return order;
  }
  async update(
    id: string,
    update: {
      status?: Order["status"];
      paymentMethod?: PaymentMethod;
      paymentStatus?: PaymentStatus;
      paymentId?: string;
    }
  ): Promise<Order | undefined> {
    const existing = this.loadFromStorage();
    const next = existing.map((order) =>
      order.id === id ? { ...order, ...update } : order
    );
    this.persist(next);
    return next.find((order) => order.id === id);
  }
}

const repository: OrderRepository = new LocalStorageOrderRepository();

export const orderService = {
  list: () => repository.list(),
  findById: (id: string) => repository.findById(id),
  createFromCart: (input: {
    items: CartItem[];
    totals: CartTotals;
    address: OrderAddress;
    notes?: string;
    paymentMethod?: PaymentMethod;
    paymentStatus?: PaymentStatus;
    paymentId?: string;
  }) => repository.createFromCart(input),
  update: (
    id: string,
    update: {
      status?: Order["status"];
      paymentMethod?: PaymentMethod;
      paymentStatus?: PaymentStatus;
      paymentId?: string;
    }
  ) => repository.update(id, update),
};


