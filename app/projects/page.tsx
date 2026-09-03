import type { Metadata } from 'next';
import ProjectsList from '../components/ProjectsList';
import { publishedProjects as projects } from './manifest';

export const metadata: Metadata = {
  title: 'Projects · CloudCodeTree',
  description:
    'Things Chris Harper has built — native apps, browser experiments, home-automation tooling, and full products. Live demos coming to selected projects.',
  alternates: { canonical: 'https://cloudcodetree.com/projects/' },
};

export default function Page() {
  return <ProjectsList projects={projects} />;
}
