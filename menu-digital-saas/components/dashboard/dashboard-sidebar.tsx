"use client";

import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  {
    href: (slug: string) => `/dashboard/${slug}`,
    label: "Panel",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: (slug: string) => `/dashboard/${slug}/menu`,
    label: "Menú",
    icon: UtensilsCrossed,
  },
  {
    href: (slug: string) => `/dashboard/${slug}/orders`,
    label: "Pedidos",
    icon: ShoppingBag,
  },
  {
    href: (slug: string) => `/dashboard/${slug}/settings`,
    label: "Configuración",
    icon: Settings,
  },
];

interface DashboardSidebarProps {
  shopSlug: string;
  shopName: string;
}

export function DashboardSidebar({ shopSlug, shopName }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-zinc-200 bg-white transition-all duration-300 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      <div className="flex items-center justify-between h-14 px-4 border-b border-zinc-200">
        {!collapsed && (
          <span className="font-bold text-sm text-zinc-800 truncate">{shopName}</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md hover:bg-zinc-100 text-zinc-400"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const href = item.href(shopSlug);
          let isActive = item.exact
            ? pathname === href
            : pathname.startsWith(href);

          if (item.label === "Panel") {
            isActive = pathname === `/dashboard/${shopSlug}`;
          }

          return (
            <Link
              key={item.label}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#11BEE8]/10 text-[#11BEE8]"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 p-2">
        <button
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-red-600 transition-colors w-full ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Salir</span>}
        </button>
      </div>
    </aside>
  );
}
