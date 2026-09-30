'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn, Button } from '@waynah/ui';
import { GeoPoint, MapMarkerData, filterValidMarkers, isValidCoordinate } from './map-types';
import { PlacePreview } from '../../components/maps/PlacePreview';
import { MapControls } from '../../components/maps/MapControls';

export interface MapShellProps {
  center?: GeoPoint;
  zoom?: number;
  markers?: MapMarkerData[];
  selectedMarkerId?: string | null;
  onMarkerSelect?: (marker: MapMarkerData | null) => void;
  onLocationFound?: (coords: GeoPoint) => void;
  className?: string;
  height?: string;
  showControls?: boolean;
}

const DEFAULT_CENTER: GeoPoint = {
  latitude: 24.7136,
  longitude: 46.6753,
};

export const MapShell: React.FC<MapShellProps> = ({
  center = DEFAULT_CENTER,
  zoom = 12,
  markers = [],
  selectedMarkerId = null,
  onMarkerSelect,
  onLocationFound,
  className,
  height = 'h-[450px]',
  showControls = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markerLayerGroupRef = useRef<any>(null);
  const userLocationMarkerRef = useRef<any>(null);

  const [activeMarker, setActiveMarker] = useState<MapMarkerData | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const validMarkers = filterValidMarkers(markers);

  // Synchronize active marker with selectedMarkerId prop
  useEffect(() => {
    if (selectedMarkerId) {
      const found = validMarkers.find((m) => m.id === selectedMarkerId);
      if (found) {
        setActiveMarker(found);
        if (mapRef.current && isValidCoordinate(found.latitude, found.longitude)) {
          mapRef.current.flyTo([found.latitude, found.longitude], Math.max(mapRef.current.getZoom(), 14), {
            duration: 1.2,
          });
        }
      }
    } else {
      setActiveMarker(null);
    }
  }, [selectedMarkerId, markers]);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !containerRef.current || mapRef.current) return;

      try {
        const L = (await import('leaflet')).default;
        leafletRef.current = L;

        if (!isMounted || !containerRef.current) return;

        // Fix Leaflet default icon paths if needed
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const initialLat = isValidCoordinate(center.latitude, center.longitude) ? center.latitude : DEFAULT_CENTER.latitude;
        const initialLng = isValidCoordinate(center.latitude, center.longitude) ? center.longitude : DEFAULT_CENTER.longitude;

        const map = L.map(containerRef.current, {
          center: [initialLat, initialLng],
          zoom,
          zoomControl: false,
          attributionControl: false,
        });

        // CartoDB Voyager Raster Tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
        }).addTo(map);

        // Custom Attribution
        L.control.attribution({ position: 'bottomleft', prefix: false })
          .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>')
          .addTo(map);

        const markerGroup = L.layerGroup().addTo(map);
        markerLayerGroupRef.current = markerGroup;
        mapRef.current = map;

        setIsMapReady(true);
      } catch (err: unknown) {
        console.error('Failed to initialize Leaflet Map:', err);
        if (isMounted) {
          setMapError('تعذر تحميل محرك الخريطة المكانية');
        }
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers Layer
  const updateMapMarkers = useCallback(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const markerGroup = markerLayerGroupRef.current;

    if (!L || !map || !markerGroup) return;

    markerGroup.clearLayers();

    validMarkers.forEach((markerData) => {
      const isSelected = activeMarker?.id === markerData.id;

      // Create Custom SVG Div Icon
      const pinColor = isSelected ? '#d97706' : '#059669'; // Gold if selected, Emerald default
      const scale = isSelected ? 'scale-125 z-30' : 'hover:scale-110';

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div class="relative transition-transform duration-200 cursor-pointer ${scale}">
            <svg class="w-8 h-8 drop-shadow-md" viewBox="0 0 24 24" fill="${pinColor}">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([markerData.latitude, markerData.longitude], { icon: customIcon });

      marker.on('click', () => {
        setActiveMarker(markerData);
        if (onMarkerSelect) onMarkerSelect(markerData);

        map.flyTo([markerData.latitude, markerData.longitude], Math.max(map.getZoom(), 14), {
          duration: 0.8,
        });
      });

      markerGroup.addLayer(marker);
    });
  }, [validMarkers, activeMarker, onMarkerSelect]);

  useEffect(() => {
    if (isMapReady) {
      updateMapMarkers();
    }
  }, [isMapReady, updateMapMarkers]);

  // Controls Handlers
  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  const handleFitBounds = () => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || validMarkers.length === 0) return;

    const latLngs = validMarkers.map((m) => [m.latitude, m.longitude] as [number, number]);
    const bounds = L.latLngBounds(latLngs);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('متصفحك لا يدعم تحديد الموقع الجغرافي');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords: GeoPoint = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };

        const L = leafletRef.current;
        const map = mapRef.current;

        if (L && map) {
          if (userLocationMarkerRef.current) {
            map.removeLayer(userLocationMarkerRef.current);
          }

          const userIcon = L.divIcon({
            className: 'user-location-beacon',
            html: `
              <div class="relative flex items-center justify-center">
                <div class="w-6 h-6 rounded-full bg-blue-500/30 animate-ping absolute"></div>
                <div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md"></div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          userLocationMarkerRef.current = L.marker([coords.latitude, coords.longitude], { icon: userIcon }).addTo(map);
          map.flyTo([coords.latitude, coords.longitude], 15, { duration: 1.5 });
        }

        if (onLocationFound) onLocationFound(coords);
      },
      (error) => {
        setIsLocating(false);
        console.warn('Geolocation error:', error);
        alert('تعذر تحديد موقعك الجغرافي حالياً');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleClosePreview = () => {
    setActiveMarker(null);
    if (onMarkerSelect) onMarkerSelect(null);
  };

  return (
    <div
      className={cn(
        'relative w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 overflow-hidden shadow-sm',
        height,
        className
      )}
    >
      {/* Map Leaflet DOM Element Container */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Map Error Overlay */}
      {mapError && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-30 flex items-center justify-center p-6 text-center text-white">
          <div className="space-y-2">
            <p className="font-bold text-rose-400">{mapError}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              إعادة التحميل
            </Button>
          </div>
        </div>
      )}

      {/* Embedded Map Controls */}
      {showControls && isMapReady && (
        <MapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onCurrentLocation={handleCurrentLocation}
          onFitBounds={handleFitBounds}
          isLocating={isLocating}
          hasMarkers={validMarkers.length > 0}
          className="absolute top-4 left-4"
        />
      )}

      {/* Marker Badge Counter Overlay */}
      {isMapReady && validMarkers.length > 0 && (
        <div className="absolute top-4 right-4 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-md flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>{validMarkers.length} مكان محدد مكانياً</span>
        </div>
      )}

      {/* Active Place Preview Card Overlay (Desktop Floating / Mobile Bottom Sheet) */}
      {activeMarker && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 z-20 flex justify-center md:block">
          <PlacePreview
            place={activeMarker}
            onClose={handleClosePreview}
          />
        </div>
      )}
    </div>
  );
};
