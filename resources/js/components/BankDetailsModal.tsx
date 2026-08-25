import React, { useState } from 'react';
import { 
  Building2, 
  Globe, 
  Copy, 
  Check, 
  X, 
  FileText, 
  Mail, 
  UserCheck, 
  Info,
  ShieldCheck,
  Landmark
} from 'lucide-react';
import { toast } from 'sonner';

export interface CustomField {
  id?: string;
  label: string;
  value: string;
}

export interface BankAccount {
  id?: string;
  country?: string;
  country_code?: string;
  bank_name: string;
  bank_name_label?: string;
  account_name: string;
  account_name_label?: string;
  account_number: string;
  account_number_label?: string;
  swift_code?: string;
  swift_code_label?: string;
  branch_routing?: string;
  branch_routing_label?: string;
  currency?: string;
  custom_fields?: CustomField[];
}

interface BankDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: BankAccount | null;
  allAccounts?: BankAccount[];
  selectedCountry?: string;
  onSelectAccount?: (acc: BankAccount) => void;
  invoiceNumber?: string;
  supportEmail?: string;
}

export default function BankDetailsModal({
  isOpen,
  onClose,
  account,
  allAccounts = [],
  selectedCountry,
  onSelectAccount,
  invoiceNumber = 'N/A',
  supportEmail = 'invoice@dynime.com'
}: BankDetailsModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !account) return null;

  const copyRow = (key: string, label: string, value: string) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyAllDetails = () => {
    const lines = [
      `Bank Name: ${account.bank_name}`,
      `${account.account_name_label || 'Recipient Name'}: ${account.account_name}`,
      `${account.account_number_label || 'Account Number / IBAN'}: ${account.account_number}`,
    ];
    if (account.country) lines.push(`Country or Region: ${account.country}`);
    if (account.swift_code) lines.push(`${account.swift_code_label || 'SWIFT Code'}: ${account.swift_code}`);
    if (account.branch_routing) lines.push(`${account.branch_routing_label || 'Branch / Routing'}: ${account.branch_routing}`);
    if (account.currency) lines.push(`Account Currency: ${account.currency}`);
    if (account.custom_fields && Array.isArray(account.custom_fields)) {
      account.custom_fields.forEach(cf => {
        if (cf.label && cf.value) lines.push(`${cf.label}: ${cf.value}`);
      });
    }
    if (invoiceNumber && invoiceNumber !== 'N/A') {
      lines.push(`Reference Memo: #${invoiceNumber}`);
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedKey('all');
    toast.success('All wire deposit details copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const rows = [
    {
      key: 'account_name',
      label: account.account_name_label || 'Recipient name',
      value: account.account_name
    },
    {
      key: 'country',
      label: 'Country or region',
      value: account.country || 'Global International'
    },
    {
      key: 'bank_name',
      label: account.bank_name_label || 'Bank name',
      value: account.bank_name
    },
    {
      key: 'account_number',
      label: account.account_number_label || 'Bank account no. / IBAN',
      value: account.account_number
    },
    ...(account.swift_code ? [{
      key: 'swift_code',
      label: account.swift_code_label || 'SWIFT Code',
      value: account.swift_code
    }] : []),
    ...(account.branch_routing ? [{
      key: 'branch_routing',
      label: account.branch_routing_label || 'Routing / Branch / Sortcode',
      value: account.branch_routing
    }] : []),
    ...(account.currency ? [{
      key: 'currency',
      label: 'Account Currency',
      value: `${account.currency} Deposit`
    }] : []),
    ...(account.custom_fields && Array.isArray(account.custom_fields) 
      ? account.custom_fields.map((cf, idx) => ({
          key: `custom_${idx}`,
          label: cf.label,
          value: cf.value
        }))
      : []
    )
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md sm:max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* Modal Header - Compact */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg font-bold">
              <Landmark className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2 leading-tight">
                {account.bank_name}
                {account.country && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded flex items-center gap-1">
                    <Globe className="h-2.5 w-2.5 text-indigo-500" /> {account.country}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                Direct wire transfer details for manual deposit
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-200/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body - Ultra Compact Bank Information Rows */}
        <div className="p-4 space-y-2.5 max-h-[82vh] overflow-y-auto">
          
          {/* Account switcher if multiple accounts exist for this country */}
          {allAccounts.length > 1 && onSelectAccount && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1 uppercase">Account:</span>
              {allAccounts.map((acc, idx) => {
                const isSelected = acc.id === account.id || acc.bank_name === account.bank_name;
                return (
                  <button
                    key={acc.id || idx}
                    type="button"
                    onClick={() => onSelectAccount(acc)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {acc.bank_name} ({acc.currency || 'USD'})
                  </button>
                );
              })}
            </div>
          )}

          {/* Compact Row List */}
          <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
            {rows.map((row) => {
              const isCopied = copiedKey === row.key;
              return (
                <div key={row.key} className="py-1.5 flex items-center justify-between gap-3 group">
                  <span className="text-xs font-medium text-slate-500 min-w-[120px] shrink-0">
                    {row.label}
                  </span>
                  
                  <div className="flex items-center justify-end gap-2 min-w-0 flex-1">
                    <span className="text-xs font-extrabold text-slate-900 truncate text-right">
                      {row.value}
                    </span>

                    {isCopied ? (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 animate-in fade-in">
                        <Check className="h-2.5 w-2.5" /> Copied
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => copyRow(row.key, row.label, row.value)}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors shrink-0"
                        title={`Copy ${row.label}`}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Copy All Details Button - Compact */}
          <button
            type="button"
            onClick={copyAllDetails}
            className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-indigo-100"
          >
            {copiedKey === 'all' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>All Wire Details Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy All Bank Wire Details</span>
              </>
            )}
          </button>

          {/* "Other info" / Notes Section - Compact */}
          <div className="pt-1 space-y-1.5">
            <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1">
              <Info className="h-3.5 w-3.5 text-indigo-600" />
              Other info & Deposit Notes
            </h4>

            <div className="space-y-1.5 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>
                  Attach invoice number <strong className="text-slate-900">#{invoiceNumber}</strong> on memo / reference.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <UserCheck className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                <span>Send transfer receipt to your dedicated sales manager.</span>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>
                  If ordered directly from website, mail receipt to{' '}
                  <a href={`mailto:${supportEmail}`} className="font-bold text-indigo-600 underline">
                    {supportEmail}
                  </a>.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer - Compact */}
        <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 text-slate-600 text-[11px] font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Secure Bank Wire Transfer
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors"
          >
            Done / Close
          </button>
        </div>

      </div>
    </div>
  );
}
