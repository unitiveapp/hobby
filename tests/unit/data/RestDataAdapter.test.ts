import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RestDataAdapter } from '../../../src/data/adapters/RestDataAdapter';
import type { DataSourceConfig } from '../../../src/data/types';
import type { FeatureCollection } from 'geojson';

const mockCollection: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', id: 'f1', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { id: 'f1' } },
  ],
};

const config: DataSourceConfig = {
  id: 'test-rest',
  type: 'rest',
  url: 'https://example.com/data.geojson',
  mergeKey: 'id',
};

describe('RestDataAdapter', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCollection,
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with idle status', () => {
    const adapter = new RestDataAdapter(config);
    expect(adapter.getStatus().state).toBe('idle');
    expect(adapter.getFeatures().features).toHaveLength(0);
  });

  it('fetches data on connect', async () => {
    const adapter = new RestDataAdapter(config);
    await adapter.connect();
    expect(adapter.getFeatures().features).toHaveLength(1);
    expect(adapter.getStatus().state).toBe('live');
  });

  it('annotates features with _sourceId and _mergeKey', async () => {
    const adapter = new RestDataAdapter(config);
    await adapter.connect();
    const feature = adapter.getFeatures().features[0];
    expect(feature.properties?._sourceId).toBe('test-rest');
    expect(feature.properties?._mergeKey).toBe('f1');
  });

  it('notifies subscribers on update', async () => {
    const adapter = new RestDataAdapter(config);
    const listener = vi.fn();
    adapter.subscribe(listener);
    await adapter.connect();
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ type: 'FeatureCollection' }));
  });

  it('unsubscribe stops notifications', async () => {
    const adapter = new RestDataAdapter(config);
    const listener = vi.fn();
    const unsub = adapter.subscribe(listener);
    unsub();
    await adapter.connect();
    expect(listener).not.toHaveBeenCalled();
  });

  it('sets error state on fetch failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));
    const adapter = new RestDataAdapter(config);
    await adapter.connect();
    expect(adapter.getStatus().state).toBe('error');
    expect(adapter.getStatus().error).toContain('Network error');
  });

  it('disconnect clears interval', async () => {
    const adapter = new RestDataAdapter({ ...config, refreshIntervalMs: 5000 });
    await adapter.connect();
    adapter.disconnect();
    expect(adapter.getStatus().state).toBe('idle');
  });
});
