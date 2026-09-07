import ClientLayout from '../components/ClientLayout';

// Owner-only section. The Worker answers /admin/* only to the owner's session
// (worker/index.ts, ownerGate); this layout just adds the site chrome.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
