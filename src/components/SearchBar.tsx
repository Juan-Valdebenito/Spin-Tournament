"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/buscar?q=${encodeURIComponent(q)}` : "/buscar");
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-sm">
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar torneos, jugadores..."
        className="w-full rounded-md border border-border bg-surface-muted py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
      />
    </form>
  );
}
