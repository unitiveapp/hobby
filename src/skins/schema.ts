import { z } from 'zod';

const SkinTokenSchema = z.union([z.string(), z.number(), z.boolean()]);

const RoadTokensSchema = z.object({
  highway: z.string(),
  arterial: z.string(),
  local: z.string(),
  path: z.string(),
});

const LabelTokensSchema = z.object({
  primary: z.string(),
  secondary: z.string(),
  halo: z.string(),
  haloWidth: z.number(),
});

const BuildingTokensSchema = z.object({
  fill: z.string(),
  outline: z.string(),
  extrusion: z.string(),
});

const SkinTokensSchema = z.object({
  background: z.string(),
  water: z.string(),
  waterway: z.string(),
  landuse: z.string(),
  park: z.string(),
  roads: RoadTokensSchema,
  labels: LabelTokensSchema,
  buildings: BuildingTokensSchema,
  borders: z.string(),
  poi: z.string(),
  fontStack: z.array(z.string()),
  labelMinZoom: z.number(),
  buildingMinZoom: z.number(),
  globalOpacity: z.number().min(0).max(1),
});

const SkinLayerOverrideSchema = z.object({
  layerId: z.string(),
  paint: z.record(SkinTokenSchema).optional(),
  layout: z.record(SkinTokenSchema).optional(),
  filter: z.array(z.unknown()).optional(),
  minZoom: z.number().optional(),
  maxZoom: z.number().optional(),
  visible: z.boolean().optional(),
});

const MapSkinAdapterHintsSchema = z.object({
  mapbox: z
    .object({
      styleUrl: z.string().optional(),
      rawExpressions: z.record(z.unknown()).optional(),
    })
    .optional(),
  leaflet: z
    .object({
      tileUrl: z.string().optional(),
      attribution: z.string().optional(),
      cssVars: z.record(z.string()).optional(),
    })
    .optional(),
  google: z
    .object({
      mapTypeId: z
        .enum(['roadmap', 'satellite', 'terrain', 'hybrid'])
        .optional(),
      styles: z.array(z.record(z.unknown())).optional(),
    })
    .optional(),
});

export const MapSkinSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  extends: z.string().optional(),
  tokens: SkinTokensSchema.partial(),
  layerOverrides: z.array(SkinLayerOverrideSchema),
  adapterHints: MapSkinAdapterHintsSchema.optional(),
  meta: z
    .object({
      author: z.string().optional(),
      version: z.string().optional(),
      thumbnail: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
});

export type MapSkinInput = z.input<typeof MapSkinSchema>;
