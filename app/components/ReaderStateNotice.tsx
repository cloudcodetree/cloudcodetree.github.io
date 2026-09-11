'use client';
import { Alert, Button } from '@mui/material';

export default function ReaderStateNotice({ onRetry }: { onRetry: () => void }) {
  return <Alert severity="warning" sx={{ my: 2 }} action={<Button color="inherit" onClick={onRetry}>Retry</Button>}>
    Your saved posts and reading history could not be loaded. Please try again.
  </Alert>;
}
