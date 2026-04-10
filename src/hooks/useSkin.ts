import { useEffect } from 'react';
import { useSkinStore } from '../store/skinStore';
import { resolveSkin } from '../skins/resolver';
import type { ResolvedSkin } from '../skins/types';
import { deepMerge } from '../utils/deepMerge';

/**
 * Resolves the active skin (with user overrides applied) and keeps
 * skinStore.resolvedSkin up to date whenever activeSkinId or userOverrides change.
 */
export function useSkin(): ResolvedSkin | null {
  const { registry, activeSkinId, userOverrides, resolvedSkin } = useSkinStore();

  useEffect(() => {
    if (!registry[activeSkinId]) return;
    try {
      const resolved = resolveSkin(activeSkinId, registry);
      const withOverrides: ResolvedSkin = {
        ...resolved,
        tokens: deepMerge(resolved.tokens, userOverrides as typeof resolved.tokens),
      };
      useSkinStore.setState({ resolvedSkin: withOverrides });
    } catch (e) {
      console.error('[useSkin] Failed to resolve skin:', e);
    }
  }, [activeSkinId, registry, userOverrides]);

  return resolvedSkin;
}
