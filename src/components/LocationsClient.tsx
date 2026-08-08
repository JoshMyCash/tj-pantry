"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type CrowdReport = {
  id: string;
  level: "QUIET" | "MODERATE" | "BUSY" | "PACKED";
  hour: number;
  dayOfWeek: number;
  notes: string;
};

type Location = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  hours: string;
  restockingTimes: string;
  typicalCrowd: CrowdReport["level"];
  crowdNotes: string;
  notes: string;
  crowdReports: CrowdReport[];
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function crowdLabel(c: CrowdReport["level"]) {
  return c.charAt(0) + c.slice(1).toLowerCase();
}

export function LocationsClient({ locations }: { locations: Location[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function createLocation(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(fd.get("name")),
        address: String(fd.get("address")),
        city: String(fd.get("city")),
        state: String(fd.get("state")),
        zip: String(fd.get("zip")),
        hours: String(fd.get("hours") ?? ""),
        restockingTimes: String(fd.get("restockingTimes") ?? ""),
        typicalCrowd: String(fd.get("typicalCrowd") || "MODERATE"),
        crowdNotes: String(fd.get("crowdNotes") ?? ""),
        notes: String(fd.get("notes") ?? ""),
      }),
    });
    setBusy(false);
    e.currentTarget.reset();
    router.refresh();
  }

  async function saveLocation(id: string, fd: FormData) {
    await fetch(`/api/locations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hours: String(fd.get("hours") ?? ""),
        restockingTimes: String(fd.get("restockingTimes") ?? ""),
        typicalCrowd: String(fd.get("typicalCrowd")),
        crowdNotes: String(fd.get("crowdNotes") ?? ""),
        notes: String(fd.get("notes") ?? ""),
      }),
    });
    router.refresh();
  }

  async function reportCrowd(id: string, level: CrowdReport["level"]) {
    await fetch(`/api/locations/${id}/crowd`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <form onSubmit={createLocation} className="surface rounded-2xl p-5 grid gap-3 sm:grid-cols-2">
        <h2 className="font-[family-name:var(--font-display)] text-2xl sm:col-span-2">
          Add a store
        </h2>
        <label className="text-sm sm:col-span-2">
          Name
          <input name="name" required className="input mt-1" placeholder="Trader Joe's — Downtown" />
        </label>
        <label className="text-sm sm:col-span-2">
          Address
          <input name="address" required className="input mt-1" />
        </label>
        <label className="text-sm">
          City
          <input name="city" required className="input mt-1" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            State
            <input name="state" required className="input mt-1" />
          </label>
          <label className="text-sm">
            ZIP
            <input name="zip" required className="input mt-1" />
          </label>
        </div>
        <label className="text-sm">
          Hours
          <input name="hours" className="input mt-1" placeholder="Mon–Sun 8 AM – 9 PM" />
        </label>
        <label className="text-sm">
          Restocking times
          <input name="restockingTimes" className="input mt-1" placeholder="Weekday mornings" />
        </label>
        <label className="text-sm">
          Typical crowd
          <select name="typicalCrowd" className="select mt-1" defaultValue="MODERATE">
            <option value="QUIET">Quiet</option>
            <option value="MODERATE">Moderate</option>
            <option value="BUSY">Busy</option>
            <option value="PACKED">Packed</option>
          </select>
        </label>
        <label className="text-sm">
          Crowd notes
          <input name="crowdNotes" className="input mt-1" />
        </label>
        <button type="submit" className="btn btn-primary sm:col-span-2" disabled={busy}>
          {busy ? "Saving…" : "Add location"}
        </button>
      </form>

      <div className="space-y-6">
        {locations.map((loc) => (
          <article key={loc.id} className="surface rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="font-[family-name:var(--font-display)] text-2xl">{loc.name}</h3>
              <p className="text-sm text-tj-muted mt-1">
                {loc.address}, {loc.city}, {loc.state} {loc.zip}
              </p>
            </div>
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                void saveLocation(loc.id, new FormData(e.currentTarget));
              }}
            >
              <label className="text-sm">
                Hours
                <input name="hours" className="input mt-1" defaultValue={loc.hours} />
              </label>
              <label className="text-sm">
                Restocking
                <input
                  name="restockingTimes"
                  className="input mt-1"
                  defaultValue={loc.restockingTimes}
                />
              </label>
              <label className="text-sm">
                Typical crowd
                <select
                  name="typicalCrowd"
                  className="select mt-1"
                  defaultValue={loc.typicalCrowd}
                >
                  <option value="QUIET">Quiet</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="BUSY">Busy</option>
                  <option value="PACKED">Packed</option>
                </select>
              </label>
              <label className="text-sm">
                Crowd notes
                <input name="crowdNotes" className="input mt-1" defaultValue={loc.crowdNotes} />
              </label>
              <label className="text-sm sm:col-span-2">
                Notes
                <input name="notes" className="input mt-1" defaultValue={loc.notes} />
              </label>
              <button type="submit" className="btn btn-secondary sm:col-span-2">
                Save store details
              </button>
            </form>

            <div>
              <p className="text-sm font-semibold mb-2">Log crowd now</p>
              <div className="flex flex-wrap gap-2">
                {(["QUIET", "MODERATE", "BUSY", "PACKED"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    className="btn btn-secondary text-sm"
                    onClick={() => void reportCrowd(loc.id, level)}
                  >
                    {crowdLabel(level)}
                  </button>
                ))}
              </div>
              <ul className="mt-3 space-y-1 text-sm text-tj-muted">
                {loc.crowdReports.slice(0, 5).map((r) => (
                  <li key={r.id}>
                    {DAYS[r.dayOfWeek]} {r.hour}:00 — {crowdLabel(r.level)}
                    {r.notes ? ` (${r.notes})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
