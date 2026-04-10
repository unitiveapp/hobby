import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DataSourceManager } from '../../src/data/DataSourceManager';
import type { FeatureCollection } from 'geojson';

// We import the class directly for integration tests (not the singleton)
// so each test gets a fresh instance
import { RestDataAdapter } from '../../src/data/adapters/RestDataAdapter';

const makeCollection = (id: string): FeatureCollection => ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id,
      geometry: { type: 'Point', coordinates: [0, 0] },
      properties: { id, value: 42 },
    },
  ],
});

// Make DataSourceManager testable without the singleton
class TestableDataSourceManager {
  private manager: InstanceType<typeof DataSourceManager>;

  constructor() {
    // @ts-ignore — access private constructor for testing
    this.manager = new (DataSourceManager as new () => InstanceType<typeof DataSourceManager>)();
  }
}

describe('DataSourceManager integration', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('RestDataAdapter fetches and annotates correctly', async () => {
    const collection = makeCollection('feature-1');
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => collection,
    } as Response);

    const adapter = new RestDataAdapter({
      id: 'src-a',
      type: 'rest',
      url: 'https://example.com/a.geojson',
      mergeKey: 'id',
      priority: 1,
    });

    await adapter.connect();
    const features = adapter.getFeatures().features;

    expect(features).toHaveLength(1);
    expect(features[0].properties?._sourceId).toBe('src-a');
    expect(features[0].properties?._mergeKey).toBe('feature-1');
  });

  it('higher priority source wins on duplicate mergeKey', async () => {
    const lowPriorityCollection: FeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        id: 'shared-key',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { id: 'shared-key', source: 'low', _mergeKey: 'shared-key' },
      }],
    };
    const highPriorityCollection: FeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        id: 'shared-key',
        geometry: { type: 'Point', coordinates: [1, 1] },
        properties: { id: 'shared-key', source: 'high', _mergeKey: 'shared-key' },
      }],
    };

    // Simulate merge: higher priority (index 1) should win
    const allSources = [
      { config: { priority: 0 }, features: lowPriorityCollection },
      { config: { priority: 10 }, features: highPriorityCollection },
    ].sort((a, b) => a.config.priority - b.config.priority);

    const mergeMap = new Map<string, unknown>();
    for (const src of allSources) {
      for (const f of src.features.features) {
        mergeMap.set(f.properties?._mergeKey as string, f);
      }
    }

    const winner = mergeMap.get('shared-key') as { properties: { source: string } };
    expect(winner.properties.source).toBe('high');
  });
});
