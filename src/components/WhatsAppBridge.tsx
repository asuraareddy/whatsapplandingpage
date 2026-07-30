"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { PageConfig } from "@/config/pages";
import { WhatsAppIcon } from "./WhatsAppIcon";

interface WhatsAppBridgeProps {
  config: PageConfig;
}

export const WhatsAppBridge: React.FC<WhatsAppBridgeProps> = ({ config: initialConfig }) => {
  const [config, setConfig] = useState<PageConfig>(initialConfig);

  useEffect(() => {
    // Check if there is an updated config saved in localStorage or API
    const loadLiveConfig = () => {
      try {
        const saved = localStorage.getItem("whatsapp_bridge_configs_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed[initialConfig.id]) {
            setConfig(parsed[initialConfig.id]);
          }
        }
      } catch (err) {
        console.error("Error reading live config", err);
      }
    };

    loadLiveConfig();

    // Listen for storage events across tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "whatsapp_bridge_configs_v1" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed[initialConfig.id]) {
            setConfig(parsed[initialConfig.id]);
          }
        } catch (err) {
          console.error("Storage event parse error", err);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [initialConfig.id]);

  const encodedMessage = encodeURIComponent(config.whatsappMessage);
  const whatsappUrl = `https://wa.me/${config.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodedMessage}`;

  return (
    <main className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-6 sm:p-8 animate-fadeIn select-none">
      <div className="w-full max-w-[420px] mx-auto flex flex-col items-center text-center">
        {/* Company Logo with soft shadow */}
        <div className="relative mb-8 sm:mb-10 w-full flex justify-center items-center">
          <div className="relative max-w-[180px] w-full aspect-[3/1] flex items-center justify-center filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:drop-shadow-[0_6px_16px_rgba(0,0,0,0.08)] transition-all duration-300">
            <Image
              src={config.logo}
              alt={config.logoAlt || "Company Logo"}
              width={180}
              height={60}
              priority
              unoptimized={config.logo.startsWith("data:") || config.logo.startsWith("http")}
              className="object-contain max-h-[70px] w-auto h-auto"
            />
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-2.5 mb-10 sm:mb-12">
          <h1 className="text-zinc-900 text-xl sm:text-2xl font-semibold tracking-tight leading-snug">
            {config.headingText || "Thank you for your interest."}
          </h1>
          <p className="text-zinc-500 text-sm sm:text-base font-normal leading-relaxed max-w-[360px] mx-auto">
            {config.subheadingText || "Click below to continue your conversation on WhatsApp."}
          </p>
        </div>

        {/* Large Green WhatsApp Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-[16px] text-white font-semibold text-base sm:text-lg tracking-wide transition-all duration-200 ease-out active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#25D366]/30 shadow-[0_8px_25px_-5px_rgba(37,211,102,0.4)] hover:shadow-[0_12px_30px_-5px_rgba(37,211,102,0.5)] hover:-translate-y-0.5 bg-[#25D366] hover:bg-[#22c35e]"
        >
          <WhatsAppIcon className="w-6 h-6 flex-shrink-0" />
          <span>{config.buttonText || "Continue to WhatsApp"}</span>
        </a>
      </div>
    </main>
  );
};
