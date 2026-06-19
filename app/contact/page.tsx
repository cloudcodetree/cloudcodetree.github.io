import type { Metadata } from 'next';
import Redirect from '../components/Redirect';

// Moved under /about. Static redirect stub so old links don't 404.
export const metadata: Metadata = {
  title: 'Moved · CloudCodeTree',
  alternates: { canonical: 'https://cloudcodetree.com/about/contact/' },
  robots: { index: false, follow: true },
};

export default function ContactMoved() {
  return <Redirect to="/about/contact/" />;
}
