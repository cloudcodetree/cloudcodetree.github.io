import ClientLayout from '../components/ClientLayout';

// Wraps the gallery and every project detail page in the site chrome.
export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
