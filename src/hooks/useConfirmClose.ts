import { useCallback, useState } from "react";

/**
 * Gates a modal's close action behind a "are you sure?" confirmation.
 * Use `requestClose` as the outside-click/backdrop handler instead of
 * calling `onClose` directly, so an accidental outside click doesn't
 * discard the popup — it opens a small confirm dialog first.
 */
export function useConfirmClose(onClose: () => void) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const requestClose = useCallback(() => {
    setIsConfirmOpen(true);
  }, []);

  const confirmClose = useCallback(() => {
    setIsConfirmOpen(false);
    onClose();
  }, [onClose]);

  const cancelClose = useCallback(() => {
    setIsConfirmOpen(false);
  }, []);

  return { isConfirmOpen, requestClose, confirmClose, cancelClose };
}
