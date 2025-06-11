// See CHANGELOG.md for 2025-06-12 [Fixed]
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useGenerateBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      fetch('/api/test/generate-batch', { method: 'POST' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}
