import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../components/context/AuthContext";
import {
    createUser,
    getAllUsers,
    getUserById,
    terminateUser,
    updateUserById,
} from "../api/users";
import {
    AlertCircle,
    Edit3,
    Loader2,
    Plus,
    Search,
    Shield,
    ShieldAlert,
    Trash2,
    UserCog,
    X,
} from "lucide-react";

const ROLE_OPTIONS = ["ADMIN", "MANAGER", "INVENTORY_CLERK", "CASHIER"];
const blankForm = {
    username: "",
    email: "",
    password: "",
    role: "CASHIER",
};

const cleanRole = (role = "") => role.replace("ROLE_", "").toUpperCase();
const getUserId = (user) => user?.id ?? user?.userID ?? user?.userId ?? user?.user_id;
const MEMBERS_PAGE_SIZE = 10;

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const currentRole = cleanRole(currentUser?.role);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [form, setForm] = useState(blankForm);
    const [modalOpen, setModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const mountedRef = useRef(false);

    const canTerminateUser = (targetUser) => {
        const targetRole = cleanRole(targetUser?.role);
        if (currentRole === "ADMIN") return true;
        return currentRole === "MANAGER" && targetRole !== "ADMIN";
    };

    const canEditUser = (targetUser) => {
        const targetRole = cleanRole(targetUser?.role);
        if (currentRole === "ADMIN") return true;
        return currentRole === "MANAGER" && targetRole !== "ADMIN";
    };

    const availableRoles = currentRole === "ADMIN"
        ? ROLE_OPTIONS
        : ROLE_OPTIONS.filter((role) => role !== "ADMIN");

    const showNotice = (message) => {
        setNotice(message);
        window.setTimeout(() => setNotice(""), 3200);
    };

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError("");
            const rows = await getAllUsers();
            if (!mountedRef.current) return;
            setUsers(rows);
        } catch (err) {
            console.error(err);
            if (mountedRef.current) {
                setError(err.response?.data?.message || "Failed to load members.");
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        mountedRef.current = true;
        const timer = window.setTimeout(() => {
            loadUsers();
        }, 0);

        return () => {
            window.clearTimeout(timer);
            mountedRef.current = false;
        };
    }, []);

    const filteredUsers = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return users;

        return users.filter((account) => (
            account.username?.toLowerCase().includes(term) ||
            account.name?.toLowerCase().includes(term) ||
            account.email?.toLowerCase().includes(term) ||
            cleanRole(account.role).toLowerCase().includes(term)
        ));
    }, [search, users]);
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / MEMBERS_PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const visibleUsers = useMemo(() => {
        const start = (currentPage - 1) * MEMBERS_PAGE_SIZE;
        return filteredUsers.slice(start, start + MEMBERS_PAGE_SIZE);
    }, [currentPage, filteredUsers]);

    const openCreateModal = () => {
        setSelectedUser(null);
        setForm({ ...blankForm, role: availableRoles.includes("CASHIER") ? "CASHIER" : availableRoles[0] });
        setModalOpen(true);
    };

    const openEditModal = async (account) => {
        if (!canEditUser(account)) return;

        const id = getUserId(account);
        setSaving(true);
        try {
            const latest = id ? await getUserById(id) : account;
            const editable = latest || account;
            setSelectedUser(editable);
            setForm({
                username: editable.username || editable.name || "",
                email: editable.email || "",
                password: "",
                role: cleanRole(editable.role) || "CASHIER",
            });
            setModalOpen(true);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to get member details.");
        } finally {
            setSaving(false);
        }
    };

    const closeModal = ({ force = false } = {}) => {
        if (saving && !force) return;
        setModalOpen(false);
        setSelectedUser(null);
        setForm(blankForm);
    };

    const updateForm = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.username.trim()) {
            setError("Member name is required.");
            return;
        }

        if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
            setError("Enter a valid email address.");
            return;
        }

        if (!selectedUser && form.password.length < 8) {
            setError("New members need a password with at least 8 characters.");
            return;
        }

        if (currentRole === "MANAGER" && form.role === "ADMIN") {
            setError("Managers cannot create or update admin accounts.");
            return;
        }

        const payload = {
            username: form.username.trim(),
            email: form.email.trim(),
            role: form.role,
        };

        if (form.password) {
            payload.password = form.password;
        }

        setSaving(true);
        try {
            if (selectedUser) {
                await updateUserById(getUserId(selectedUser), payload);
                showNotice("Member account updated.");
            } else {
                await createUser(payload);
                showNotice("Member account created.");
            }
            closeModal({ force: true });
            await loadUsers();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to save member account.");
        } finally {
            setSaving(false);
        }
    };

    const handleTerminate = async (account) => {
        if (!canTerminateUser(account)) {
            setError("Managers cannot terminate admin accounts.");
            return;
        }

        const id = getUserId(account);
        const label = account.username || account.email || "this member";
        if (!window.confirm(`Terminate member "${label}"?`)) return;

        try {
            setLoading(true);
            await terminateUser(id);
            showNotice("Member account terminated.");
            await loadUsers();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to terminate member.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2 text-xl font-semibold text-[var(--text-h)] sm:text-2xl">
                        <UserCog className="text-[var(--accent)]" size={24} />
                        Members
                        {loading && users.length > 0 && <Loader2 size={18} className="animate-spin text-[var(--accent)]" />}
                    </h1>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                        Create accounts, update access roles, and terminate inactive members.
                    </p>
                </div>

                <button
                    onClick={openCreateModal}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--accent-text)] shadow-[var(--shadow)] transition hover:opacity-90 sm:w-auto"
                >
                    <Plus size={18} />
                    Add Member
                </button>
            </div>

            {(error || notice) && (
                <div className={`mb-5 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
                    error
                        ? "border-red-500/30 bg-red-500/10 text-red-400"
                        : "border-emerald-500/25 bg-emerald-500/10 text-emerald-500"
                }`}>
                    <div className="flex items-center gap-2">
                        {error ? <AlertCircle size={17} /> : <Shield size={17} />}
                        <span>{error || notice}</span>
                    </div>
                    <button onClick={() => { setError(""); setNotice(""); }} className="rounded p-1 hover:bg-black/10">
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
                    <input
                        type="text"
                        placeholder="Search members by name, email, or role..."
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] py-2.5 pl-10 pr-4 text-sm text-[var(--text-h)] outline-none"
                    />
                </div>
            </div>

            {loading && users.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-12">
                    <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
                    <span className="mt-3 text-sm text-[var(--muted)]">Loading member accounts...</span>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-12 text-center">
                    <ShieldAlert size={42} className="mx-auto mb-3 text-[var(--muted)]" />
                    <h3 className="text-lg font-medium text-[var(--text-h)]">No members found</h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                        {search ? `No accounts match "${search}".` : "Create the first managed account."}
                    </p>
                </div>
            ) : (
                <div className={`${loading ? "pointer-events-none opacity-60" : ""} transition-opacity`}>
                    <div className="space-y-3 md:hidden">
                        {visibleUsers.map((account) => {
                            const accountRole = cleanRole(account.role);
                            const isActive = account.active !== false && account.status !== "TERMINATED";
                            return (
                                <article key={getUserId(account) || account.email} className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow)]">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="truncate text-sm font-semibold text-[var(--text-h)]">{account.username || account.name || "Unnamed member"}</h3>
                                            <p className="mt-1 truncate text-xs text-[var(--muted)]">{account.email || "No email"}</p>
                                            <p className="mt-1 text-xs text-[var(--muted)]">ID: {getUserId(account) || "N/A"}</p>
                                        </div>
                                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                                            isActive
                                                ? "bg-emerald-500/10 text-emerald-500"
                                                : "bg-red-500/10 text-red-400"
                                        }`}>
                                            {isActive ? "Active" : "Terminated"}
                                        </span>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between gap-3">
                                        <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-1 text-xs font-semibold text-[var(--text-h)]">
                                            {accountRole || "MEMBER"}
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEditModal(account)}
                                                disabled={!canEditUser(account)}
                                                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-[var(--input-bg)] text-[var(--muted)] transition hover:bg-[var(--border)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
                                                aria-label="Edit member"
                                            >
                                                <Edit3 size={17} />
                                            </button>
                                            <button
                                                onClick={() => handleTerminate(account)}
                                                disabled={!isActive || !canTerminateUser(account)}
                                                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-red-500/10 text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                                                aria-label="Terminate member"
                                            >
                                                <Trash2 size={17} />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                    <div className="hidden overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card-bg)] md:block">
                    <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--input-bg)] text-xs uppercase text-[var(--muted)]">
                            <tr>
                                <th className="p-4 font-medium">Member</th>
                                <th className="p-4 font-medium">Email</th>
                                <th className="p-4 font-medium">Role</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                            {visibleUsers.map((account) => {
                                const accountRole = cleanRole(account.role);
                                const isActive = account.active !== false && account.status !== "TERMINATED";
                                return (
                                    <tr key={getUserId(account) || account.email} className="transition hover:bg-[var(--input-bg)]/60">
                                        <td className="p-4">
                                            <div className="font-semibold text-[var(--text-h)]">{account.username || account.name || "Unnamed member"}</div>
                                            <div className="text-xs text-[var(--muted)]">ID: {getUserId(account) || "N/A"}</div>
                                        </td>
                                        <td className="p-4 text-[var(--muted)]">{account.email || "No email"}</td>
                                        <td className="p-4">
                                            <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-1 text-xs font-semibold text-[var(--text-h)]">
                                                {accountRole || "MEMBER"}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                isActive
                                                    ? "bg-emerald-500/10 text-emerald-500"
                                                    : "bg-red-500/10 text-red-400"
                                            }`}>
                                                {isActive ? "Active" : "Terminated"}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(account)}
                                                    disabled={!canEditUser(account)}
                                                    className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--input-bg)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40"
                                                    aria-label="Edit member"
                                                >
                                                    <Edit3 size={17} />
                                                </button>
                                                <button
                                                    onClick={() => handleTerminate(account)}
                                                    disabled={!isActive || !canTerminateUser(account)}
                                                    className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                                                    aria-label="Terminate member"
                                                >
                                                    <Trash2 size={17} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    </div>
                    <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-4 sm:flex-row">
                        <p className="text-sm text-[var(--muted)]">
                            Showing {((currentPage - 1) * MEMBERS_PAGE_SIZE) + 1} - {Math.min(currentPage * MEMBERS_PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length} members
                        </p>
                        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                            <button disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-1.5 text-sm transition hover:bg-[var(--border)] disabled:cursor-not-allowed disabled:opacity-50">
                                Previous
                            </button>
                            <span className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-[var(--accent-text)]">
                                {currentPage} / {totalPages}
                            </span>
                            <button disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-1.5 text-sm transition hover:bg-[var(--border)] disabled:cursor-not-allowed disabled:opacity-50">
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
                    <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-2xl sm:max-w-xl sm:rounded-xl sm:p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <UserCog className="text-[var(--accent)]" size={20} />
                                <h2 className="text-lg font-semibold text-[var(--text-h)]">
                                    {selectedUser ? "Update Member" : "Create Member"}
                                </h2>
                            </div>
                            <button onClick={closeModal} disabled={saving} className="rounded p-1 text-[var(--muted)] transition hover:bg-[var(--input-bg)]">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <label className="space-y-1.5">
                                    <span className="text-sm text-[var(--muted)]">Member name *</span>
                                    <input
                                        required
                                        value={form.username}
                                        onChange={(event) => updateForm("username", event.target.value)}
                                        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                    />
                                </label>
                                <label className="space-y-1.5">
                                    <span className="text-sm text-[var(--muted)]">Email *</span>
                                    <input
                                        required
                                        type="email"
                                        value={form.email}
                                        onChange={(event) => updateForm("email", event.target.value)}
                                        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                    />
                                </label>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <label className="space-y-1.5">
                                    <span className="text-sm text-[var(--muted)]">
                                        {selectedUser ? "New password" : "Password *"}
                                    </span>
                                    <input
                                        required={!selectedUser}
                                        type="password"
                                        value={form.password}
                                        onChange={(event) => updateForm("password", event.target.value)}
                                        placeholder={selectedUser ? "Leave blank to keep current" : "At least 8 characters"}
                                        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                    />
                                </label>
                                <label className="space-y-1.5">
                                    <span className="text-sm text-[var(--muted)]">Role *</span>
                                    <select
                                        required
                                        value={form.role}
                                        onChange={(event) => updateForm("role", event.target.value)}
                                        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
                                    >
                                        {availableRoles.map((role) => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-[var(--border)] bg-[var(--card-bg)] px-4 pt-4 sm:static sm:mx-0 sm:flex-row sm:justify-end sm:bg-transparent sm:px-0">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={saving}
                                    className="rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--input-bg)]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-text)] transition hover:opacity-90 disabled:opacity-50"
                                >
                                    {saving && <Loader2 size={16} className="animate-spin" />}
                                    {selectedUser ? "Save Changes" : "Create Member"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
