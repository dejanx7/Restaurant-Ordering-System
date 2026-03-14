"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MenuHeroProps {
  restaurantName: string;
  isOpen: boolean;
  pickupEstimate: string;
  deliveryEstimate: string;
}

export function MenuHero({
  restaurantName,
  isOpen,
  pickupEstimate,
  deliveryEstimate,
}: MenuHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/50">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <Badge
              variant={isOpen ? "default" : "destructive"}
              className="gap-1.5"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isOpen ? "bg-emerald-300 animate-pulse" : "bg-red-300"
                }`}
              />
              {isOpen ? "Open Now" : "Closed"}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-yellow-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-medium">4.8</span>
              <span className="text-muted-foreground">(120+)</span>
            </div>
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {restaurantName}
          </h1>

          <p className="max-w-lg text-lg text-muted-foreground">
            Fresh, delicious food prepared with care. Order for pickup or
            delivery.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-4 py-2.5 backdrop-blur-sm">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="text-sm font-medium">{pickupEstimate}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-card/50 px-4 py-2.5 backdrop-blur-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Delivery</p>
                <p className="text-sm font-medium">{deliveryEstimate}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
