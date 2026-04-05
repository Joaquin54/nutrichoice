// hooks/useSupabaseUpload.ts
// Upload hook — converts images to WebP then pushes them to Supabase via signed URL.

import { useState, useCallback } from 'react';
import { convertToWebP } from '../utils/convertToWebP';
import { requestSignedUrl, saveImageUrl } from '../api';

export interface UploadState {
  isUploading: boolean;
  error: string | null;
}

export interface UseSupabaseUploadReturn {
  uploadRecipeImage: (file: File, recipeId: number, imageIndex: 0 | 1 | 2) => Promise<string | null>;
  uploadProfilePicture: (file: File) => Promise<string | null>;
  state: UploadState;
  reset: () => void;
}

const INITIAL_STATE: UploadState = { isUploading: false, error: null };

async function putToSupabase(signedUrl: string, blob: Blob): Promise<void> {
  // Raw fetch — authenticatedFetch would inject wrong Content-Type and auth header.
  const response = await fetch(signedUrl, {
    method: 'PUT',
    body: blob,
    headers: {
      'Content-Type': 'image/webp',
      'x-upsert': 'true',
    },
  });
  if (!response.ok) {
    throw new Error(`Supabase upload failed (${response.status})`);
  }
}

export function useSupabaseUpload(): UseSupabaseUploadReturn {
  const [state, setState] = useState<UploadState>(INITIAL_STATE);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const uploadRecipeImage = useCallback(
    async (file: File, recipeId: number, imageIndex: 0 | 1 | 2): Promise<string | null> => {
      setState({ isUploading: true, error: null });
      try {
        const { blob } = await convertToWebP(file, { preset: 'recipe' });
        const { signed_url, path } = await requestSignedUrl({
          bucket: 'recipe_images',
          recipe_id: recipeId,
          image_index: imageIndex,
        });
        await putToSupabase(signed_url, blob);
        const result = await saveImageUrl({ bucket: 'recipe_images', path });
        const key = `image_${imageIndex + 1}` as 'image_1' | 'image_2' | 'image_3';
        return 'recipe_id' in result ? result[key] : null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setState((prev) => ({ ...prev, error: message }));
        return null;
      } finally {
        setState((prev) => ({ ...prev, isUploading: false }));
      }
    },
    []
  );

  const uploadProfilePicture = useCallback(async (file: File): Promise<string | null> => {
    setState({ isUploading: true, error: null });
    try {
      const { blob } = await convertToWebP(file, { preset: 'profile' });
      const { signed_url, path } = await requestSignedUrl({ bucket: 'profile_picture' });
      await putToSupabase(signed_url, blob);
      const result = await saveImageUrl({ bucket: 'profile_picture', path });
      return 'profile_picture' in result ? result.profile_picture : null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setState((prev) => ({ ...prev, error: message }));
      return null;
    } finally {
      setState((prev) => ({ ...prev, isUploading: false }));
    }
  }, []);

  return { uploadRecipeImage, uploadProfilePicture, state, reset };
}
