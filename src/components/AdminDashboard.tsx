"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { PageConfig, pagesConfig as defaultPages } from "@/config/pages";
import { fetchRemoteConfig, saveRemoteConfig } from "@/lib/configStore";
import { WhatsAppIcon } from "./WhatsAppIcon";

export const AdminDashboard: React.FC = () => {
  const [configs, setConfigs] = useState<Record<string, PageConfig>>(defaultPages);
  const [activeTab, setActiveTab] = useState<string>("page1");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load configs on mount
  useEffect(() => {
    async function loadData() {
      const data = await fetchRemoteConfig();
      setConfigs(data);
    }
    loadData();
  }, []);

  const currentConfig = configs[activeTab] || defaultPages[activeTab];

  const handleInputChange = (field: keyof PageConfig, value: string) => {
    setConfigs((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    const success = await saveRemoteConfig(configs);
    setIsSaving(false);
    if (success) {
      setSaveStatus("Saved successfully!");
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      setSaveStatus("Error saving configuration.");
    }
  };

  const handleResetCurrentPage = () => {
    if (confirm(`Reset ${activeTab} to default settings?`)) {
      setConfigs((prev) => ({
        ...prev,
        [activeTab]: { ...defaultPages[activeTab] },
      }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          handleInputChange("logo", data.url);
        }
      } else {
        alert("Upload failed. Using local preview.");
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            handleInputChange("logo", event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error("Upload error:", err);
      // Fallback to data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleInputChange("logo", event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `whatsapp_bridge_configs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (imported && typeof imported === "object") {
          setConfigs(imported);
          saveRemoteConfig(imported);
          alert("Configuration imported successfully!");
        }
      } catch (err) {
        alert("Invalid JSON configuration file.");
      }
    };
    reader.readAsText(file);
  };

  const encodedMessage = encodeURIComponent(currentConfig.whatsappMessage || "");
  const whatsappUrl = `https://wa.me/${(currentConfig.whatsappNumber || "").replace(/[^0-9]/g, "")}?text=${encodedMessage}`;
  const pageUrl = typeof window !== "undefined" ? `${window.location.origin}/${activeTab}` : `/${activeTab}`;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pb-16">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-200/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-md shadow-[#25D366]/20">
              <WhatsAppIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">WhatsApp Bridge Config Manager</h1>
              <p className="text-xs text-zinc-500">Live customization portal for Meta Ads landing pages</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveStatus && (
              <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${saveStatus.includes("Error") ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                {saveStatus}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-sm transition-all duration-150 shadow-sm active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? "Saving..." : "Save All Changes"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-8 overflow-x-auto gap-2">
          <div className="flex items-center gap-2">
            {["page1", "page2", "page3", "page4"].map((tabKey, idx) => (
              <button
                key={tabKey}
                onClick={() => setActiveTab(tabKey)}
                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tabKey
                    ? "bg-white text-zinc-900 shadow-sm border border-zinc-200/80 font-semibold"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-white/50"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${activeTab === tabKey ? "bg-[#25D366]" : "bg-zinc-300"}`} />
                Page {idx + 1} ({tabKey})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg shadow-2xs hover:bg-zinc-50"
            >
              Export Config JSON
            </button>
            <label className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-lg shadow-2xs hover:bg-zinc-50 cursor-pointer">
              Import Config JSON
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>
        </div>

        {/* Content Layout Grid: Form (Left) & Live Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Editor */}
          <div className="lg:col-span-7 space-y-6">
            {/* Box 1: WhatsApp Configuration */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-2xs space-y-5">
              <h2 className="text-base font-semibold text-zinc-900 border-b border-zinc-100 pb-3 flex items-center justify-between">
                <span>WhatsApp Settings</span>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 underline flex items-center gap-1"
                >
                  Test Link ↗
                </a>
              </h2>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  WhatsApp Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={currentConfig.whatsappNumber || ""}
                  onChange={(e) => handleInputChange("whatsappNumber", e.target.value)}
                  placeholder="e.g. 15551234567 (with country code, no + or spaces)"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366] transition"
                />
                <p className="text-[11px] text-zinc-400 mt-1">Include full country code without + sign (e.g. 1 for US, 44 for UK, 91 for India)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Pre-filled Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={currentConfig.whatsappMessage || ""}
                  onChange={(e) => handleInputChange("whatsappMessage", e.target.value)}
                  placeholder="Message that auto-fills when user opens WhatsApp..."
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366] transition leading-relaxed"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[11px] font-mono text-zinc-400 truncate max-w-[320px]">
                    URL preview: {whatsappUrl}
                  </span>
                  <span className="text-[11px] text-zinc-400">{(currentConfig.whatsappMessage || "").length} chars</span>
                </div>
              </div>
            </div>

            {/* Box 2: Logo Customization */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-2xs space-y-5">
              <h2 className="text-base font-semibold text-zinc-900 border-b border-zinc-100 pb-3">Company Logo</h2>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-2">Upload New Logo Image</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-medium transition"
                  >
                    {uploading ? "Uploading..." : "Choose Image File"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="text-xs text-zinc-400">PNG, SVG, JPG or WebP (max 5MB)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Preset Logo Selector</label>
                <div className="grid grid-cols-4 gap-2">
                  {["/logos/logo1.png", "/logos/logo2.png", "/logos/logo3.png", "/logos/logo4.png"].map((presetPath, idx) => (
                    <button
                      key={presetPath}
                      type="button"
                      onClick={() => handleInputChange("logo", presetPath)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition ${
                        currentConfig.logo === presetPath ? "border-[#25D366] bg-emerald-50/50 ring-2 ring-[#25D366]/30" : "border-zinc-200 hover:border-zinc-300 bg-zinc-50"
                      }`}
                    >
                      <div className="w-full h-8 relative flex items-center justify-center">
                        <Image src={presetPath} alt={`Logo ${idx + 1}`} fill className="object-contain" unoptimized />
                      </div>
                      <span className="text-[10px] font-medium text-zinc-500">Logo {idx + 1}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Image Path / URL</label>
                <input
                  type="text"
                  value={currentConfig.logo || ""}
                  onChange={(e) => handleInputChange("logo", e.target.value)}
                  placeholder="/logos/logo1.png or https://..."
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366] transition font-mono text-xs"
                />
              </div>
            </div>

            {/* Box 3: Text & Copy Customization */}
            <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-2xs space-y-5">
              <h2 className="text-base font-semibold text-zinc-900 border-b border-zinc-100 pb-3">Text & Page Copy</h2>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Heading Line</label>
                <input
                  type="text"
                  value={currentConfig.headingText || ""}
                  onChange={(e) => handleInputChange("headingText", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Subheading Line</label>
                <input
                  type="text"
                  value={currentConfig.subheadingText || ""}
                  onChange={(e) => handleInputChange("subheadingText", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Button Text</label>
                <input
                  type="text"
                  value={currentConfig.buttonText || ""}
                  onChange={(e) => handleInputChange("buttonText", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">SEO Page Title</label>
                <input
                  type="text"
                  value={currentConfig.title || ""}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366] transition"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleResetCurrentPage}
                className="text-xs text-red-500 hover:text-red-600 font-medium hover:underline"
              >
                Reset Page to Default
              </button>

              <a
                href={`/${activeTab}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-600 hover:text-zinc-900 font-medium underline flex items-center gap-1"
              >
                View Published /{activeTab} Page ↗
              </a>
            </div>
          </div>

          {/* Right Column: Real-Time Live Preview */}
          <div className="lg:col-span-5 sticky top-24">
            <div className="bg-zinc-900 text-white rounded-3xl p-4 shadow-xl border border-zinc-800">
              {/* Device Header Simulator */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/80 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <span className="text-[11px] font-mono text-zinc-400">Live Visitor View (/{activeTab})</span>
                <span className="text-xs text-emerald-400 font-medium">100% Live</span>
              </div>

              {/* White Screen Viewport Container */}
              <div className="bg-white rounded-2xl p-6 text-zinc-900 min-h-[460px] flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden">
                {/* Logo */}
                <div className="relative mb-8 w-full flex justify-center items-center">
                  <div className="relative max-w-[160px] w-full aspect-[3/1] flex items-center justify-center filter drop-shadow-sm">
                    {currentConfig.logo ? (
                      <Image
                        src={currentConfig.logo}
                        alt="Logo Preview"
                        width={160}
                        height={50}
                        unoptimized
                        className="object-contain max-h-[60px] w-auto h-auto"
                      />
                    ) : (
                      <span className="text-xs text-zinc-400 italic">No logo selected</span>
                    )}
                  </div>
                </div>

                {/* Heading & Subheading */}
                <div className="space-y-2 mb-8">
                  <h3 className="text-zinc-900 text-lg font-semibold tracking-tight leading-snug">
                    {currentConfig.headingText || "Thank you for your interest."}
                  </h3>
                  <p className="text-zinc-500 text-xs font-normal leading-relaxed max-w-[320px] mx-auto">
                    {currentConfig.subheadingText || "Click below to continue your conversation on WhatsApp."}
                  </p>
                </div>

                {/* WhatsApp Button Preview */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-[16px] text-white font-semibold text-sm tracking-wide bg-[#25D366] hover:bg-[#22c35e] shadow-[0_6px_20px_-4px_rgba(37,211,102,0.4)] transition"
                >
                  <WhatsAppIcon className="w-5 h-5 flex-shrink-0" />
                  <span>{currentConfig.buttonText || "Continue to WhatsApp"}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
