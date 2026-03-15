"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Store,
  Clock,
  Truck,
  DollarSign,
  Percent,
  Plus,
  Trash2,
  Pause,
  Play,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────

interface Settings {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  isOpen: boolean;
  isPausedToday: boolean;
  deliveryEnabled: boolean;
  deliveryRadiusMiles: number;
  deliveryFeeFixed: number;
  deliveryMinOrder: number;
  pickupEstimateMin: number;
  pickupEstimateMax: number;
  deliveryEstimateMin: number;
  deliveryEstimateMax: number;
  taxRate: number;
  hours: {
    id: string;
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }[];
}

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discountType: "FLAT_AMOUNT" | "PERCENTAGE";
  discountValue: number;
  minimumOrder: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ─── Data Fetching ─────────────────────────────────

async function fetchSettings(): Promise<Settings> {
  const res = await fetch("/api/admin/settings");
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

async function fetchPromoCodes(): Promise<PromoCode[]> {
  const res = await fetch("/api/admin/promo-codes");
  if (!res.ok) throw new Error("Failed to fetch promo codes");
  return res.json();
}

// ─── Main Component ─────────────────────────────────

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"general" | "hours" | "delivery" | "promos">("general");

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: fetchSettings,
  });

  const { data: promoCodes, isLoading: promosLoading } = useQuery({
    queryKey: ["admin", "promo-codes"],
    queryFn: fetchPromoCodes,
  });

  const updateSettings = useMutation({
    mutationFn: async (data: Partial<Settings>) => {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Settings updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isLoading = settingsLoading || promosLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!settings) return null;

  const tabs = [
    { id: "general" as const, label: "General", icon: Store },
    { id: "hours" as const, label: "Hours", icon: Clock },
    { id: "delivery" as const, label: "Delivery", icon: Truck },
    { id: "promos" as const, label: "Promo Codes", icon: Tag },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Quick Toggles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          onClick={() => updateSettings.mutate({ isOpen: !settings.isOpen })}
          className={cn(
            "flex items-center gap-3 rounded-xl border p-4 transition-colors",
            settings.isOpen
              ? "border-emerald-500/30 bg-emerald-500/10"
              : "border-red-500/30 bg-red-500/10"
          )}
        >
          <div
            className={cn(
              "h-3 w-3 rounded-full",
              settings.isOpen ? "bg-emerald-400" : "bg-red-400"
            )}
          />
          <span className="text-sm font-medium">
            {settings.isOpen ? "Open" : "Closed"}
          </span>
        </button>
        <button
          onClick={() => updateSettings.mutate({ isPausedToday: !settings.isPausedToday })}
          className={cn(
            "flex items-center gap-3 rounded-xl border p-4 transition-colors",
            settings.isPausedToday
              ? "border-yellow-500/30 bg-yellow-500/10"
              : "border-border/50"
          )}
        >
          {settings.isPausedToday ? (
            <Pause className="h-4 w-4 text-yellow-400" />
          ) : (
            <Play className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">
            {settings.isPausedToday ? "Paused Today" : "Not Paused"}
          </span>
        </button>
        <button
          onClick={() => updateSettings.mutate({ deliveryEnabled: !settings.deliveryEnabled })}
          className={cn(
            "flex items-center gap-3 rounded-xl border p-4 transition-colors",
            settings.deliveryEnabled
              ? "border-primary/30 bg-primary/10"
              : "border-border/50"
          )}
        >
          <Truck
            className={cn(
              "h-4 w-4",
              settings.deliveryEnabled ? "text-primary" : "text-muted-foreground"
            )}
          />
          <span className="text-sm font-medium">
            Delivery {settings.deliveryEnabled ? "On" : "Off"}
          </span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "general" && (
        <GeneralSettings settings={settings} onSave={(data) => updateSettings.mutate(data)} />
      )}
      {activeTab === "hours" && (
        <HoursSettings settings={settings} />
      )}
      {activeTab === "delivery" && (
        <DeliverySettings settings={settings} onSave={(data) => updateSettings.mutate(data)} />
      )}
      {activeTab === "promos" && (
        <PromoSettings promoCodes={promoCodes ?? []} />
      )}
    </div>
  );
}

// ─── General Settings ─────────────────────────────────

function GeneralSettings({
  settings,
  onSave,
}: {
  settings: Settings;
  onSave: (data: Partial<Settings>) => void;
}) {
  const [name, setName] = useState(settings.name);
  const [phone, setPhone] = useState(settings.phone ?? "");
  const [address, setAddress] = useState(settings.address ?? "");
  const [taxRate, setTaxRate] = useState((settings.taxRate * 100).toFixed(1));
  const [pickupMin, setPickupMin] = useState(settings.pickupEstimateMin.toString());
  const [pickupMax, setPickupMax] = useState(settings.pickupEstimateMax.toString());

  return (
    <div className="space-y-6 rounded-xl border border-border/50 bg-card/50 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Restaurant Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Address</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" />
        </div>
        <div className="space-y-2">
          <Label>Tax Rate (%)</Label>
          <Input type="number" step="0.1" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Pickup Estimate (min)</Label>
          <div className="flex items-center gap-2">
            <Input type="number" value={pickupMin} onChange={(e) => setPickupMin(e.target.value)} className="w-20" />
            <span className="text-muted-foreground">to</span>
            <Input type="number" value={pickupMax} onChange={(e) => setPickupMax(e.target.value)} className="w-20" />
            <span className="text-sm text-muted-foreground">minutes</span>
          </div>
        </div>
      </div>
      <Button
        onClick={() =>
          onSave({
            name,
            phone: phone || null,
            address: address || null,
            taxRate: parseFloat(taxRate) / 100,
            pickupEstimateMin: parseInt(pickupMin),
            pickupEstimateMax: parseInt(pickupMax),
          })
        }
      >
        Save Changes
      </Button>
    </div>
  );
}

// ─── Business Hours ─────────────────────────────────

function HoursSettings({ settings }: { settings: Settings }) {
  const queryClient = useQueryClient();

  const defaultHours = DAY_NAMES.map((_, i) => {
    const existing = settings.hours.find((h) => h.dayOfWeek === i);
    return {
      dayOfWeek: i,
      openTime: existing?.openTime ?? "11:00",
      closeTime: existing?.closeTime ?? "22:00",
      isClosed: existing?.isClosed ?? false,
    };
  });

  const [hours, setHours] = useState(defaultHours);

  const saveHours = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/settings/hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Business hours updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 rounded-xl border border-border/50 bg-card/50 p-6">
      <div className="space-y-3">
        {hours.map((h, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-24 text-sm font-medium">{DAY_NAMES[i]}</span>
            <Switch
              checked={!h.isClosed}
              onCheckedChange={(open) =>
                setHours((prev) =>
                  prev.map((hh, j) => (j === i ? { ...hh, isClosed: !open } : hh))
                )
              }
            />
            {!h.isClosed ? (
              <>
                <Input
                  type="time"
                  value={h.openTime}
                  onChange={(e) =>
                    setHours((prev) =>
                      prev.map((hh, j) =>
                        j === i ? { ...hh, openTime: e.target.value } : hh
                      )
                    )
                  }
                  className="w-32"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={h.closeTime}
                  onChange={(e) =>
                    setHours((prev) =>
                      prev.map((hh, j) =>
                        j === i ? { ...hh, closeTime: e.target.value } : hh
                      )
                    )
                  }
                  className="w-32"
                />
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Closed</span>
            )}
          </div>
        ))}
      </div>
      <Button onClick={() => saveHours.mutate()} disabled={saveHours.isPending}>
        Save Hours
      </Button>
    </div>
  );
}

// ─── Delivery Settings ─────────────────────────────────

function DeliverySettings({
  settings,
  onSave,
}: {
  settings: Settings;
  onSave: (data: Partial<Settings>) => void;
}) {
  const [radius, setRadius] = useState(settings.deliveryRadiusMiles.toString());
  const [fee, setFee] = useState((settings.deliveryFeeFixed / 100).toFixed(2));
  const [minOrder, setMinOrder] = useState((settings.deliveryMinOrder / 100).toFixed(2));
  const [delMin, setDelMin] = useState(settings.deliveryEstimateMin.toString());
  const [delMax, setDelMax] = useState(settings.deliveryEstimateMax.toString());

  return (
    <div className="space-y-6 rounded-xl border border-border/50 bg-card/50 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Delivery Radius (miles)</Label>
          <Input type="number" step="0.5" value={radius} onChange={(e) => setRadius(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Delivery Fee ($)</Label>
          <Input type="number" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Minimum Order ($)</Label>
          <Input type="number" step="0.01" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Delivery Estimate (min)</Label>
          <div className="flex items-center gap-2">
            <Input type="number" value={delMin} onChange={(e) => setDelMin(e.target.value)} className="w-20" />
            <span className="text-muted-foreground">to</span>
            <Input type="number" value={delMax} onChange={(e) => setDelMax(e.target.value)} className="w-20" />
          </div>
        </div>
      </div>
      <Button
        onClick={() =>
          onSave({
            deliveryRadiusMiles: parseFloat(radius),
            deliveryFeeFixed: Math.round(parseFloat(fee) * 100),
            deliveryMinOrder: Math.round(parseFloat(minOrder) * 100),
            deliveryEstimateMin: parseInt(delMin),
            deliveryEstimateMax: parseInt(delMax),
          })
        }
      >
        Save Delivery Settings
      </Button>
    </div>
  );
}

// ─── Promo Code Settings ─────────────────────────────────

function PromoSettings({ promoCodes }: { promoCodes: PromoCode[] }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const togglePromo = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/promo-codes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "promo-codes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePromo = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/promo-codes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "promo-codes"] });
      toast.success("Promo code deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createPromo = useMutation({
    mutationFn: async (data: {
      code: string;
      description?: string;
      discountType: "FLAT_AMOUNT" | "PERCENTAGE";
      discountValue: number;
      minimumOrder?: number | null;
      maxUses?: number | null;
      expiresAt?: string | null;
    }) => {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "promo-codes"] });
      toast.success("Promo code created");
      setShowCreate(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {promoCodes.length} promo code{promoCodes.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Code
        </Button>
      </div>

      <div className="space-y-2">
        {promoCodes.map((promo) => (
          <div
            key={promo.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 px-4 py-3",
              !promo.isActive && "opacity-50"
            )}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <code className="rounded bg-muted px-2 py-0.5 text-sm font-mono font-semibold">
                  {promo.code}
                </code>
                <span className="text-xs text-muted-foreground">
                  {promo.discountType === "FLAT_AMOUNT"
                    ? formatPrice(promo.discountValue)
                    : `${(promo.discountValue / 100).toFixed(0)}%`}{" "}
                  off
                </span>
              </div>
              {promo.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {promo.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                Used {promo.usedCount}
                {promo.maxUses ? `/${promo.maxUses}` : ""} times
                {promo.minimumOrder
                  ? ` · Min ${formatPrice(promo.minimumOrder)}`
                  : ""}
                {promo.expiresAt
                  ? ` · Expires ${new Date(promo.expiresAt).toLocaleDateString()}`
                  : ""}
              </p>
            </div>
            <Switch
              checked={promo.isActive}
              onCheckedChange={(checked) =>
                togglePromo.mutate({ id: promo.id, isActive: checked })
              }
            />
            <button
              onClick={() => {
                if (confirm(`Delete promo code "${promo.code}"?`)) {
                  deletePromo.mutate(promo.id);
                }
              }}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {promoCodes.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No promo codes yet
          </div>
        )}
      </div>

      {showCreate && (
        <CreatePromoModal
          onClose={() => setShowCreate(false)}
          onCreate={(data) => createPromo.mutate(data)}
        />
      )}
    </div>
  );
}

// ─── Create Promo Modal ─────────────────────────────────

function CreatePromoModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: {
    code: string;
    description?: string;
    discountType: "FLAT_AMOUNT" | "PERCENTAGE";
    discountValue: number;
    minimumOrder?: number | null;
    maxUses?: number | null;
    expiresAt?: string | null;
  }) => void;
}) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"FLAT_AMOUNT" | "PERCENTAGE">("PERCENTAGE");
  const [valueStr, setValueStr] = useState("");
  const [minOrderStr, setMinOrderStr] = useState("");
  const [maxUsesStr, setMaxUsesStr] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-border/50 bg-background p-6 shadow-xl">
        <h2 className="text-lg font-semibold">New Promo Code</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!code.trim() || !valueStr) return;

            let discountValue: number;
            if (discountType === "PERCENTAGE") {
              discountValue = Math.round(parseFloat(valueStr) * 100); // basis points
            } else {
              discountValue = Math.round(parseFloat(valueStr) * 100); // cents
            }

            onCreate({
              code: code.trim(),
              description: description.trim() || undefined,
              discountType,
              discountValue,
              minimumOrder: minOrderStr
                ? Math.round(parseFloat(minOrderStr) * 100)
                : null,
              maxUses: maxUsesStr ? parseInt(maxUsesStr) : null,
              expiresAt: expiresAt || null,
            });
          }}
          className="mt-4 space-y-4"
        >
          <div className="space-y-2">
            <Label>Code</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER25"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summer sale discount"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                value={discountType}
                onChange={(e) =>
                  setDiscountType(e.target.value as "FLAT_AMOUNT" | "PERCENTAGE")
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FLAT_AMOUNT">Flat Amount</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>
                {discountType === "PERCENTAGE" ? "Discount (%)" : "Amount ($)"}
              </Label>
              <Input
                type="number"
                step={discountType === "PERCENTAGE" ? "1" : "0.01"}
                value={valueStr}
                onChange={(e) => setValueStr(e.target.value)}
                placeholder={discountType === "PERCENTAGE" ? "10" : "5.00"}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Min Order ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={minOrderStr}
                onChange={(e) => setMinOrderStr(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Uses</Label>
              <Input
                type="number"
                value={maxUsesStr}
                onChange={(e) => setMaxUsesStr(e.target.value)}
                placeholder="Unlimited"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Expires At</Label>
            <Input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <Separator />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!code.trim() || !valueStr}>
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
