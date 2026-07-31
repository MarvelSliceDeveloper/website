import { useState, useCallback, useRef } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

export default function useConfirm() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const resolveRef = useRef(null);

  const confirm = useCallback((msg) => {
    setMessage(msg);
    setOpen(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true);
    setOpen(false);
  }, []);

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false);
    setOpen(false);
  }, []);

  const dialog = (
    <ConfirmDialog
      open={open}
      message={message}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return [confirm, dialog];
}
