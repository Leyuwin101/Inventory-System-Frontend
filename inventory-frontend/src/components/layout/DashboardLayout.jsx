import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--text)] overflow-x-hidden">

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="min-w-0 w-full max-w-full p-3 pb-6 sm:p-4 sm:pb-8 md:p-6 lg:pl-80">

            <Header onMenuClick={() => setSidebarOpen(true)} />

            <div className="mx-auto w-full max-w-[1600px] min-w-0">
                {children}
            </div>
        </main>
        </div>
    );
}
