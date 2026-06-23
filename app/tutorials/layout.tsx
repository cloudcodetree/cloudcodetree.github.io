import ClientLayout from '../components/ClientLayout';

// Wraps the list page and every tutorial (.mdx) in the site chrome.
export default function TutorialsLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
