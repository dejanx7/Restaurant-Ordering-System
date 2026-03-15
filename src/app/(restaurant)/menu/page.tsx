"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { formatPrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  _count: { items: number };
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isAvailable: boolean;
  isArchived: boolean;
  tags: string[];
  categoryId: string;
  category: { id: string; name: string };
  modifierGroups: {
    id: string;
    name: string;
    required: boolean;
    minSelect: number;
    maxSelect: number;
    modifiers: {
      id: string;
      name: string;
      priceAdjustment: number;
      isDefault: boolean;
      isAvailable: boolean;
    }[];
  }[];
}

// ─── Data Fetching ─────────────────────────────────

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/api/admin/categories");
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

async function fetchMenuItems(): Promise<MenuItem[]> {
  const res = await fetch("/api/admin/menu-items");
  if (!res.ok) throw new Error("Failed to fetch menu items");
  return res.json();
}

// ─── Tag Colors ─────────────────────────────────

const tagColors: Record<string, string> = {
  VEGAN: "bg-green-500/10 text-green-400",
  VEGETARIAN: "bg-emerald-500/10 text-emerald-400",
  GLUTEN_FREE: "bg-amber-500/10 text-amber-400",
  DAIRY_FREE: "bg-blue-500/10 text-blue-400",
  SPICY: "bg-red-500/10 text-red-400",
  NUT_FREE: "bg-purple-500/10 text-purple-400",
};

const tagLabels: Record<string, string> = {
  VEGAN: "Vegan",
  VEGETARIAN: "Vegetarian",
  GLUTEN_FREE: "GF",
  DAIRY_FREE: "DF",
  SPICY: "Spicy",
  NUT_FREE: "NF",
};

const ALL_TAGS = ["VEGAN", "VEGETARIAN", "GLUTEN_FREE", "DAIRY_FREE", "SPICY", "NUT_FREE"] as const;

// ─── Main Component ─────────────────────────────────

export default function MenuManagementPage() {
  const queryClient = useQueryClient();

  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: fetchCategories,
  });

  const { data: menuItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["admin", "menu-items"],
    queryFn: fetchMenuItems,
  });

  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItemCategoryId, setNewItemCategoryId] = useState<string | null>(null);
  const [showModifierModal, setShowModifierModal] = useState(false);
  const [modifierItemId, setModifierItemId] = useState<string | null>(null);

  const toggleCategory = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Category Mutations ─────────────────────────────

  const createCategory = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      toast.success("Category created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; isActive?: boolean }) => {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      toast.success("Category updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      toast.success("Category deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ─── Item Mutations ─────────────────────────────

  const toggleAvailability = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
      const res = await fetch(`/api/admin/menu-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onMutate: async ({ id, isAvailable }) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "menu-items"] });
      queryClient.setQueryData<MenuItem[]>(["admin", "menu-items"], (old) =>
        old?.map((item) => (item.id === id ? { ...item, isAvailable } : item))
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu-items"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createItem = useMutation({
    mutationFn: async (data: { categoryId: string; name: string; description?: string; price: number; tags?: string[] }) => {
      const res = await fetch("/api/admin/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      toast.success("Item created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string | null; price?: number; categoryId?: string; tags?: string[] }) => {
      const res = await fetch(`/api/admin/menu-items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu-items"] });
      toast.success("Item updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveItem = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/menu-items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      toast.success("Item archived");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ─── Modifier Mutations ─────────────────────────────

  const createModifierGroup = useMutation({
    mutationFn: async (data: {
      menuItemId: string;
      name: string;
      required?: boolean;
      minSelect?: number;
      maxSelect?: number;
      modifiers: { name: string; priceAdjustment?: number; isDefault?: boolean }[];
    }) => {
      const res = await fetch("/api/admin/modifier-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu-items"] });
      toast.success("Modifier group added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteModifierGroup = useMutation({
    mutationFn: async (groupId: string) => {
      const res = await fetch(`/api/admin/modifier-groups/${groupId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu-items"] });
      toast.success("Modifier group removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isLoading = catLoading || itemsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const itemsByCategory = new Map<string, MenuItem[]>();
  menuItems?.forEach((item) => {
    const list = itemsByCategory.get(item.categoryId) ?? [];
    list.push(item);
    itemsByCategory.set(item.categoryId, list);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <Button
          size="sm"
          onClick={() => {
            setEditingCategory(null);
            setShowCategoryModal(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Categories & Items */}
      <div className="space-y-3">
        {categories?.map((cat) => {
          const isExpanded = expandedCats.has(cat.id);
          const items = itemsByCategory.get(cat.id) ?? [];

          return (
            <div
              key={cat.id}
              className="rounded-xl border border-border/50 bg-card/50 overflow-hidden"
            >
              {/* Category Header */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleCategory(cat.id)}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="flex-1 font-medium">{cat.name}</span>
                <span className="text-xs text-muted-foreground">
                  {cat._count.items} items
                </span>
                <div
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    cat.isActive
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  )}
                >
                  {cat.isActive ? "Active" : "Hidden"}
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() =>
                      updateCategory.mutate({
                        id: cat.id,
                        isActive: !cat.isActive,
                      })
                    }
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title={cat.isActive ? "Hide category" : "Show category"}
                  >
                    {cat.isActive ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setShowCategoryModal(true);
                    }}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete category "${cat.name}"?`)) {
                        deleteCategory.mutate(cat.id);
                      }
                    }}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Items */}
              {isExpanded && (
                <div className="border-t border-border/30">
                  {items.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No items in this category
                    </div>
                  ) : (
                    <div className="divide-y divide-border/20">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3",
                            !item.isAvailable && "opacity-50"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">
                                {item.name}
                              </p>
                              {item.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={cn(
                                    "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                                    tagColors[tag]
                                  )}
                                >
                                  {tagLabels[tag]}
                                </span>
                              ))}
                            </div>
                            {item.description && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {item.description}
                              </p>
                            )}
                            {item.modifierGroups.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.modifierGroups.length} modifier group
                                {item.modifierGroups.length > 1 ? "s" : ""}
                              </p>
                            )}
                          </div>
                          <span className="text-sm font-medium whitespace-nowrap">
                            {formatPrice(item.price)}
                          </span>
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={item.isAvailable}
                              onCheckedChange={(checked) =>
                                toggleAvailability.mutate({
                                  id: item.id,
                                  isAvailable: checked,
                                })
                              }
                            />
                            <button
                              onClick={() => {
                                setModifierItemId(item.id);
                                setShowModifierModal(true);
                              }}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-xs"
                              title="Manage modifiers"
                            >
                              +Mod
                            </button>
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setShowItemModal(true);
                              }}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Archive "${item.name}"?`)) {
                                  archiveItem.mutate(item.id);
                                }
                              }}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-colors"
                            >
                              <Archive className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="border-t border-border/30 px-4 py-2">
                    <button
                      onClick={() => {
                        setNewItemCategoryId(cat.id);
                        setEditingItem(null);
                        setShowItemModal(true);
                      }}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add item
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setShowCategoryModal(false)}
          onSave={(name) => {
            if (editingCategory) {
              updateCategory.mutate({ id: editingCategory.id, name });
            } else {
              createCategory.mutate(name);
            }
            setShowCategoryModal(false);
          }}
        />
      )}

      {/* Item Modal */}
      {showItemModal && (
        <ItemModal
          item={editingItem}
          categoryId={newItemCategoryId}
          categories={categories ?? []}
          onClose={() => {
            setShowItemModal(false);
            setEditingItem(null);
            setNewItemCategoryId(null);
          }}
          onSave={(data) => {
            if (editingItem) {
              updateItem.mutate({ id: editingItem.id, ...data });
            } else {
              createItem.mutate(data as { categoryId: string; name: string; price: number; description?: string; tags?: string[] });
            }
            setShowItemModal(false);
            setEditingItem(null);
            setNewItemCategoryId(null);
          }}
        />
      )}

      {/* Modifier Modal */}
      {showModifierModal && modifierItemId && (
        <ModifierModal
          item={menuItems?.find((i) => i.id === modifierItemId) ?? null}
          onClose={() => {
            setShowModifierModal(false);
            setModifierItemId(null);
          }}
          onAdd={(data) => {
            createModifierGroup.mutate({ menuItemId: modifierItemId, ...data });
          }}
          onDeleteGroup={(groupId) => {
            deleteModifierGroup.mutate(groupId);
          }}
        />
      )}
    </div>
  );
}

// ─── Category Modal ─────────────────────────────────

function CategoryModal({
  category,
  onClose,
  onSave,
}: {
  category: Category | null;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-xl border border-border/50 bg-background p-6 shadow-xl">
        <h2 className="text-lg font-semibold">
          {category ? "Edit Category" : "New Category"}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onSave(name.trim());
          }}
          className="mt-4 space-y-4"
        >
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Appetizers"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {category ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Item Modal ─────────────────────────────────

function ItemModal({
  item,
  categoryId,
  categories,
  onClose,
  onSave,
}: {
  item: MenuItem | null;
  categoryId: string | null;
  categories: Category[];
  onClose: () => void;
  onSave: (data: {
    categoryId?: string;
    name?: string;
    description?: string | null;
    price?: number;
    tags?: string[];
  }) => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [priceStr, setPriceStr] = useState(
    item ? (item.price / 100).toFixed(2) : ""
  );
  const [catId, setCatId] = useState(item?.categoryId ?? categoryId ?? "");
  const [tags, setTags] = useState<string[]>(item?.tags ?? []);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border/50 bg-background p-6 shadow-xl">
        <h2 className="text-lg font-semibold">
          {item ? "Edit Item" : "New Menu Item"}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const price = Math.round(parseFloat(priceStr) * 100);
            if (!name.trim() || isNaN(price)) return;
            onSave({
              categoryId: catId,
              name: name.trim(),
              description: description.trim() || null,
              price,
              tags,
            });
          }}
          className="mt-4 space-y-4"
        >
          <div className="space-y-2">
            <Label>Category</Label>
            <select
              value={catId}
              onChange={(e) => setCatId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Classic Burger"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label>Price ($)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={priceStr}
              onChange={(e) => setPriceStr(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label>Dietary Tags</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                    tags.includes(tag)
                      ? `${tagColors[tag]} border-current`
                      : "border-border/50 text-muted-foreground hover:border-border"
                  )}
                >
                  {tagLabels[tag]}
                </button>
              ))}
            </div>
          </div>
          <Separator />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !priceStr || !catId}>
              {item ? "Save" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modifier Modal ─────────────────────────────────

function ModifierModal({
  item,
  onClose,
  onAdd,
  onDeleteGroup,
}: {
  item: MenuItem | null;
  onClose: () => void;
  onAdd: (data: {
    name: string;
    required?: boolean;
    minSelect?: number;
    maxSelect?: number;
    modifiers: { name: string; priceAdjustment?: number; isDefault?: boolean }[];
  }) => void;
  onDeleteGroup: (groupId: string) => void;
}) {
  const [groupName, setGroupName] = useState("");
  const [required, setRequired] = useState(false);
  const [maxSelect, setMaxSelect] = useState(1);
  const [modifiers, setModifiers] = useState<
    { name: string; priceAdjustment: string }[]
  >([{ name: "", priceAdjustment: "" }]);

  const addModifier = () => {
    setModifiers((prev) => [...prev, { name: "", priceAdjustment: "" }]);
  };

  const updateModifier = (
    index: number,
    field: "name" | "priceAdjustment",
    value: string
  ) => {
    setModifiers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const removeModifier = (index: number) => {
    setModifiers((prev) => prev.filter((_, i) => i !== index));
  };

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-border/50 bg-background p-6 shadow-xl">
        <h2 className="text-lg font-semibold">
          Modifiers for {item.name}
        </h2>

        {/* Existing Groups */}
        {item.modifierGroups.length > 0 && (
          <div className="mt-4 space-y-2">
            <Label className="text-xs text-muted-foreground">Existing Groups</Label>
            {item.modifierGroups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between rounded-lg border border-border/30 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">
                    {group.name}
                    {group.required && (
                      <span className="ml-1.5 text-xs text-red-400">
                        Required
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {group.modifiers.map((m) => m.name).join(", ")}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete modifier group "${group.name}"?`)) {
                      onDeleteGroup(group.id);
                    }
                  }}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-500/20 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Separator className="my-4" />

        {/* Add New Group */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const validMods = modifiers
              .filter((m) => m.name.trim())
              .map((m) => ({
                name: m.name.trim(),
                priceAdjustment: m.priceAdjustment
                  ? Math.round(parseFloat(m.priceAdjustment) * 100)
                  : 0,
              }));
            if (!groupName.trim() || validMods.length === 0) return;
            onAdd({
              name: groupName.trim(),
              required,
              minSelect: required ? 1 : 0,
              maxSelect,
              modifiers: validMods,
            });
            setGroupName("");
            setModifiers([{ name: "", priceAdjustment: "" }]);
            setRequired(false);
            setMaxSelect(1);
          }}
          className="space-y-4"
        >
          <h3 className="text-sm font-semibold">Add Modifier Group</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Size"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Selections</Label>
              <Input
                type="number"
                min={1}
                value={maxSelect}
                onChange={(e) => setMaxSelect(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={required} onCheckedChange={setRequired} />
            <Label className="text-sm">Required</Label>
          </div>

          <div className="space-y-2">
            <Label>Options</Label>
            {modifiers.map((mod, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={mod.name}
                  onChange={(e) => updateModifier(i, "name", e.target.value)}
                  placeholder="Option name"
                  className="flex-1"
                />
                <Input
                  type="number"
                  step="0.01"
                  value={mod.priceAdjustment}
                  onChange={(e) =>
                    updateModifier(i, "priceAdjustment", e.target.value)
                  }
                  placeholder="+$0.00"
                  className="w-24"
                />
                {modifiers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeModifier(i)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addModifier}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              <Plus className="h-3 w-3" />
              Add option
            </button>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Done
            </Button>
            <Button
              type="submit"
              disabled={!groupName.trim() || modifiers.every((m) => !m.name.trim())}
            >
              Add Group
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
