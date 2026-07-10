import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { RefreshCw, CheckCircle, Eye, EyeOff, Key, Copy, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputError } from '@/components/ui/input-error';
import { Lead } from '../types';

interface Client {
    id: number;
    name: string;
    email: string;
}

interface ConvertToDealProps {
    lead: Lead;
    deal?: {
        id: number;
        is_active: boolean;
    };
    buttonClassName?: string;
}

export default function ConvertToDeal({ lead, deal, buttonClassName }: ConvertToDealProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [formData, setFormData] = useState({
        name: lead.subject || lead.name,
        price: lead.project_value ? lead.project_value.toString() : '0',
        client_check: 'new',
        clients: '',
        client_name: lead.name,
        client_email: lead.email || '',
        client_phone: lead.phone || '',
        client_password: '',
        is_transfer: ['products', 'sources', 'files', 'discussion', 'notes', 'calls', 'emails']
    });
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [clientSearch, setClientSearch] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordCopied, setPasswordCopied] = useState(false);

    const filteredClients = clients.filter(client =>
        (client.name || '').toLowerCase().includes(clientSearch.toLowerCase()) ||
        (client.email || '').toLowerCase().includes(clientSearch.toLowerCase())
    );

    const selectedClient = clients.find(c => c.email === formData.clients);

    const generateStrongPassword = () => {
        const length = 12;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#%&*";
        let password = "";
        for (let i = 0, n = charset.length; i < length; ++i) {
            password += charset.charAt(Math.floor(Math.random() * n));
        }
        setFormData(prev => ({ ...prev, client_password: password }));
    };

    const copyToClipboard = () => {
        if (!formData.client_password) return;
        navigator.clipboard.writeText(formData.client_password);
        setPasswordCopied(true);
        setTimeout(() => setPasswordCopied(false), 2000);
    };
    useEffect(() => {
        if (formData.client_check === 'exist') {
            fetch(route('lead.leads.existing-clients'))
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(data => setClients(Array.isArray(data) ? data : []))
                .catch(error => {
                    setClients([]);
                });
        }
    }, [formData.client_check]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.post(route('lead.leads.convert-to-deal', lead.id), formData, {
            onSuccess: () => {
                setOpen(false);
                setErrors({});
                setProcessing(false);
            },
            onError: (errors) => {
                setErrors(errors);
                setProcessing(false);
            }
        });
    };

    const handleTransferChange = (value: string, checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            is_transfer: checked
                ? [...prev.is_transfer, value]
                : prev.is_transfer.filter(item => item !== value)
        }));
    };

    if (deal) {
        return (
            <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Link href={route('lead.deals.show', deal.id)}>
                            <Button size="sm" variant={buttonClassName ? 'ghost' : 'default'} className={buttonClassName}>
                                <CheckCircle className="h-4 w-4" />
                            </Button>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                        <span className="font-normal">{t('Already Converted To Deal')}</span>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Button size="sm" variant={buttonClassName ? 'ghost' : 'default'} className={buttonClassName}>
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <span className="font-normal">{t('Convert to Deal')}</span>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{t('Convert Lead to Deal')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="name">{t('Deal Name')}</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder={t('Enter Name')}
                                required
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div>
                            <CurrencyInput
                                label={t('Price')}
                                value={formData.price}
                                onChange={(value) => setFormData(prev => ({ ...prev, price: value }))}
                                error={errors.price}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>{t('Client Type')}</Label>
                        <RadioGroup value={formData.client_check} onValueChange={(value) => setFormData(prev => ({ ...prev, client_check: value }))} className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="new" id="new_client" />
                                <Label htmlFor="new_client">{t('New Client')}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="exist" id="existing_client" />
                                <Label htmlFor="existing_client">{t('Existing Client')}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="none" id="none_client" />
                                <Label htmlFor="none_client">{t('None (No Portal Account needed)')}</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {formData.client_check === 'exist' ? (
                            <div className="col-span-2 relative">
                                <Label htmlFor="clients">{t('Client')}</Label>
                                <div 
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                    onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                                >
                                    <span>{selectedClient ? `${selectedClient.name} (${selectedClient.email})` : t('Select Client')}</span>
                                    <span className="text-muted-foreground text-xs">▼</span>
                                </div>
                                {isClientDropdownOpen && (
                                    <>
                                        <div 
                                            className="fixed inset-0 z-40 bg-transparent" 
                                            onClick={() => setIsClientDropdownOpen(false)}
                                        />
                                        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md">
                                            <div className="p-1">
                                                <Input
                                                    type="text"
                                                    placeholder={t('Search Client...')}
                                                    value={clientSearch}
                                                    onChange={(e) => setClientSearch(e.target.value)}
                                                    className="h-8 mb-1 bg-slate-50 border-slate-200"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                            <div className="space-y-0.5 max-h-48 overflow-y-auto">
                                                {filteredClients.length > 0 ? (
                                                    filteredClients.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-slate-100 hover:text-slate-900 ${item.email === formData.clients ? 'bg-slate-100 font-medium' : ''}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFormData(prev => ({ ...prev, clients: item.email }));
                                                                setIsClientDropdownOpen(false);
                                                                setClientSearch('');
                                                            }}
                                                        >
                                                            {item.name} ({item.email})
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="py-2 text-center text-xs text-muted-foreground">
                                                        {t('No clients found')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                                <InputError message={errors.clients} />
                            </div>
                        ) : formData.client_check === 'new' ? (
                            <>
                                <div>
                                    <Label htmlFor="client_name" required>{t('Client Name')}</Label>
                                    <Input
                                        id="client_name"
                                        value={formData.client_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                                        placeholder={t('Enter Client Name')}
                                        required
                                    />
                                    <InputError message={errors.client_name} />
                                </div>
                                <div>
                                    <Label htmlFor="client_phone">{t('Client Phone')}</Label>
                                    <Input
                                        id="client_phone"
                                        value={formData.client_phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, client_phone: e.target.value }))}
                                        placeholder={t('Enter Client Phone')}
                                    />
                                    <InputError message={errors.client_phone} />
                                </div>
                                <div>
                                    <Label htmlFor="client_email">{t('Client Email')}</Label>
                                    <Input
                                        id="client_email"
                                        type="email"
                                        value={formData.client_email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, client_email: e.target.value }))}
                                        placeholder={t('Enter Client Email')}
                                    />
                                    <InputError message={errors.client_email} />
                                </div>
                                <div>
                                    <Label htmlFor="client_password" required>{t('Client Password')}</Label>
                                    <div className="flex gap-1 items-center relative">
                                        <div className="relative flex-1">
                                            <Input
                                                id="client_password"
                                                type={showPassword ? "text" : "password"}
                                                value={formData.client_password}
                                                onChange={(e) => setFormData(prev => ({ ...prev, client_password: e.target.value }))}
                                                placeholder={t('Enter Client Password')}
                                                required
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        <TooltipProvider>
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={generateStrongPassword}
                                                        className="h-10 w-10 text-slate-600 border-slate-200 hover:bg-slate-50"
                                                    >
                                                        <Key className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t('Generate Strong Password')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={copyToClipboard}
                                                        disabled={!formData.client_password}
                                                        className="h-10 w-10 text-slate-600 border-slate-200 hover:bg-slate-50"
                                                    >
                                                        {passwordCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{passwordCopied ? t('Copied!') : t('Copy Password')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <InputError message={errors.client_password} />
                                </div>
                            </>
                        ) : null}
                    </div>

                    <div>
                        <Label className="font-bold text-dark">{t('Copy To')}</Label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                            {[
                                { key: 'products', label: 'Products' },
                                { key: 'sources', label: 'Sources' },
                                { key: 'files', label: 'Files' },
                                { key: 'discussion', label: 'Discussion' },
                                { key: 'notes', label: 'Notes' },
                                { key: 'calls', label: 'Calls' },
                                { key: 'emails', label: 'Emails' }
                            ].map(item => (
                                <div key={item.key} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`is_transfer_${item.key}`}
                                        checked={formData.is_transfer.includes(item.key)}
                                        onCheckedChange={(checked) => handleTransferChange(item.key, checked as boolean)}
                                    />
                                    <Label htmlFor={`is_transfer_${item.key}`} className="text-sm">{t(item.label)}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            {t('Cancel')}
                        </Button>
                        <Button type="submit" disabled={processing}>{processing ? t('Converting...') : t('Convert')}</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
