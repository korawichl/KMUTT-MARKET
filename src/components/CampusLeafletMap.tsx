"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { Shop, Category, ShopSchedule } from "@/types/database";
import { getShopOpeningStatus, SHOP_TYPE_LABELS } from "@/lib/utils";

interface CampusLeafletMapProps {
  shops: Shop[];
  categories: Category[];
  schedules: ShopSchedule[];
  center?: [number, number];
  zoom?: number;
  selectedShopId?: string | null;
  userCoords?: [number, number] | null;
  heightClass?: string;
}

export default function CampusLeafletMap({
  shops,
  categories,
  schedules,
  center = [13.6511, 100.4945],
  zoom = 16,
  selectedShopId = null,
  userCoords = null,
  heightClass = "h-[520px]",
}: CampusLeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | KMUTT MARKET',
      maxZoom: 19,
    }).addTo(map);

    // Draw KMUTT Market S2 Plaza highlight circle
    L.circle([13.65048, 100.49565], {
      color: "#A6192E",
      fillColor: "#A6192E",
      fillOpacity: 0.14,
      radius: 45,
      weight: 2,
    })
      .addTo(map)
      .bindTooltip("ลานตลาดนัด มจธ. (ชั้น 1 อาคารจอดรถ S2)", {
        direction: "top",
      });

    // Draw S14 Food Court highlight circle
    L.circle([13.650954, 100.491752], {
      color: "#761626",
      fillColor: "#FFF8F0",
      fillOpacity: 0.35,
      radius: 42,
      weight: 2,
    })
      .addTo(map)
      .bindTooltip("โรงอาหารอาคาร 190 ปี (S14)", {
        direction: "top",
      });

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    markersLayerRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    shops.forEach((shop) => {
      if (shop.latitude === null || shop.longitude === null) return;

      const cat = categories.find((c) => c.id === shop.category_id);
      const opening = getShopOpeningStatus(shop, schedules);
      const isSelected = selectedShopId === shop.id;
      const bgColor = isSelected
        ? "#761626"
        : shop.shop_type === "market_stall"
        ? "#A6192E"
        : shop.shop_type === "campus_food_court"
        ? "#B45309"
        : "#16A34A";

      const customIcon = L.divIcon({
        className: "kmutt-custom-marker",
        html: `<div style="
          display:flex;
          align-items:center;
          justify-content:center;
          width:${isSelected ? 38 : 32}px;
          height:${isSelected ? 38 : 32}px;
          border-radius:9999px;
          background:${bgColor};
          color:#FFFFFF;
          font-weight:700;
          font-size:12px;
          border:3px solid #FFFFFF;
          box-shadow:0 4px 12px rgba(0,0,0,0.28);
        ">${
          shop.stall_number
            ? shop.stall_number.replace("S14-", "")
            : shop.building_name.match(/S\d+|N\d+/)?.[0] || "มจธ"
        }</div>`,
        iconSize: [isSelected ? 38 : 32, isSelected ? 38 : 32],
        iconAnchor: [isSelected ? 19 : 16, isSelected ? 19 : 16],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([shop.latitude, shop.longitude], {
        icon: customIcon,
      });

      const locationAccuracyBadge = shop.location_verified
        ? `<span style="display:inline-block;background:#DCFCE7;color:#166534;padding:2px 8px;border-radius:99px;font-size:12px;font-weight:600;">พิกัดอาคารยืนยันแล้ว</span>`
        : `<span style="display:inline-block;background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:99px;font-size:12px;font-weight:600;">ตำแหน่งโดยประมาณในโซนตลาดนัด</span>`;

      const popupHtml = `
        <div style="width:240px;padding:4px;font-family:sans-serif;">
          <img src="${shop.cover_image_url}" alt="${shop.name}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />
          <div style="margin-bottom:4px;">${locationAccuracyBadge}</div>
          <div style="font-weight:700;font-size:15px;color:#222222;margin-bottom:2px;">${shop.name}</div>
          <div style="font-size:13px;color:#525252;margin-bottom:4px;">
            ${cat?.name || "ร้านค้า"} • ${SHOP_TYPE_LABELS[shop.shop_type].label}
          </div>
          <div style="font-size:13px;color:#222222;margin-bottom:4px;">
            <strong>สถานที่:</strong> ${shop.building_name} ${shop.stall_number ? `(ล็อก ${shop.stall_number})` : ""}
          </div>
          <div style="font-size:13px;color:#16A34A;font-weight:600;margin-bottom:8px;">
            เปิด: ${opening.openDaysLabel}
          </div>
          <a href="/shops/${shop.slug}" style="display:block;text-align:center;background:#A6192E;color:#FFFFFF;text-decoration:none;padding:7px 12px;border-radius:8px;font-size:13px;font-weight:600;">
            ดูรายละเอียดและเมนูร้าน
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.addTo(layerGroup);

      if (isSelected) {
        map.setView([shop.latitude, shop.longitude], 18, { animate: true });
        marker.openPopup();
      }
    });

    if (userCoords) {
      const userMarker = L.circleMarker(userCoords, {
        radius: 9,
        color: "#FFFFFF",
        weight: 3,
        fillColor: "#2563EB",
        fillOpacity: 1,
      });
      userMarker
        .bindPopup("<strong>ตำแหน่งปัจจุบันของคุณ</strong>")
        .addTo(layerGroup)
        .openPopup();
      map.setView(userCoords, 17, { animate: true });
    }
  }, [shops, categories, schedules, selectedShopId, userCoords]);

  return (
    <div
      ref={mapContainerRef}
      className={`w-full rounded-2xl border border-[#E5E5E5] overflow-hidden z-10 ${heightClass}`}
    />
  );
}
