import { create } from 'zustand';
import type { FeatureCollection } from 'geojson';
import type { DataSourceConfig, DataFeedStatus } from '../data/types';

interface DataState {
  sources: Record<string, DataSourceConfig>;
  feedStatuses: Record<string, DataFeedStatus>;
  mergedCollection: FeatureCollection;

  registerSource(config: DataSourceConfig): void;
  unregisterSource(id: string): void;
  updateFeedStatus(sourceId: string, status: Partial<DataFeedStatus>): void;
  setMergedCollection(fc: FeatureCollection): void;
}

const EMPTY_COLLECTION: FeatureCollection = { type: 'FeatureCollection', features: [] };

export const useDataStore = create<DataState>((set) => ({
  sources: {},
  feedStatuses: {},
  mergedCollection: EMPTY_COLLECTION,

  registerSource: (config) =>
    set((state) => ({
      sources: { ...state.sources, [config.id]: config },
      feedStatuses: {
        ...state.feedStatuses,
        [config.id]: {
          sourceId: config.id,
          state: 'idle',
          featureCount: 0,
        },
      },
    })),

  unregisterSource: (id) =>
    set((state) => {
      const { [id]: _s, ...sources } = state.sources;
      const { [id]: _f, ...feedStatuses } = state.feedStatuses;
      return { sources, feedStatuses };
    }),

  updateFeedStatus: (sourceId, status) =>
    set((state) => ({
      feedStatuses: {
        ...state.feedStatuses,
        [sourceId]: { ...state.feedStatuses[sourceId], ...status },
      },
    })),

  setMergedCollection: (fc) => set({ mergedCollection: fc }),
}));
