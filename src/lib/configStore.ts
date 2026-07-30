import { PageConfig, pagesConfig as defaultPagesConfig } from "@/config/pages";

const LOCAL_STORAGE_KEY = "whatsapp_bridge_configs_v1";

export async function fetchRemoteConfig(): Promise<Record<string, PageConfig>> {
  try {
    const res = await fetch("/api/config", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      }
      return data;
    }
  } catch (err) {
    console.warn("Could not fetch remote config:", err);
  }

  if (typeof window !== "undefined") {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error("Failed to parse localStorage config", e);
      }
    }
  }

  return defaultPagesConfig;
}

export async function saveRemoteConfig(configs: Record<string, PageConfig>): Promise<boolean> {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(configs));
  }

  try {
    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(configs),
    });
    return res.ok;
  } catch (err) {
    console.error("Failed to save remote config:", err);
    return false;
  }
}
