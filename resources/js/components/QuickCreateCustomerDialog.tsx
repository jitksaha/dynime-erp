import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { InputError } from '@/components/ui/input-error';
import { UserPlus, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface CreatedCustomer {
    id: number;
    name: string;
    email: string;
}

interface Props {
    onCreated: (customer: CreatedCustomer) => void;
}

export default function QuickCreateCustomerDialog({ onCreated }: Props) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [form, setForm] = useState({
        company_name: '',
        contact_person_name: '',
        contact_person_email: '',
        contact_person_mobile: '',
        password: '',
        billing_city: '',
        billing_country: '',
        notes: '',
    });

    const set = (field: keyof typeof form) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setForm(prev => ({ ...prev, [field]: e.target.value }));
            setErrors(prev => ({ ...prev, [field]: '' }));
        };

    const reset = () => {
        setForm({
            company_name: '',
            contact_person_name: '',
            contact_person_email: '',
            contact_person_mobile: '',
            password: '',
            billing_city: '',
            billing_country: '',
            notes: '',
        });
        setErrors({});
        setShowPassword(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const csrfToken =
                (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';

            const res = await fetch(route('account.customers.quick-store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.errors) {
                    const flat: Record<string, string> = {};
                    Object.entries(data.errors).forEach(([k, v]) => {
                        flat[k] = Array.isArray(v) ? (v[0] as string) : String(v);
                    });
                    setErrors(flat);
                } else {
                    toast.error(data.error || t('Failed to create customer'));
                }
                return;
            }

            toast.success(t('Customer "{{name}}" created successfully!', { name: data.name }));
            onCreated(data);
            setOpen(false);
            reset();
        } catch {
            toast.error(t('Network error. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(true)}
                className="h-auto py-0 px-1 text-xs text-primary hover:text-primary/80 gap-1"
            >
                <UserPlus className="h-3 w-3" />
                {t('+ New Customer')}
            </Button>

            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base">
                            <UserPlus className="h-4 w-4 text-primary" />
                            {t('Create New Customer')}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-3 pt-1">
                        {/* Row 1: Company & Contact Name */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="qc-company" required>{t('Company Name')}</Label>
                                <Input
                                    id="qc-company"
                                    value={form.company_name}
                                    onChange={set('company_name')}
                                    placeholder={t('e.g. Acme Corp')}
                                    className="mt-1"
                                    autoFocus
                                />
                                <InputError message={errors.company_name} />
                            </div>
                            <div>
                                <Label htmlFor="qc-name" required>{t('Contact Person')}</Label>
                                <Input
                                    id="qc-name"
                                    value={form.contact_person_name}
                                    onChange={set('contact_person_name')}
                                    placeholder={t('Full name')}
                                    className="mt-1"
                                />
                                <InputError message={errors.contact_person_name} />
                            </div>
                        </div>

                        {/* Row 2: Email & Phone */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="qc-email" required>{t('Email')}</Label>
                                <Input
                                    id="qc-email"
                                    type="email"
                                    value={form.contact_person_email}
                                    onChange={set('contact_person_email')}
                                    placeholder="email@company.com"
                                    className="mt-1"
                                />
                                <InputError message={errors.contact_person_email} />
                            </div>
                            <div>
                                <Label htmlFor="qc-phone">{t('Phone')}</Label>
                                <Input
                                    id="qc-phone"
                                    value={form.contact_person_mobile}
                                    onChange={set('contact_person_mobile')}
                                    placeholder="+880 1234 567890"
                                    className="mt-1"
                                />
                                <InputError message={errors.contact_person_mobile} />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <Label htmlFor="qc-password" required>{t('Login Password')}</Label>
                            <div className="relative mt-1">
                                <Input
                                    id="qc-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={set('password')}
                                    placeholder={t('Set a password for customer login')}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    tabIndex={-1}
                                >
                                    {showPassword
                                        ? <EyeOff className="h-4 w-4" />
                                        : <Eye className="h-4 w-4" />
                                    }
                                </button>
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        {/* Row 3: City & Country */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="qc-city">{t('City')}</Label>
                                <Input
                                    id="qc-city"
                                    value={form.billing_city}
                                    onChange={set('billing_city')}
                                    placeholder={t('City')}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="qc-country">{t('Country')}</Label>
                                <Input
                                    id="qc-country"
                                    value={form.billing_country}
                                    onChange={set('billing_country')}
                                    placeholder={t('Country')}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <Label htmlFor="qc-notes">{t('Notes')}</Label>
                            <Textarea
                                id="qc-notes"
                                value={form.notes}
                                onChange={set('notes')}
                                placeholder={t('Optional notes...')}
                                rows={2}
                                className="mt-1 resize-none"
                            />
                        </div>

                        <p className="text-[11px] text-muted-foreground">
                            {t('A login account will be created with the email & password above. You can send login info to the customer from the Customers page.')}
                        </p>

                        <DialogFooter className="gap-2 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => { setOpen(false); reset(); }}
                                disabled={loading}
                            >
                                {t('Cancel')}
                            </Button>
                            <Button type="submit" disabled={loading} className="gap-2">
                                {loading
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <UserPlus className="h-4 w-4" />
                                }
                                {t('Create & Select')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
