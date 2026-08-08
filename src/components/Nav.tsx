"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/receipts", label: "Receipts" },
  { href: "/lists", label: "Lists" },
  { href: "/locations", label: "Stores" },
  { href: "/costs", label: "Costs" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-[rgba(247,250,252,0.85)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-[family-name:var(--font-display)] text-xl tracking-tight text-tj-red">
          TJ Pantry
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm font-medium text-tj-muted">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-2.5 py-1.5 transition ${
                  active
                    ? "bg-tj-red text-white"
                    : "hover:bg-black/5 hover:text-tj-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
