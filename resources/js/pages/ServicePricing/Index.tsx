import { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from "@/layouts/authenticated-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Trash2, ChevronUp, ChevronDown, Save, ExternalLink, Star, Loader2, CheckCircle2 } from "lucide-react";

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price_usd: number | null;
  period: string;
  features: string[];
  highlighted: boolean;
  cta_type: string;
  cta_label: string;
}

interface QuoteSettings {
  enable_contact: boolean;
  enable_modal: boolean;
  enable_whatsapp: boolean;
  whatsapp_number: string;
  quote_message: string;
}

interface Row {
  service_slug: string;
  service_title: string;
  is_enabled: boolean;
  tiers: PricingTier[];
  quote_settings: QuoteSettings;
}

interface Props {
  pricings: Row[];
}

const ALL_SERVICES = [
  // DWS
  { slug: "web-design-development", title: "Web Design & Development", categoryLabel: "DWS — Dynime Web Services", url: "/web-design-development" },
  { slug: "wordpress-woocommerce", title: "WordPress & WooCommerce", categoryLabel: "DWS — Dynime Web Services", url: "/wordpress-woocommerce" },
  { slug: "react-mern-apps", title: "React / MERN Apps", categoryLabel: "DWS — Dynime Web Services", url: "/react-mern-apps" },
  { slug: "ui-ux-design", title: "UI/UX Design", categoryLabel: "DWS — Dynime Web Services", url: "/ui-ux-design" },
  { slug: "maintenance-security", title: "Maintenance & Security", categoryLabel: "DWS — Dynime Web Services", url: "/maintenance-security" },
  { slug: "website-redesign", title: "Website Redesign", categoryLabel: "DWS — Dynime Web Services", url: "/website-redesign" },
  { slug: "shopify", title: "Shopify Development", categoryLabel: "DWS — Dynime Web Services", url: "/shopify" },
  { slug: "saas-development", title: "SaaS Development", categoryLabel: "DWS — Dynime Web Services", url: "/saas-development" },
  { slug: "webflow-development", title: "Webflow Development", categoryLabel: "DWS — Dynime Web Services", url: "/webflow-development" },
  { slug: "speed-optimization", title: "Page Speed Optimization", categoryLabel: "DWS — Dynime Web Services", url: "/speed-optimization" },
  // DES
  { slug: "shopify-ecommerce", title: "Shopify Ecommerce", categoryLabel: "DES — Dynime Ecommerce Solution", url: "/shopify-ecommerce" },
  { slug: "wordpress-ecommerce", title: "WordPress Ecommerce", categoryLabel: "DES — Dynime Ecommerce Solution", url: "/wordpress-ecommerce" },
  { slug: "nodejs-mern-ecommerce", title: "Nodejs / MERN Ecommerce", categoryLabel: "DES — Dynime Ecommerce Solution", url: "/nodejs-mern-ecommerce" },
  { slug: "laravel-ecommerce", title: "Laravel Ecommerce", categoryLabel: "DES — Dynime Ecommerce Solution", url: "/laravel-ecommerce" },
  // DMS
  { slug: "social-media", title: "Social Media", categoryLabel: "DMS — Dynime Marketing Services", url: "/social-media" },
  { slug: "facebook-ads", title: "Meta Ads", categoryLabel: "DMS — Dynime Marketing Services", url: "/facebook-ads" },
  { slug: "google-ads", title: "Google Ads", categoryLabel: "DMS — Dynime Marketing Services", url: "/google-ads" },
  { slug: "seo", title: "SEO", categoryLabel: "DMS — Dynime Marketing Services", url: "/seo" },
  { slug: "brand-strategy", title: "Brand Strategy", categoryLabel: "DMS — Dynime Marketing Services", url: "/brand-strategy" },
  { slug: "content-marketing", title: "Content Marketing", categoryLabel: "DMS — Dynime Marketing Services", url: "/content-marketing" },
  { slug: "email-marketing", title: "Email Marketing", categoryLabel: "DMS — Dynime Marketing Services", url: "/email-marketing" },
  { slug: "analytics", title: "Analytics & CRO", categoryLabel: "DMS — Dynime Marketing Services", url: "/analytics" },
  // DSS
  { slug: "ai-software-development", title: "AI Software Development", categoryLabel: "DSS — Dynime Software & AI", url: "/ai-software-development" },
  { slug: "custom-software-development", title: "Custom Software Development", categoryLabel: "DSS — Dynime Software & AI", url: "/custom-software-development" },
  { slug: "software-built-with-ai", title: "Software Built With AI", categoryLabel: "DSS — Dynime Software & AI", url: "/software-built-with-ai" },
  { slug: "software-testing-qa", title: "Software Testing & QA", categoryLabel: "DSS — Dynime Software & AI", url: "/software-testing-qa" },
  { slug: "pay-open-source", title: "Dynime Pay (Self-Hosted)", categoryLabel: "DSS — Dynime Software & AI", url: "/pay-open-source" },
  // DCS
  { slug: "us-company", title: "US Company Formation", categoryLabel: "DCS — Dynime Consultancy Services", url: "/us-company" },
  { slug: "uk-company", title: "UK Company Formation", categoryLabel: "DCS — Dynime Consultancy Services", url: "/uk-company" },
  { slug: "virtual-address", title: "US & UK Business Address", categoryLabel: "DCS — Dynime Consultancy Services", url: "/virtual-address" },
  { slug: "itin-services", title: "ITIN Application Services", categoryLabel: "DCS — Dynime Consultancy Services", url: "/itin-services" },
  { slug: "dropshipping-solution", title: "Dropshipping Solution", categoryLabel: "DCS — Dynime Consultancy Services", url: "/dropshipping-solution" },
  { slug: "marketplace-solution", title: "Marketplace Selling Solution", categoryLabel: "DCS — Dynime Consultancy Services", url: "/marketplace-solution" },
  { slug: "payment-gateway", title: "Payment Gateway Setup", categoryLabel: "DCS — Dynime Consultancy Services", url: "/payment-gateway" },
  { slug: "consulting", title: "Business Consulting", categoryLabel: "DCS — Dynime Consultancy Services", url: "/consulting" },
];

const defaultQuoteSettings = (): QuoteSettings => ({
  enable_contact: true,
  enable_modal: true,
  enable_whatsapp: false,
  whatsapp_number: "",
  quote_message: "Tell us about your project and we'll send a tailored quote within 24 hours.",
});

const blankTier = (): PricingTier => ({
  id: crypto.randomUUID(),
  name: "New Tier",
  description: "",
  price_usd: 99,
  period: "one-time",
  features: [],
  highlighted: false,
  cta_type: "fixed",
  cta_label: "",
});

export default function Index({ pricings }: Props) {
  const [search, setSearch] = useState("");
  const [selectedSlug, setSelectedSlug] = useState(ALL_SERVICES[0].slug);
  const [saving, setSaving] = useState(false);

  // Map db pricings into local state keyed by slug
  const [rows, setRows] = useState<Record<string, Row>>(() => {
    const map: Record<string, Row> = {};
    pricings.forEach((r) => {
      map[r.service_slug] = {
        service_slug: r.service_slug,
        service_title: r.service_title,
        is_enabled: r.is_enabled ?? true,
        tiers: Array.isArray(r.tiers) ? r.tiers : [],
        quote_settings: r.quote_settings ?? defaultQuoteSettings(),
      };
    });
    return map;
  });

  const selectedSvc = ALL_SERVICES.find((s) => s.slug === selectedSlug)!;
  const current: Row = rows[selectedSlug] ?? {
    service_slug: selectedSvc.slug,
    service_title: selectedSvc.title,
    is_enabled: true,
    tiers: [blankTier()],
    quote_settings: defaultQuoteSettings(),
  };

  const update = (patch: Partial<Row>) => {
    setRows((prev) => ({
      ...prev,
      [selectedSlug]: { ...current, ...patch },
    }));
  };

  const updateTier = (i: number, patch: Partial<PricingTier>) => {
    const next = [...current.tiers];
    next[i] = { ...next[i], ...patch };
    update({ tiers: next });
  };

  const moveTier = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= current.tiers.length) return;
    const next = [...current.tiers];
    [next[i], next[j]] = [next[j], next[i]];
    update({ tiers: next });
  };

  const addTier = () => update({ tiers: [...current.tiers, blankTier()] });
  const removeTier = (i: number) => update({ tiers: current.tiers.filter((_, k) => k !== i) });

  const save = () => {
    setSaving(true);
    router.post(route('service-pricing.store'), current as any, {
      preserveScroll: true,
      onSuccess: () => {
        setSaving(false);
      },
      onError: () => {
        setSaving(false);
      }
    });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_SERVICES.filter((s) => !q || s.title.toLowerCase().includes(q) || s.slug.includes(q));
  }, [search]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof ALL_SERVICES> = {};
    filtered.forEach((s) => {
      g[s.categoryLabel] = g[s.categoryLabel] || [];
      g[s.categoryLabel].push(s);
    });
    return g;
  }, [filtered]);

  return (
    <AuthenticatedLayout>
      <Head title="Service Pricing" />
      <div className="p-6 max-w-[1500px] mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Service Pricing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage tiers, prices and quote settings for every service page.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
          {/* LEFT — service list */}
          <div className="lg:sticky lg:top-[80px] h-fit">
            <Card className="overflow-hidden">
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search services…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>
              <div className="max-h-[calc(100vh-240px)] overflow-y-auto py-2">
                {Object.entries(grouped).map(([catLabel, list]) => (
                  <div key={catLabel} className="mb-3">
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {catLabel}
                    </div>
                    {list.map((s) => {
                      const row = rows[s.slug];
                      const tierCount = row?.tiers?.length ?? 0;
                      const isActive = selectedSlug === s.slug;
                      return (
                        <button
                          key={s.slug}
                          onClick={() => setSelectedSlug(s.slug)}
                          className={`w-full text-left px-3 py-2 flex items-center gap-2 text-sm transition-colors ${
                            isActive
                              ? "bg-primary/10 text-primary border-l-2 border-primary"
                              : "hover:bg-muted/50 border-l-2 border-transparent"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                              row?.is_enabled === false
                                ? "bg-muted-foreground/40"
                                : tierCount > 0
                                  ? "bg-emerald-500"
                                  : "bg-muted-foreground/30"
                            }`}
                          />
                          <span className="flex-1 truncate">{s.title}</span>
                          {tierCount > 0 ? (
                            <Badge variant="secondary" className="h-5 text-[10px] px-1.5">
                              {tierCount}
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">—</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* RIGHT — editor */}
          <div className="space-y-4">
            {/* Service header */}
            <Card>
              <CardContent className="p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[220px]">
                  <Label className="text-xs text-muted-foreground">Service title</Label>
                  <Input
                    value={current.service_title}
                    onChange={(e) => update({ service_title: e.target.value })}
                    className="mt-1 font-semibold"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Live page</Label>
                  <a
                    href={selectedSvc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 flex items-center gap-1.5 text-sm text-primary hover:underline h-10 px-3 rounded-md border bg-muted/30"
                  >
                    {selectedSvc.url}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
                <div className="flex items-center gap-2 h-10 px-3 rounded-md border">
                  <Switch
                    checked={current.is_enabled}
                    onCheckedChange={(v) => update({ is_enabled: v })}
                  />
                  <Label className="text-sm">Show on frontend</Label>
                </div>
              </CardContent>
            </Card>

            {/* Action bar */}
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={addTier} variant="outline" size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Add tier
              </Button>
              <div className="flex-1" />
              <Button onClick={save} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </Button>
            </div>

            {/* Tiers */}
            {current.tiers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">No pricing tiers yet for this service.</p>
                  <Button onClick={addTier} variant="outline" className="gap-1.5">
                    <Plus className="h-4 w-4" /> Add first tier
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {current.tiers.map((tier, i) => (
                  <Card key={tier.id} className={tier.highlighted ? "border-primary" : ""}>
                    <CardHeader className="flex flex-row items-center justify-between gap-2 py-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">#{i + 1}</Badge>
                        <CardTitle className="text-base">{tier.name || "Untitled tier"}</CardTitle>
                        {tier.highlighted && (
                          <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/15">
                            <Star className="h-3 w-3" /> Featured
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => moveTier(i, -1)} disabled={i === 0}>
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => moveTier(i, 1)}
                          disabled={i === current.tiers.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => removeTier(i)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Tier name</Label>
                          <Input
                            value={tier.name}
                            onChange={(e) => updateTier(i, { name: e.target.value })}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Period</Label>
                          <Select
                            value={tier.period}
                            onValueChange={(v) => updateTier(i, { period: v })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="one-time">one-time</SelectItem>
                              <SelectItem value="/month">/month</SelectItem>
                              <SelectItem value="per project">per project</SelectItem>
                              <SelectItem value="/hour">/hour</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Short description</Label>
                        <Input
                          value={tier.description || ""}
                          onChange={(e) => updateTier(i, { description: e.target.value })}
                          className="mt-1"
                          placeholder="One-line value statement"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">CTA type</Label>
                          <Select
                            value={tier.cta_type}
                            onValueChange={(v) =>
                              updateTier(i, {
                                cta_type: v,
                                price_usd: v === "quote" ? null : (tier.price_usd ?? 99),
                              })
                            }
                          >
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Fixed price (buy)</SelectItem>
                              <SelectItem value="quote">Custom quote</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Price (USD)</Label>
                          <Input
                            type="number"
                            disabled={tier.cta_type === "quote"}
                            value={tier.price_usd ?? ""}
                            onChange={(e) =>
                              updateTier(i, {
                                price_usd: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Button label</Label>
                        <Input
                          value={tier.cta_label || ""}
                          onChange={(e) => updateTier(i, { cta_label: e.target.value })}
                          className="mt-1"
                          placeholder={tier.cta_type === "quote" ? "Get Custom Quote" : "Choose plan"}
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold">Tier Features</Label>
                        
                        {/* List of current features */}
                        <div className="space-y-1.5 mt-1.5">
                          {tier.features.map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground select-none">·</span>
                              <Input
                                value={feat}
                                onChange={(e) => {
                                  const newFeats = [...tier.features];
                                  newFeats[fIdx] = e.target.value;
                                  updateTier(i, { features: newFeats });
                                }}
                                className="h-8 text-xs flex-1 font-medium text-foreground bg-card"
                                placeholder={`Feature #${fIdx + 1}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  const newFeats = tier.features.filter((_, k) => k !== fIdx);
                                  updateTier(i, { features: newFeats });
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>

                        {/* Add new feature input */}
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            id={`new-feat-${i}`}
                            placeholder="Type a feature and press Enter..."
                            className="h-8 text-xs flex-1"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const val = e.currentTarget.value.trim();
                                if (val) {
                                  updateTier(i, { features: [...tier.features, val] });
                                  e.currentTarget.value = "";
                                }
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 gap-1 text-xs"
                            onClick={() => {
                              const input = document.getElementById(`new-feat-${i}`) as HTMLInputElement;
                              if (input) {
                                const val = input.value.trim();
                                if (val) {
                                  updateTier(i, { features: [...tier.features, val] });
                                  input.value = "";
                                }
                              }
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" /> Add
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Switch
                          checked={!!tier.highlighted}
                          onCheckedChange={(v) => {
                            const next = current.tiers.map((t, k) => ({
                              ...t,
                              highlighted: k === i ? v : false,
                            }));
                            update({ tiers: next });
                          }}
                        />
                        <Label className="text-sm">Mark as featured / most popular</Label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Quote settings */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base">Quote request settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={current.quote_settings.enable_contact}
                      onCheckedChange={(v) =>
                        update({ quote_settings: { ...current.quote_settings, enable_contact: v } })
                      }
                    />
                    <Label className="text-sm">Contact form link</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={current.quote_settings.enable_modal}
                      onCheckedChange={(v) =>
                        update({ quote_settings: { ...current.quote_settings, enable_modal: v } })
                      }
                    />
                    <Label className="text-sm">Quote modal</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={current.quote_settings.enable_whatsapp}
                      onCheckedChange={(v) =>
                        update({ quote_settings: { ...current.quote_settings, enable_whatsapp: v } })
                      }
                    />
                    <Label className="text-sm">WhatsApp button</Label>
                  </div>
                </div>
                {current.quote_settings.enable_whatsapp && (
                  <div>
                    <Label className="text-xs">WhatsApp number (with country code)</Label>
                    <Input
                      value={current.quote_settings.whatsapp_number}
                      onChange={(e) =>
                        update({
                          quote_settings: { ...current.quote_settings, whatsapp_number: e.target.value },
                        })
                      }
                      className="mt-1"
                      placeholder="+8801XXXXXXXXX"
                    />
                  </div>
                )}
                <div>
                  <Label className="text-xs">Quote prompt message</Label>
                  <Textarea
                    rows={2}
                    value={current.quote_settings.quote_message}
                    onChange={(e) =>
                      update({
                        quote_settings: { ...current.quote_settings, quote_message: e.target.value },
                      })
                    }
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sticky save bar */}
            <div className="sticky bottom-4 z-10">
              <Card className="shadow-lg border-primary/20">
                <CardContent className="p-3 flex items-center justify-between gap-3 bg-card">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Editing <strong className="text-foreground">{current.service_title}</strong> —{" "}
                    {current.tiers.length} tier{current.tiers.length === 1 ? "" : "s"}
                  </div>
                  <Button onClick={save} disabled={saving} className="gap-1.5">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
