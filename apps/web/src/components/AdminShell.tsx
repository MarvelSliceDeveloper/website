"use client";

import { useEffect, useState } from "react";
import Header from "./Header";
import AdminSidebar from "./AdminSidebar";

const STORAGE_KEY = "lms-admin-sidebar-collapsed";

export default function AdminShell({ children }: { children: React.ReactNode }) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);


    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar
                collapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed((value) => !value)}
            />
            <div className={`flex min-h-screen flex-1 flex-col transition-[margin] duration-200 ${isSidebarCollapsed ? "lg:ml-16" : "lg:ml-64"}`}>
                <Header
                    isSidebarCollapsed={isSidebarCollapsed}
                    onToggleSidebar={() => setIsSidebarCollapsed((value) => !value)}
                />
                <main className="flex-1 overflow-y-auto">
                    <div className="mx-auto w-full max-w-7xl p-4 md:p-6">{children}</div>
                </main>
            </div>
        </div>
    );
}