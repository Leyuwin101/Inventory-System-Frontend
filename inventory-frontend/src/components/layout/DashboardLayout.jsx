import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen flex bg-[var(--bg)] text-[var(--text)]">

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 ml-0 lg:ml-80 p-4 md:p-6 min-w-0">

            <Header onMenuClick={() => setSidebarOpen(true)} />

            {children}
        </main>
        </div>
    );
}