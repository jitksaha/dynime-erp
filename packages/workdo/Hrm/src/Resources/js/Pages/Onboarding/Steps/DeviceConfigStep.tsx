import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Laptop, Smartphone, Trash2, ShieldCheck } from 'lucide-react';

export interface DeviceData {
    device_ownership: 'company_provided' | 'byod';
    device_category: 'desktop_laptop' | 'mobile';
    purchase_month_year?: string;
    device_name?: string;
    brand?: string;
    model?: string;
    serial_number?: string;
    imei?: string;
    mobile_number?: string;
    operating_system?: string;
    os_version?: string;
    notes?: string;
}

interface Props {
    devices: DeviceData[];
    onChange: (devices: DeviceData[]) => void;
}

// Enterprise Preset Selection Lists (Updated for 2026/2027)
const COMPUTER_BRANDS = [
    'Apple (Mac)',
    'Dell',
    'Lenovo (ThinkPad/Yoga)',
    'HP (Hewlett-Packard)',
    'Asus (ZenBook/ExpertBook)',
    'Acer (Swift/TravelMate)',
    'Microsoft (Surface)',
    'Samsung (Galaxy Book)',
    'MSI',
    'Razer',
    'Framework',
    'Gigabyte / Aorus',
    'Huawei (MateBook)',
    'LG (Gram)',
    'Fujitsu',
    'Toshiba / Dynabook',
    'Alienware',
    'System76 (Linux)',
    'Custom Workstation PC',
    'Other (Specify Below)'
];

const MOBILE_BRANDS = [
    'Apple (iPhone/iPad)',
    'Samsung (Galaxy)',
    'Google (Pixel)',
    'Xiaomi / Redmi / POCO',
    'OnePlus',
    'Oppo',
    'Vivo / iQOO',
    'Realme',
    'Motorola',
    'Nothing (Phone)',
    'Honor',
    'Huawei',
    'Sony (Xperia)',
    'Asus (ROG/Zenfone)',
    'Nokia / HMD',
    'TECNO / Infinix / Itel',
    'Other (Specify Below)'
];

const COMPUTER_NAMES = [
    'MacBook Pro 16"',
    'MacBook Pro 14"',
    'MacBook Air 15"',
    'MacBook Air 13"',
    'Mac Studio / Mac mini',
    'iMac 24"',
    'Dell Latitude Series',
    'Dell XPS Series',
    'Dell Precision Workstation',
    'Lenovo ThinkPad X1 Carbon',
    'Lenovo ThinkPad T-Series',
    'Lenovo ThinkPad P-Workstation',
    'HP EliteBook Series',
    'HP ZBook Mobile Workstation',
    'HP ProBook Series',
    'Asus ExpertBook / ZenBook',
    'Microsoft Surface Laptop',
    'Microsoft Surface Pro',
    'Samsung Galaxy Book Pro',
    'LG Gram 16 / 17',
    'Desktop Tower Workstation PC',
    'Custom Built Workstation',
    'Other (Specify Below)'
];

const MOBILE_NAMES = [
    'iPhone 16 Pro Max / 16 Pro',
    'iPhone 16 / 16 Plus',
    'iPhone 15 Pro Max / 15 Pro',
    'iPhone 15 / 15 Plus',
    'iPhone 14 / 13 Series',
    'iPad Pro 13" / 11" (M4)',
    'iPad Air 13" / 11" (M2)',
    'Samsung Galaxy S25 Ultra / S25',
    'Samsung Galaxy S24 Ultra / S24',
    'Samsung Galaxy Z Fold 6 / Z Flip 6',
    'Samsung Galaxy Tab S9 Ultra',
    'Google Pixel 9 Pro XL / 9 Pro',
    'Google Pixel 8 Pro / 8a',
    'Xiaomi 14 / 14 Ultra',
    'OnePlus 12 / Open',
    'Company Workstation Phone',
    'Other (Specify Below)'
];

const COMPUTER_OS = [
    'macOS',
    'Windows 11 Pro / Enterprise',
    'Windows 11 Home',
    'Windows 10 Pro / Enterprise',
    'Windows Server 2025/2022',
    'Ubuntu Linux LTS',
    'Fedora / RHEL (Red Hat)',
    'Debian / Linux Mint',
    'Arch Linux / Manjaro',
    'ChromeOS / ChromeOS Flex',
    'Other (Specify Below)'
];

const MOBILE_OS = [
    'iOS (Apple iPhone)',
    'iPadOS (Apple iPad)',
    'Android (Google)',
    'HarmonyOS (Huawei)',
    'Other (Specify Below)'
];

const OS_VERSIONS = [
    'macOS 15.x Sequoia',
    'macOS 14.x Sonoma',
    'macOS 13.x Ventura',
    'macOS 12.x Monterey',
    'Windows 11 (24H2)',
    'Windows 11 (23H2)',
    'Windows 11 (22H2)',
    'Windows 10 (22H2)',
    'Windows Server 2025',
    'Windows Server 2022',
    'Ubuntu 24.04 LTS (Noble Numbat)',
    'Ubuntu 22.04 LTS (Jammy Jellyfish)',
    'Fedora 41 / 40',
    'RHEL 9.x',
    'Debian 12 Bookworm',
    'iOS 18.x',
    'iOS 17.x',
    'iOS 16.x',
    'iPadOS 18.x',
    'iPadOS 17.x',
    'Android 15 (Vanilla Ice Cream)',
    'Android 14 (Upside Down Cake)',
    'Android 13 (Tiramisu)',
    'Other (Specify Below)'
];

export default function DeviceConfigStep({ devices, onChange }: Props) {
    const { t } = useTranslation();

    const handleAddDevice = (category: 'desktop_laptop' | 'mobile') => {
        const newDevice: DeviceData = {
            device_ownership: 'company_provided',
            device_category: category,
            purchase_month_year: '',
            device_name: category === 'desktop_laptop' ? 'MacBook Pro 16"' : 'iPhone 16 Pro Max / 16 Pro',
            brand: category === 'desktop_laptop' ? 'Apple (Mac)' : 'Apple (iPhone/iPad)',
            model: '',
            serial_number: '',
            imei: '',
            mobile_number: '',
            operating_system: category === 'desktop_laptop' ? 'macOS' : 'iOS (Apple iPhone)',
            os_version: category === 'desktop_laptop' ? 'macOS 15.x Sequoia' : 'iOS 18.x',
            notes: '',
        };
        onChange([...devices, newDevice]);
    };

    const handleRemoveDevice = (index: number) => {
        const updated = devices.filter((_, i) => i !== index);
        onChange(updated);
    };

    const handleUpdateDevice = (index: number, field: keyof DeviceData, value: string) => {
        const updated = [...devices];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        {t('Device & Hardware Inventory Configuration')}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-normal">
                        {t('Configure company-provided devices or personal devices (BYOD) used for work.')}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddDevice('desktop_laptop')}
                        className="h-8 text-xs font-medium gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50 rounded-lg"
                    >
                        <Laptop className="w-3.5 h-3.5" />
                        + {t('Add Computer')}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddDevice('mobile')}
                        className="h-8 text-xs font-medium gap-1 text-purple-600 border-purple-200 hover:bg-purple-50 rounded-lg"
                    >
                        <Smartphone className="w-3.5 h-3.5" />
                        + {t('Add Mobile')}
                    </Button>
                </div>
            </div>

            {devices.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                    <Laptop className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-600 font-medium">{t('No devices added yet.')}</p>
                    <p className="text-[11px] text-slate-400 font-normal">{t('Click above to register a laptop, desktop, or mobile device.')}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {devices.map((device, idx) => {
                        const isComputer = device.device_category === 'desktop_laptop';
                        const brandList = isComputer ? COMPUTER_BRANDS : MOBILE_BRANDS;
                        const osList = isComputer ? COMPUTER_OS : MOBILE_OS;
                        const nameList = isComputer ? COMPUTER_NAMES : MOBILE_NAMES;

                        const isBrandCustom = device.brand && !brandList.includes(device.brand) && device.brand !== 'Other (Specify Below)';
                        const isOsCustom = device.operating_system && !osList.includes(device.operating_system) && device.operating_system !== 'Other (Specify Below)';
                        const isNameCustom = device.device_name && !nameList.includes(device.device_name) && device.device_name !== 'Other (Specify Below)';
                        const isOsVerCustom = device.os_version && !OS_VERSIONS.includes(device.os_version) && device.os_version !== 'Other (Specify Below)';

                        return (
                            <div key={idx} className="bg-white border border-slate-200 p-4 rounded-xl space-y-4 shadow-sm relative">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        {isComputer ? (
                                            <Laptop className="w-4 h-4 text-indigo-600" />
                                        ) : (
                                            <Smartphone className="w-4 h-4 text-purple-600" />
                                        )}
                                        <span className="text-xs font-semibold text-slate-800">
                                            {isComputer ? t('Desktop / Laptop Computer') : t('Mobile Smartphone / Tablet')}
                                        </span>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveDevice(idx)}
                                        className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50 rounded-lg"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Ownership */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700">{t('Device Ownership')}</Label>
                                        <Select
                                            value={device.device_ownership}
                                            onValueChange={(val: any) => handleUpdateDevice(idx, 'device_ownership', val)}
                                        >
                                            <SelectTrigger className="rounded-xl text-xs font-normal">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="company_provided">{t('Company Provided Device')}</SelectItem>
                                                <SelectItem value="byod">{t('Employee Owned (BYOD)')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Purchase Date */}
                                    {device.device_ownership === 'company_provided' && (
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium text-slate-700">{t('Purchase Date (Month / Year)')}</Label>
                                            <Input
                                                placeholder="e.g. 05/2024"
                                                value={device.purchase_month_year || ''}
                                                onChange={(e) => handleUpdateDevice(idx, 'purchase_month_year', e.target.value)}
                                                className="rounded-xl text-xs font-normal"
                                            />
                                        </div>
                                    )}

                                    {/* Device Name */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700">{t('Device Series / Type')}</Label>
                                        <Select
                                            value={isNameCustom ? 'Other (Specify Below)' : (device.device_name || nameList[0])}
                                            onValueChange={(val) => {
                                                if (val === 'Other (Specify Below)') {
                                                    handleUpdateDevice(idx, 'device_name', 'Other (Specify Below)');
                                                } else {
                                                    handleUpdateDevice(idx, 'device_name', val);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="rounded-xl text-xs font-normal">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {nameList.map((n) => (
                                                    <SelectItem key={n} value={n}>{n}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {(device.device_name === 'Other (Specify Below)' || isNameCustom) && (
                                            <Input
                                                placeholder={t('Specify Custom Device Type / Name')}
                                                value={isNameCustom ? device.device_name : ''}
                                                onChange={(e) => handleUpdateDevice(idx, 'device_name', e.target.value)}
                                                className="rounded-xl text-xs font-normal mt-1.5"
                                            />
                                        )}
                                    </div>

                                    {/* Brand */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700">{t('Brand / Manufacturer')}</Label>
                                        <Select
                                            value={isBrandCustom ? 'Other (Specify Below)' : (device.brand || brandList[0])}
                                            onValueChange={(val) => {
                                                if (val === 'Other (Specify Below)') {
                                                    handleUpdateDevice(idx, 'brand', 'Other (Specify Below)');
                                                } else {
                                                    handleUpdateDevice(idx, 'brand', val);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="rounded-xl text-xs font-normal">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {brandList.map((b) => (
                                                    <SelectItem key={b} value={b}>{b}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {(device.brand === 'Other (Specify Below)' || isBrandCustom) && (
                                            <Input
                                                placeholder={t('Specify Custom Brand Name')}
                                                value={isBrandCustom ? device.brand : ''}
                                                onChange={(e) => handleUpdateDevice(idx, 'brand', e.target.value)}
                                                className="rounded-xl text-xs font-normal mt-1.5"
                                            />
                                        )}
                                    </div>

                                    {/* Model Name/Number */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700">{t('Exact Model / Specs')}</Label>
                                        <Input
                                            placeholder="e.g. M3 Max 36GB RAM / Latitude 5440"
                                            value={device.model || ''}
                                            onChange={(e) => handleUpdateDevice(idx, 'model', e.target.value)}
                                            className="rounded-xl text-xs font-normal"
                                        />
                                    </div>

                                    {/* Serial Number or IMEI */}
                                    {isComputer ? (
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-medium text-slate-700">{t('Serial Number')}</Label>
                                            <Input
                                                placeholder="e.g. C02FX123XYZ"
                                                value={device.serial_number || ''}
                                                onChange={(e) => handleUpdateDevice(idx, 'serial_number', e.target.value)}
                                                className="rounded-xl text-xs font-mono font-normal"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-medium text-slate-700">{t('IMEI Number')}</Label>
                                                <Input
                                                    placeholder="e.g. 356789012345678"
                                                    value={device.imei || ''}
                                                    onChange={(e) => handleUpdateDevice(idx, 'imei', e.target.value)}
                                                    className="rounded-xl text-xs font-mono font-normal"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-medium text-slate-700">{t('Mobile Number')}</Label>
                                                <Input
                                                    placeholder="e.g. +8801712345678"
                                                    value={device.mobile_number || ''}
                                                    onChange={(e) => handleUpdateDevice(idx, 'mobile_number', e.target.value)}
                                                    className="rounded-xl text-xs font-normal"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* Operating System */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700">{t('Operating System')}</Label>
                                        <Select
                                            value={isOsCustom ? 'Other (Specify Below)' : (device.operating_system || osList[0])}
                                            onValueChange={(val) => {
                                                if (val === 'Other (Specify Below)') {
                                                    handleUpdateDevice(idx, 'operating_system', 'Other (Specify Below)');
                                                } else {
                                                    handleUpdateDevice(idx, 'operating_system', val);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="rounded-xl text-xs font-normal">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {osList.map((os) => (
                                                    <SelectItem key={os} value={os}>{os}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {(device.operating_system === 'Other (Specify Below)' || isOsCustom) && (
                                            <Input
                                                placeholder={t('Specify Custom OS Name')}
                                                value={isOsCustom ? device.operating_system : ''}
                                                onChange={(e) => handleUpdateDevice(idx, 'operating_system', e.target.value)}
                                                className="rounded-xl text-xs font-normal mt-1.5"
                                            />
                                        )}
                                    </div>

                                    {/* OS Version */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium text-slate-700">{t('OS Version')}</Label>
                                        <Select
                                            value={isOsVerCustom ? 'Other (Specify Below)' : (device.os_version || OS_VERSIONS[0])}
                                            onValueChange={(val) => {
                                                if (val === 'Other (Specify Below)') {
                                                    handleUpdateDevice(idx, 'os_version', 'Other (Specify Below)');
                                                } else {
                                                    handleUpdateDevice(idx, 'os_version', val);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="rounded-xl text-xs font-normal">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {OS_VERSIONS.map((ver) => (
                                                    <SelectItem key={ver} value={ver}>{ver}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {(device.os_version === 'Other (Specify Below)' || isOsVerCustom) && (
                                            <Input
                                                placeholder={t('Specify Custom OS Version')}
                                                value={isOsVerCustom ? device.os_version : ''}
                                                onChange={(e) => handleUpdateDevice(idx, 'os_version', e.target.value)}
                                                className="rounded-xl text-xs font-normal mt-1.5"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-2">
                                    <Label className="text-xs font-medium text-slate-700">{t('Notes & Accessories (Optional)')}</Label>
                                    <Textarea
                                        placeholder={t('e.g. Provided with USB-C Dock, Charger, Wireless Mouse...')}
                                        value={device.notes || ''}
                                        onChange={(e) => handleUpdateDevice(idx, 'notes', e.target.value)}
                                        className="rounded-xl text-xs font-normal h-16"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
