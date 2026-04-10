import { createContext } from 'react';
import type { MapAdapter } from '../../adapters/base/MapAdapter';

export const MapAdapterContext = createContext<MapAdapter | null>(null);
