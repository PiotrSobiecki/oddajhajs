"use client";

import React from "react";
import AppNavbar from "./AppNavbar";
import Footer from "./Footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#121C2D]">
      <AppNavbar />
      <main className="flex-grow container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 mt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
}
