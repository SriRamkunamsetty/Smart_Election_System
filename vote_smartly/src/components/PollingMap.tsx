/// <reference types="google.maps" />
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { useEffect, useRef, useState } from "react";
import { getMapsKey } from "@/server/maps.functions";
import { MapPin } from "lucide-react";

// Refined light style matching the design system.
const LIGHT_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f6f7fb" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5b6470" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#dde7f3" }] },
];

export function PollingMap() {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { key } = await getMapsKey();
        if (!key) {
          setError("Maps key not configured.");
          setLoading(false);
          return;
        }
        setOptions({ key, v: "weekly" });
        const [{ Map }, { Marker }] = await Promise.all([
          importLibrary("maps"),
          importLibrary("marker"),
        ]);
        if (cancelled || !ref.current) return;

        // Default to New Delhi; refine via geolocation.
        const center = { lat: 28.6139, lng: 77.209 };
        const map = new Map(ref.current, {
          center,
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: true,
          styles: LIGHT_STYLE,
          backgroundColor: "#f6f7fb",
        });

        new Marker({
          position: center,
          map,
          title: "Sample polling area",
        });

        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              map.panTo(here);
              new Marker({ position: here, map, title: "Your location" });
            },
            () => {},
            { timeout: 4000 },
          );
        }

        setLoading(false);
      } catch (e) {
        console.error(e);
        setError("Could not load map.");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <div ref={ref} className="h-full w-full" aria-label="Map of polling area" />
      {(loading || error) && (
        <div className="absolute inset-0 grid place-items-center bg-muted/60 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {error ?? "Loading map…"}
          </div>
        </div>
      )}
    </div>
  );
}
