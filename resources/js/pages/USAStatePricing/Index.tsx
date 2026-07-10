import { useState, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Save, MapPin } from "lucide-react";

interface USAStatePricingRow {
  id?: number;
  state: string;
  abbr: string;
  llc_formation: number | string;
  corp_formation: number | string;
  llc_annual: number | string;
  llc_annual_label: string;
  corp_annual: number | string;
  corp_annual_label: string;
  llc_renewal: number | string;
  corp_renewal: number | string;
  state_tax_note?: string;
  franchise_tax?: string;
  notes?: string;
  sort_order: number;
  is_active: boolean;
}

interface Props {
  states: USAStatePricingRow[];
}

export default function Index({ states }: Props) {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<USAStatePricingRow[]>(states);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      r =>
        r.state.toLowerCase().includes(q) ||
        r.abbr.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const updateRow = (abbr: string, patch: Partial<USAStatePricingRow>) => {
    setRows(prev => prev.map(r => r.abbr === abbr ? { ...r, ...patch } : r));
  };

  const saveRow = (row: USAStatePricingRow) => {
    router.post(route('usa-state-pricing.store'), {
      ...row,
      llc_formation: Number(row.llc_formation) || 0,
      corp_formation: Number(row.corp_formation) || 0,
      llc_annual: Number(row.llc_annual) || 0,
      corp_annual: Number(row.corp_annual) || 0,
      llc_renewal: Number(row.llc_renewal) || 0,
      corp_renewal: Number(row.corp_renewal) || 0,
      sort_order: Number(row.sort_order) || 0,
    });
  };

  return (
    <AuthenticatedLayout>
      <Head title="USA State Pricing Management" />
      <div className="space-y-6 max-w-6xl mx-auto p-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            USA State Pricing Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage LLC and Corporation formation fees, annual fees, renewals, and franchise tax details for all US states.
          </p>
        </div>

        <div className="relative max-w-sm">
          <Input
            placeholder="Search by state name or abbreviation"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {filtered.map(row => (
            <Card key={row.abbr} className="border border-border">
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                      {row.abbr}
                    </span>
                    <h3 className="font-semibold text-lg">{row.state}</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs">
                      <Switch
                        checked={row.is_active}
                        onCheckedChange={v => updateRow(row.abbr, { is_active: v })}
                      />
                      <span className="text-muted-foreground">Active</span>
                    </div>
                    <Button size="sm" onClick={() => saveRow(row)}>
                      <Save className="w-3.5 h-3.5 mr-1.5" /> Save State
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs">LLC Formation ($)</Label>
                    <Input
                      type="number"
                      value={row.llc_formation}
                      onChange={e => updateRow(row.abbr, { llc_formation: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Corp Formation ($)</Label>
                    <Input
                      type="number"
                      value={row.corp_formation}
                      onChange={e => updateRow(row.abbr, { corp_formation: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">LLC Annual ($)</Label>
                    <Input
                      type="number"
                      value={row.llc_annual}
                      onChange={e => updateRow(row.abbr, { llc_annual: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">LLC Annual Label</Label>
                    <Input
                      value={row.llc_annual_label}
                      onChange={e => updateRow(row.abbr, { llc_annual_label: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Corp Annual ($)</Label>
                    <Input
                      type="number"
                      value={row.corp_annual}
                      onChange={e => updateRow(row.abbr, { corp_annual: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Corp Annual Label</Label>
                    <Input
                      value={row.corp_annual_label}
                      onChange={e => updateRow(row.abbr, { corp_annual_label: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">LLC Renewal ($)</Label>
                    <Input
                      type="number"
                      value={row.llc_renewal}
                      onChange={e => updateRow(row.abbr, { llc_renewal: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Corp Renewal ($)</Label>
                    <Input
                      type="number"
                      value={row.corp_renewal}
                      onChange={e => updateRow(row.abbr, { corp_renewal: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <Label className="text-xs">State Tax Note</Label>
                    <Input
                      value={row.state_tax_note || ''}
                      onChange={e => updateRow(row.abbr, { state_tax_note: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Franchise Tax</Label>
                    <Input
                      value={row.franchise_tax || ''}
                      onChange={e => updateRow(row.abbr, { franchise_tax: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
