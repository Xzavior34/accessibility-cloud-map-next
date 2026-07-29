"use client";

import { useState } from 'react';
import { MapView } from './MapView';
import { SearchBar } from './SearchBar';
import { FilterPanel } from './FilterPanel';
import { DetailPanel } from './DetailPanel';
import { Legend } from './Legend';
import { StatsBar } from './StatsBar';
import { QuickFilters } from './QuickFilters';
import { PlacesList } from './PlacesList';
import { AccessibilityToolbar } from './AccessibilityToolbar';
import { useAccessibilityData, type Viewport } from '../hooks/useAccessibilityData';
import { useUserLocation } from '../hooks/useUserLocation';
import { useFavorites } from '../hooks/useFavorites';
import { useA11ySettings } from '../hooks/useA11ySettings';
import { useCategories } from '../hooks/useCategories';
import type { PlaceInfoFeature, WheelchairFilterPreset } from '../types/accessibilityCloud';
import type { GeocodeResult } from '../lib/geocoding';
import { List, Settings2 } from 'lucide-react';

export default function MapApp() {
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [wheelchairFilter, setWheelchairFilter] = useState<WheelchairFilterPreset | undefined>(
    'at-least-partially-accessible-by-wheelchair',
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showDisruptions, setShowDisruptions] = useState(true);
  const [showEquipment, setShowEquipment] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [a11yToolbarOpen, setA11yToolbarOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceInfoFeature | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  const { location: userLocation } = useUserLocation();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const { settings, setTextSize, toggleHighContrast } = useA11ySettings();
  const { categories, loaded: categoriesLoaded } = useCategories();

  const { places, disruptions, equipment, loadingPlaces, error } = useAccessibilityData({
    viewport,
    filterOptions: {
      filter: wheelchairFilter,
      includeCategories: selectedCategories.length > 0 ? selectedCategories : undefined,
    },
    showDisruptions,
    showEquipment,
  });

  const handleSelectLocation = (result: GeocodeResult) => {
    setFlyTo({ lat: result.lat, lng: result.lng, zoom: 15 });
  };

  const handleQuickFilter = (categoryId: string | undefined, filter: WheelchairFilterPreset) => {
    setSelectedCategories(categoryId ? [categoryId] : []);
    setWheelchairFilter(filter);
    if (userLocation) {
      setFlyTo({ lat: userLocation.lat, lng: userLocation.lng, zoom: 15 });
    }
  };

  return (
    <div className="relative w-full h-dvh overflow-hidden bg-gray-100">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
      >
        Skip to map
      </a>

      <MapView
        places={places}
        disruptions={disruptions}
        equipment={equipment}
        onViewportChange={setViewport}
        onSelectPlace={setSelectedPlace}
        flyTo={flyTo}
        userLocation={userLocation}
      />

      <main id="main-content" className="contents">
        {/* Top bar: search + quick filters + stats */}
        <div className="absolute top-4 left-4 right-4 z-10 flex flex-col gap-3">
          <div className="flex flex-col md:flex-row md:items-start gap-3">
            <SearchBar
              onSelectLocation={handleSelectLocation}
              onToggleFilters={() => setFiltersOpen((o) => !o)}
              filtersActive={filtersOpen}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setListOpen((o) => !o)}
                className={`p-2.5 rounded-xl shadow-lg border transition-colors ${
                  listOpen ? 'bg-accent text-white border-accent' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
                }`}
                aria-label="Toggle list view"
                aria-pressed={listOpen}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setA11yToolbarOpen((o) => !o)}
                className={`p-2.5 rounded-xl shadow-lg border transition-colors ${
                  a11yToolbarOpen ? 'bg-accent text-white border-accent' : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50'
                }`}
                aria-label="Display settings"
                aria-pressed={a11yToolbarOpen}
              >
                <Settings2 className="w-4 h-4" />
              </button>
            </div>
            <div className="hidden md:block">
              <StatsBar />
            </div>
          </div>

          <QuickFilters
            categories={categories}
            onApply={handleQuickFilter}
            activeCategoryId={selectedCategories[0]}
          />
        </div>

        {/* Filter panel (toggleable) */}
        {filtersOpen && (
          <div className="absolute top-32 left-4 z-20">
            <FilterPanel
              filter={wheelchairFilter}
              onFilterChange={setWheelchairFilter}
              selectedCategories={selectedCategories}
              onCategoriesChange={setSelectedCategories}
              showDisruptions={showDisruptions}
              onShowDisruptionsChange={setShowDisruptions}
              showEquipment={showEquipment}
              onShowEquipmentChange={setShowEquipment}
              categories={categories}
              categoriesLoaded={categoriesLoaded}
              onClose={() => setFiltersOpen(false)}
            />
          </div>
        )}

        {/* Accessibility toolbar (toggleable) */}
        {a11yToolbarOpen && (
          <div className="absolute top-32 right-4 z-20">
            <AccessibilityToolbar
              settings={settings}
              onTextSizeChange={setTextSize}
              onToggleHighContrast={toggleHighContrast}
              onClose={() => setA11yToolbarOpen(false)}
            />
          </div>
        )}

        {/* List view (toggleable) */}
        {listOpen && !selectedPlace && (
          <div className="absolute top-32 left-4 z-20">
            <PlacesList
              places={places}
              userLocation={userLocation}
              disruptions={disruptions}
              favoriteIds={favorites.map((f) => f.id)}
              onToggleFavorite={toggleFavorite}
              onSelectPlace={setSelectedPlace}
              onClose={() => setListOpen(false)}
            />
          </div>
        )}

        {/* Selected place detail panel */}
        {selectedPlace && (
          <div className="absolute top-32 right-4 z-20">
            <DetailPanel
              place={selectedPlace}
              onClose={() => setSelectedPlace(null)}
              userLocation={userLocation}
              disruptions={disruptions}
              isFavorite={isFavorite(selectedPlace.properties._id)}
              onToggleFavorite={toggleFavorite}
            />
          </div>
        )}

        {/* Legend, bottom-left */}
        <div className="absolute bottom-4 left-4 z-10">
          <Legend />
        </div>

        {/* Loading / error indicator, bottom-center */}
        {(loadingPlaces || error) && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10" role="status" aria-live="polite">
            <div className="bg-white rounded-full shadow-lg border border-gray-100 px-4 py-2 text-xs font-medium text-gray-600">
              {error ? `⚠ ${error}` : 'Loading accessible places…'}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
