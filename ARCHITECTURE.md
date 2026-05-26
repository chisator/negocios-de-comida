# Architecture Strategy — Multi-Tenant Digital Menu & Ordering Platform

---

## 1. Supabase Auth Integration (Google OAuth + Phone OTP)

### 1.1 Dependency Setup

```
npm install @supabase/ssr @supabase/supabase-js
```

### 1.2 Supabase Client Factory

Create a single client factory that produces the correct client per Next.js execution context:

**`lib/supabase/client.ts`** — Browser-side client (Client Components)
```ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**`lib/supabase/server.ts`** — Server-side client (Server Components, Server Actions, Route Handlers)
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

**`lib/supabase/update-session.ts`** — Proxy session helper
```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Protect /dashboard/* routes — redirect unauthenticated users
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}
```

**`proxy.ts`** (project root — Next.js 16 replaces `middleware.ts`)
```ts
import { updateSession } from "@/lib/supabase/update-session";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
```

### 1.3 Auth Flow: Google OAuth

**Server Action** — `app/auth/actions.ts`
```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
  if (error) throw error;
  redirect(data.url);
}
```

**Auth Callback Route Handler** — `app/auth/callback/route.ts`
```ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Upsert into our public.users table (application-level profile)
  await prisma.user.upsert({
    where: { id: data.user.id },
    update: { email: data.user.email, name: data.user.user_metadata.full_name, avatarUrl: data.user.user_metadata.avatar_url },
    create: { id: data.user.id, email: data.user.email, name: data.user.user_metadata.full_name, avatarUrl: data.user.user_metadata.avatar_url },
  });

  return NextResponse.redirect(`${origin}${next}`);
}
```

### 1.4 Auth Flow: Phone OTP

**Step 1 — Initiate OTP login** (Server Action):
```ts
"use server";
import { createClient } from "@/lib/supabase/server";

export async function signInWithPhone(phone: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      shouldCreateUser: true,
      channel: "sms", // or "whatsapp"
    },
  });
  if (error) return { error: error.message };
  return { success: true };
}
```

**Step 2 — Verify OTP** (Server Action):
Requires a dedicated `verifyOtp` action because the OTP flow is two-step:

```ts
"use server";
import { createClient } from "@/lib/supabase/server";

export async function verifyPhoneOtp(phone: string, token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });

  if (error || !data.user) {
    return { error: error?.message ?? "Verification failed" };
  }

  // Upsert public user profile
  await prisma.user.upsert({
    where: { id: data.user.id },
    update: { phone: data.user.phone },
    create: { id: data.user.id, phone: data.user.phone, name: data.user.user_metadata?.name },
  });

  return { success: true };
}
```

### 1.5 Security & Tenant Isolation

**Every Server Action and data access function** must scope queries by `shopId` (or `userId` for user-owned data). This is enforced via a composable helper:

```ts
// lib/auth.ts
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}

export async function getShopOwnerContext(shopId: string) {
  const user = await getAuthenticatedUser();
  const shop = await prisma.shop.findUnique({ where: { id: shopId, ownerId: user.id } });
  if (!shop) throw new Error("Forbidden: Not the shop owner");
  return { user, shop };
}
```

**Key principle:** Never expose `shopId` via the client in a way that can be tampered with. Derive ownership on the server via the authenticated session.

---

## 2. Data Fetching & Mutation Strategy

### 2.1 Public Menu Rendering (Read-Heavy, Low Latency)

For the customer-facing menu, performance is paramount. Use **Server Components** for the initial page load with a single deep-fetch query pattern:

```ts
// app/[shopSlug]/page.tsx  (Server Component)
import { prisma } from "@/lib/prisma";

async function getShopMenu(slug: string) {
  return prisma.shop.findUniqueOrThrow({
    where: { slug },
    include: {
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          products: {
            where: { isAvailable: true },
            orderBy: { sortOrder: "asc" },
            include: {
              optionGroups: {
                orderBy: { sortOrder: "asc" },
                include: {
                  options: {
                    where: { isAvailable: true },
                    orderBy: { sortOrder: "asc" },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}
```

**Why this works:**
- Single SQL query with no N+1 — Prisma generates a single efficient join query.
- Server Component runs on the server, so no additional client roundtrips.
- The full menu tree is sent as serialized props to the client.

**Caching:** Wrap fetches in `unstable_cache` or use Next.js `fetch` with `revalidate` for ISR-style stale-while-revalidate:

```ts
import { unstable_cache } from "next/cache";

export const getShopMenu = unstable_cache(
  async (slug: string) => {
    return prisma.shop.findUniqueOrThrow({ /* ... */ });
  },
  ["shop-menu"],
  { revalidate: 60, tags: [`shop-${slug}`] }
);
```

Invalidate cache on data changes via `revalidateTag(`shop-${slug}`)` in mutation actions.

### 2.2 Product Configuration — Client-Side State

When a user taps a product, open a **product configurator modal/drawer**. This is a Client Component that manages local state for selected options:

```
[ProductModal] (Client Component)
  ├── ProductInfo (base price, image, description)
  ├── OptionGroupList
  │   ├── OptionGroupCard ("Garnishes" — min 1 / max 3)
  │   │   ├── OptionItem []  (checkboxes with price modifiers)
  │   ├── OptionGroupCard ("Extra Sauces" — min 0 / max 2)
  │   └── OptionGroupCard ("Drink Size" — min 1 / max 1 — radio buttons)
  └── AddToCartButton
```

**State management approach — useReducer:**

```ts
// hooks/useProductConfigurator.ts
import { useReducer } from "react";

type SelectionState = Record<string, string[]>; // groupId -> optionId[]

type Action =
  | { type: "TOGGLE_OPTION"; groupId: string; optionId: string; maxSelect: number }
  | { type: "SET_OPTION"; groupId: string; optionId: string } // single-select (radio)
  | { type: "RESET" };

function configuratorReducer(state: SelectionState, action: Action): SelectionState {
  switch (action.type) {
    case "TOGGLE_OPTION": {
      const current = state[action.groupId] ?? [];
      const exists = current.includes(action.optionId);
      let next: string[];
      if (exists) {
        next = current.filter((id) => id !== action.optionId);
      } else {
        if (current.length >= action.maxSelect) {
          // Remove first selected to enforce max (FIFO)
          next = [...current.slice(1), action.optionId];
        } else {
          next = [...current, action.optionId];
        }
      }
      return { ...state, [action.groupId]: next };
    }
    case "SET_OPTION":
      return { ...state, [action.groupId]: [action.optionId] };
    case "RESET":
      return {};
    default:
      return state;
  }
}

export function useProductConfigurator() {
  return useReducer(configuratorReducer, {});
}
```

**Derived values (computed, not stored):**

```ts
function computeTotalPrice(product: Product, selections: SelectionState, optionMap: Map<string, Option>) {
  let total = product.basePrice;
  for (const optionIds of Object.values(selections)) {
    for (const id of optionIds) {
      total += optionMap.get(id)?.priceModifier ?? 0;
    }
  }
  return total;
}

function validateSelections(optionGroups: OptionGroup[], selections: SelectionState): string[] {
  const errors: string[] = [];
  for (const group of optionGroups) {
    const count = (selections[group.id] ?? []).length;
    if (group.isRequired && count === 0) {
      errors.push(`"${group.name}" is required`);
    }
    if (count < group.minSelect) {
      errors.push(`"${group.name}" requires at least ${group.minSelect} selection(s)`);
    }
    if (count > group.maxSelect) {
      errors.push(`"${group.name}" allows at most ${group.maxSelect} selection(s)`);
    }
  }
  return errors;
}
```

### 2.3 Cart Mutation — Optimistic Updates + Server Validation

**Cart is managed via a Zustand store with persistence to localStorage** for immediate responsiveness, synchronized with a Server Action on add/remove/update.

**Cart Store** (`store/cart.ts`):
```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartItem {
  id: string;                // UUID generated client-side for optimistic key
  productId: string;
  productName: string;
  quantity: number;
  basePrice: number;
  selections: Record<string, string[]>; // groupId -> optionIds
  totalPrice: number;
  specialNotes?: string;
}

interface CartStore {
  items: CartItem[];
  shopId: string | null;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
}
```

### 2.4 Server-Side Cart Validation (Order Placement)

**The golden rule:** The server is the source of truth for prices and modifier limits. The client sends selections; the server recalculates and validates everything.

```ts
// app/actions/order.ts
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

const OrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  selections: z.record(z.string(), z.array(z.string().uuid())),
  specialNotes: z.string().max(500).optional(),
});

const PlaceOrderSchema = z.object({
  shopId: z.string().uuid(),
  items: z.array(OrderItemSchema).min(1),
});

export async function placeOrder(raw: z.infer<typeof PlaceOrderSchema>) {
  const user = await getAuthenticatedUser();
  const input = PlaceOrderSchema.parse(raw);

  // 1. Fetch the full product tree from DB (authoritative source)
  const products = await prisma.product.findMany({
    where: {
      id: { in: input.items.map((i) => i.productId) },
      category: { shopId: input.shopId, shop: { isOpen: true } },
      isAvailable: true,
    },
    include: {
      optionGroups: { include: { options: true } },
    },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const orderItemsData: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    specialNotes?: string;
    selectedOptions: Array<{ optionId: string; priceAtOrder: number }>;
  }> = [];

  // 2. Server-side price calculation & modifier validation
  for (const item of input.items) {
    const product = productMap.get(item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found or unavailable`);

    let itemTotal = product.basePrice;

    for (const group of product.optionGroups) {
      const selectedIds = item.selections[group.id] ?? [];

      // Enforce min/max
      if (selectedIds.length < group.minSelect || selectedIds.length > group.maxSelect) {
        throw new Error(
          `"${group.name}" requires between ${group.minSelect} and ${group.maxSelect} selection(s).`
        );
      }

      for (const optionId of selectedIds) {
        const option = group.options.find((o) => o.id === optionId);
        if (!option || !option.isAvailable) {
          throw new Error(`Option "${optionId}" is not available for "${group.name}".`);
        }
        itemTotal = itemTotal.plus(option.priceModifier);
      }
    }

    const unitPrice = itemTotal;
    const totalPrice = unitPrice.times(item.quantity);
    subtotal = subtotal.plus(totalPrice);

    orderItemsData.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
      specialNotes: item.specialNotes,
      selectedOptions: Object.values(item.selections)
        .flat()
        .map((optionId) => {
          const price = findOptionPrice(product.optionGroups, optionId);
          return { optionId, priceAtOrder: price };
        }),
    });
  }

  // 3. Create order + items in a single transaction
  const order = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        shopId: input.shopId,
        customerId: user.id,
        subtotal,
        totalAmount: subtotal, // plus delivery/tax as needed
        status: "PENDING",
        items: {
          create: orderItemsData.map((oi) => ({
            productId: oi.productId,
            quantity: oi.quantity,
            unitPrice: oi.unitPrice,
            totalPrice: oi.totalPrice,
            specialNotes: oi.specialNotes,
            selectedOptions: {
              create: oi.selectedOptions.map((so) => ({
                optionId: so.optionId,
                priceAtOrder: so.priceAtOrder,
              })),
            },
          })),
        },
      },
      include: { items: { include: { selectedOptions: true } } },
    });
    return order;
  });

  revalidateTag(`shop-${input.shopId}`);
  return { orderId: order.id };
}
```

### 2.5 Optimistic Add-to-Cart Flow

```
[User taps "Add to Cart"]
       │
       ▼
[Client: validate selections, compute price, push to Zustand cart]
       │  → UI updates immediately (optimistic)
       ▼
[Client: call a lightweight validation-only Server Action]
       │  → Server verifies prices & modifiers
       │  → On mismatch → rollback client cart & show error toast
       ▼
[User taps "Place Order"]
       │
       ▼
[Client: call placeOrder Server Action]
       │  → Server recalculates everything authoritatively
       │  → On success → clear cart, redirect to confirmation
       │  → On failure → show validation errors inline
```

---

## 3. Key Architectural Decisions Summary

| Concern | Decision | Rationale |
|---|---|---|
| **Multi-tenant isolation** | `shopId` FK on every entity | Single DB, app-level RLS via server-side scoping |
| **Price integrity** | Server recalculates on order placement | Client is untrusted; prevents tampering |
| **Auth state** | `@supabase/ssr` + proxy cookie refresh | Stateless, works across Server/Client Components |
| **Menu data** | Server Component deep-include fetch | Single query, no waterfall, cacheable |
| **Cart UX** | Zustand + optimistic Server Actions | Instant feedback, server-validated |
| **Modifier validation** | `useReducer` on client, zod on server | Clean state machine, double validation layer |
| **Decimal handling** | `@prisma/client` Decimal + `Decimal.js` | Avoids floating-point rounding errors |
| **Image hosting** | Supabase Storage buckets per shop | CDN-backed, RLS-enforced per shop |
