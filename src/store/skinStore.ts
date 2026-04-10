import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MapSkin, ResolvedSkin, SkinToken, SkinTokens } from '../skins/types';

interface SkinState {
  /** All registered skins keyed by id */
  registry: Record<string, MapSkin>;
  /** Currently active skin id */
  activeSkinId: string;
  /** Fully resolved skin (null until first skin is registered) */
  resolvedSkin: ResolvedSkin | null;
  /** Live token overrides from the token editor — applied on top of the resolved skin */
  userOverrides: Partial<SkinTokens>;

  registerSkin(skin: MapSkin): void;
  setActiveSkin(id: string): void;
  applyTokenOverride(key: keyof SkinTokens, value: SkinToken): void;
  resetOverrides(): void;
  /** Import and register a skin from a JSON string (validates before adding) */
  importSkinJson(json: string): { success: boolean; error?: string };
  unregisterSkin(id: string): void;
}

export const useSkinStore = create<SkinState>()(
  persist(
    (set, get) => ({
      registry: {},
      activeSkinId: 'light',
      resolvedSkin: null,
      userOverrides: {},

      registerSkin: (skin) =>
        set((state) => ({
          registry: { ...state.registry, [skin.id]: skin },
        })),

      setActiveSkin: (id) => {
        const { registry } = get();
        if (!registry[id]) {
          console.warn(`[SkinStore] Skin "${id}" not found in registry`);
          return;
        }
        set({ activeSkinId: id, resolvedSkin: null });
        // resolvedSkin is populated lazily by useSkin hook via resolver
      },

      applyTokenOverride: (key, value) =>
        set((state) => ({
          userOverrides: { ...state.userOverrides, [key]: value },
        })),

      resetOverrides: () => set({ userOverrides: {} }),

      importSkinJson: (json) => {
        try {
          const parsed = JSON.parse(json) as MapSkin;
          if (!parsed.id || !parsed.name) {
            return { success: false, error: 'Skin must have "id" and "name" fields' };
          }
          set((state) => ({
            registry: { ...state.registry, [parsed.id]: parsed },
          }));
          return { success: true };
        } catch (e) {
          return { success: false, error: String(e) };
        }
      },

      unregisterSkin: (id) =>
        set((state) => {
          const { [id]: _removed, ...rest } = state.registry;
          return { registry: rest };
        }),
    }),
    {
      name: 'hobby-map-skin',
      partialize: (state) => ({
        activeSkinId: state.activeSkinId,
        userOverrides: state.userOverrides,
      }),
    }
  )
);
