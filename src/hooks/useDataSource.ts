import { useEffect } from 'react';
import { useDataStore } from '../store/dataStore';
import { dataSourceManager } from '../data/DataSourceManager';
import type { DataSourceConfig, DataFeedStatus } from '../data/types';

/** Register a data source and get its status */
export function useDataSource(config: DataSourceConfig): DataFeedStatus {
  useEffect(() => {
    void dataSourceManager.registerSource(config);
    return () => {
      dataSourceManager.unregisterSource(config.id);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.id]);

  return useDataStore((s) => s.feedStatuses[config.id] ?? {
    sourceId: config.id,
    state: 'idle',
    featureCount: 0,
  });
}
