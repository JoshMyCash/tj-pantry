"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/LogoutButton";

const links = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/receipts", label: "Receipts" },
  { href: "/lists", label: "Lists" },
  { href: "/locations", label: "Stores" },
  { href: "/costs", label: "Costs" },
];

export function Nav({ displayName }: { displayName?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (pathname === "/login") {
    return (
      <header className="sticky top-0 z-40 border-b border-black/5 bg-[rgba(247,250,252,0.85)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-3">
          <span className="font-[family-name:var(--font-display)] text-xl tracking-tight text-tj-red">
            TJ Pantry
          </span>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-[rgba(247,250,252,0.85)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl tracking-tight text-tj-red"
        >
          TJ Pantry
        </Link>

        <nav
          className="hidden md:flex flex-wrap items-center gap-1 text-sm font-medium text-tj-muted"
          aria-label="Primary"
        >
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
          {displayName ? (
            <span className="ml-1 rounded-lg px-2.5 py-1.5 text-tj-ink">
              {displayName}
            </span>
          ) : null}
          <LogoutButton />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          {displayName ? (
            <span className="text-sm font-medium text-tj-ink truncate max-w-[7rem]">
              {displayName}
            </span>
          ) : null}
          <button
            type="button"
            className="btn btn-secondary px-3 py-2 text-sm"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          className="md:hidden border-t border-black/5 px-4 py-3"
          aria-label="Mobile"
        >
          <ul className="grid gap-1">
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                      active
                        ? "bg-tj-red text-white"
                        : "text-tj-ink hover:bg-black/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li className="pt-1">
              <LogoutButton />
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
