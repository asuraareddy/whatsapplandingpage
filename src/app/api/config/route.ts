import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { pagesConfig } from "@/config/pages";

const CONFIG_PATH = path.join(process.cwd(), "data", "config.json");

export async function GET() {
  try {
    const data = await fs.readFile(CONFIG_PATH, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.warn("Could not read config.json, returning default pagesConfig:", error);
    return NextResponse.json(pagesConfig);
  }
}

export async function POST(request: Request) {
  try {
    const newConfig = await request.json();
    await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
    await fs.writeFile(CONFIG_PATH, JSON.stringify(newConfig, null, 2), "utf-8");
    return NextResponse.json({ success: true, message: "Configuration saved successfully" });
  } catch (error) {
    console.error("Failed to write config.json:", error);
    return NextResponse.json({ success: false, error: "Failed to save configuration" }, { status: 500 });
  }
}
