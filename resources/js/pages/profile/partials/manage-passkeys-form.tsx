import { useState } from "react";
import { router } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePasskeyRegister } from "@laravel/passkeys/react";
import { Fingerprint, Trash2, Key } from "lucide-react";

declare const route: any;

interface Passkey {
    id: number;
    name: string;
    created_at: string;
    last_used_at?: string;
}

export default function ManagePasskeysForm({
    passkeys = [],
    className = "",
}: {
    passkeys?: Passkey[];
    className?: string;
}) {
    const { t } = useTranslation();
    const [name, setName] = useState("");
    const { register, isLoading, error } = usePasskeyRegister({
        onSuccess: () => {
            setName("");
            // Reload page to refresh the passkeys list
            router.reload({ only: ["passkeys"] });
        },
    });

    const handleDelete = (id: number) => {
        if (confirm(t("Are you sure you want to delete this passkey?"))) {
            router.delete(route("passkey.destroy", id), {
                preserveScroll: true,
                onSuccess: () => {
                    router.reload({ only: ["passkeys"] });
                },
            });
        }
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Fingerprint className="h-5 w-5 text-primary" />
                    {t("Passkeys & Biometrics")}
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {t(
                        "Manage your biometrics and hardware keys. Passkeys allow you to log in securely without entering your password."
                    )}
                </p>
            </header>

            <div className="mt-6 space-y-6">
                {/* Register New Passkey Form */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl max-w-xl">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                        <Key className="h-4 w-4 text-primary" />
                        {t("Register a new Passkey")}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        {t(
                            "Add this device's fingerprint, face ID, or a hardware security key to secure your account."
                        )}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <Label htmlFor="passkey_name" className="sr-only">
                                {t("Passkey Device Name")}
                            </Label>
                            <Input
                                id="passkey_name"
                                value={name}
                                onChange={(e: any) => setName(e.target.value)}
                                placeholder={t("e.g. My MacBook Pro, Android Phone")}
                                className="w-full"
                            />
                        </div>
                        <Button
                            onClick={() => register(name)}
                            disabled={isLoading || !name}
                            className="whitespace-nowrap flex items-center gap-2"
                        >
                            <Fingerprint className="h-4 w-4" />
                            {isLoading ? t("Registering...") : t("Add Passkey")}
                        </Button>
                    </div>
                    {error && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                            {error}
                        </p>
                    )}
                </div>

                {/* List of Registered Passkeys */}
                <div className="max-w-xl">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        {t("Your Registered Passkeys")}
                    </h3>

                    {passkeys.length === 0 ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400 p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-center">
                            {t("You haven't registered any passkeys yet.")}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {passkeys.map((passkey) => (
                                <div
                                    key={passkey.id}
                                    className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow transition-shadow"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                            <Fingerprint className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                                {passkey.name}
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {t("Added on")}{" "}
                                                {new Date(
                                                    passkey.created_at
                                                ).toLocaleDateString()}
                                                {passkey.last_used_at && (
                                                    <>
                                                        {" • "}{t("Last used")}{" "}
                                                        {new Date(
                                                            passkey.last_used_at
                                                        ).toLocaleDateString()}
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(passkey.id)}
                                        className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
