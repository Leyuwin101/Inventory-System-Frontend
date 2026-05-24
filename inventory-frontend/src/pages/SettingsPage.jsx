import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../components/context/AuthContext";
import { useTheme } from "../components/context/ThemeContext";
import { updateCurrentUser } from "../api/auth";
import {
    CheckCircle2,
    Eye,
    EyeOff,
    Loader2,
    Mail,
    Moon,
    Shield,
    Sliders,
    Sun,
    User,
} from "lucide-react";

const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "theme", label: "Theme", icon: Moon },
];

const getMemberName = (user = {}) => {
    const name = user?.username || user?.name || "";
    const normalized = String(name || "").replace("ROLE_", "").toUpperCase();
    const isRole = ["ADMIN", "MANAGER", "CASHIER", "INVENTORY_CLERK", "STANDARD_USER", "MEMBER"].includes(normalized);
    return String(name).includes("@") || isRole ? "" : name;
};

export default function SettingsPage() {
    const { user, updateUser, authLoading } = useAuth();
    const { theme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState("profile");
    const [profileForm, setProfileForm] = useState({
        username: getMemberName(user),
        email: user?.email || "",
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [showPasswords, setShowPasswords] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [notice, setNotice] = useState({ type: "", message: "" });
    const memberName = getMemberName(user);

    useEffect(() => {
        setProfileForm({
            username: getMemberName(user),
            email: user?.email || "",
        });
    }, [user]);

    const showNotice = (type, message) => {
        setNotice({ type, message });
        window.setTimeout(() => setNotice({ type: "", message: "" }), 3500);
    };

    const updateProfileField = (key, value) => {
        setProfileForm((prev) => ({ ...prev, [key]: value }));
    };

    const updatePasswordField = (key, value) => {
        setPasswordForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleProfileSave = async (event) => {
        event.preventDefault();

        if (!profileForm.username.trim()) {
            showNotice("error", "Member name is required.");
            return;
        }

        if (!profileForm.email.trim() || !/\S+@\S+\.\S+/.test(profileForm.email)) {
            showNotice("error", "Enter a valid email address.");
            return;
        }

        setSavingProfile(true);
        try {
            const updated = await updateCurrentUser({
                username: profileForm.username.trim(),
            });
            const memberName = updated.username || profileForm.username.trim();
            updateUser({
                ...user,
                ...updated,
                username: memberName,
                name: memberName,
                email: updated.email || profileForm.email.trim(),
            });
            showNotice("success", "Profile changes saved to the database.");
        } catch (err) {
            console.error(err);
            showNotice("error", err.response?.data?.message || "Failed to save profile changes.");
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordSave = async (event) => {
        event.preventDefault();

        if (!passwordForm.currentPassword) {
            showNotice("error", "Current password is required.");
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            showNotice("error", "New password must be at least 8 characters.");
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showNotice("error", "New password and confirmation do not match.");
            return;
        }

        setSavingPassword(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setSavingPassword(false);
        showNotice("success", "Password form validated. Backend password endpoint is pending.");
    };

    const handleThemeChange = (value) => {
        setTheme(value);
        showNotice("success", `${value === "dark" ? "Dark" : "Light"} theme applied.`);
    };

    return (
        <DashboardLayout>
            <div className="mb-6">
                <h1 className="flex items-center gap-2 text-xl font-semibold text-[var(--text-h)] sm:text-2xl">
                    <Sliders className="text-[var(--accent)]" size={24} />
                    Settings
                </h1>
                <p className="mt-1 text-sm text-[var(--muted)]">
                    Manage profile details, password changes, and theme preferences without interrupting the active session.
                </p>
            </div>

            {notice.message && (
                <div className={`mb-5 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium ${
                    notice.type === "success"
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-500"
                        : "border-red-500/30 bg-red-500/10 text-red-400"
                }`}>
                    {notice.type === "success" && <CheckCircle2 size={16} />}
                    {notice.message}
                </div>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
                <aside className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-2 shadow-[var(--shadow)] lg:self-start">
                    <div className="flex gap-2 overflow-x-auto lg:flex-col">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const active = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex min-h-11 min-w-max items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition lg:min-w-0 ${
                                        active
                                            ? "bg-[var(--accent)] text-[var(--accent-text)]"
                                            : "text-[var(--muted)] hover:bg-[var(--input-bg)] hover:text-[var(--text-h)]"
                                    }`}
                                >
                                    <Icon size={16} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </aside>

                <section className="space-y-5 lg:col-span-3">
                    {activeTab === "profile" && (
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow)] sm:p-5">
                            <div className="mb-5">
                                <h2 className="text-lg font-semibold text-[var(--text-h)]">Profile Information</h2>
                                <p className="mt-1 text-xs text-[var(--muted)]">Member name updates are saved to your account record.</p>
                            </div>

                            {authLoading || (user && !memberName) ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="h-20 animate-pulse rounded-lg bg-[var(--input-bg)]" />
                                    <div className="h-20 animate-pulse rounded-lg bg-[var(--input-bg)]" />
                                </div>
                            ) : (
                            <form onSubmit={handleProfileSave} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <label className="space-y-1.5">
                                        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                                            <User size={13} />
                                            Member name
                                        </span>
                                        <input value={profileForm.username} onChange={(e) => updateProfileField("username", e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
                                    </label>
                                    <label className="space-y-1.5">
                                        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                                            <Mail size={13} />
                                            Email
                                        </span>
                                        <input type="email" value={profileForm.email} onChange={(e) => updateProfileField("email", e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
                                    </label>
                                </div>

                                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Access role</div>
                                    <div className="mt-1 font-mono text-sm text-[var(--text-h)]">{user?.role || "STANDARD_USER"}</div>
                                </div>

                                <div className="flex justify-end">
                                    <button disabled={savingProfile} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-text)] transition hover:opacity-95 disabled:opacity-60 sm:w-auto">
                                        {savingProfile && <Loader2 size={16} className="animate-spin" />}
                                        Save profile
                                    </button>
                                </div>
                            </form>
                            )}
                        </div>
                    )}

                    {activeTab === "security" && (
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow)] sm:p-5">
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-[var(--text-h)]">Change Password</h2>
                                    <p className="mt-1 text-xs text-[var(--muted)]">Validation is frontend-only until the backend account endpoint exists.</p>
                                </div>
                                <button type="button" onClick={() => setShowPasswords((prev) => !prev)} className="rounded-lg border border-[var(--border)] bg-[var(--input-bg)] p-2 text-[var(--muted)] transition hover:text-[var(--text-h)]" aria-label="Toggle password visibility">
                                    {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            <form onSubmit={handlePasswordSave} className="space-y-4">
                                <label className="space-y-1.5">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Current password</span>
                                    <input type={showPasswords ? "text" : "password"} value={passwordForm.currentPassword} onChange={(e) => updatePasswordField("currentPassword", e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
                                </label>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <label className="space-y-1.5">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">New password</span>
                                        <input type={showPasswords ? "text" : "password"} value={passwordForm.newPassword} onChange={(e) => updatePasswordField("newPassword", e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
                                    </label>
                                    <label className="space-y-1.5">
                                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Confirm password</span>
                                        <input type={showPasswords ? "text" : "password"} value={passwordForm.confirmPassword} onChange={(e) => updatePasswordField("confirmPassword", e.target.value)} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
                                    </label>
                                </div>

                                <div className="flex justify-end">
                                    <button disabled={savingPassword} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-text)] transition hover:opacity-95 disabled:opacity-60 sm:w-auto">
                                        {savingPassword && <Loader2 size={16} className="animate-spin" />}
                                        Validate password change
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === "theme" && (
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow)] sm:p-5">
                            <div className="mb-5">
                                <h2 className="text-lg font-semibold text-[var(--text-h)]">Theme Settings</h2>
                                <p className="mt-1 text-xs text-[var(--muted)]">Choose the green inventory workspace theme that fits your environment.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <button onClick={() => handleThemeChange("dark")} className={`rounded-xl border p-5 text-left transition ${
                                    theme === "dark"
                                        ? "border-[var(--accent)] bg-[var(--input-bg)]"
                                        : "border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--input-bg)]"
                                }`}>
                                    <Moon className="mb-4 text-[var(--accent)]" size={22} />
                                    <div className="font-semibold text-[var(--text-h)]">Emerald Obsidian</div>
                                    <p className="mt-1 text-sm text-[var(--muted)]">Dark green workspace with elevated inventory panels.</p>
                                </button>
                                <button onClick={() => handleThemeChange("light")} className={`rounded-xl border p-5 text-left transition ${
                                    theme === "light"
                                        ? "border-[var(--accent)] bg-[var(--input-bg)]"
                                        : "border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--input-bg)]"
                                }`}>
                                    <Sun className="mb-4 text-[var(--accent)]" size={22} />
                                    <div className="font-semibold text-[var(--text-h)]">Mint Grassland</div>
                                    <p className="mt-1 text-sm text-[var(--muted)]">Soft green workspace with high contrast text.</p>
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </DashboardLayout>
    );
}
