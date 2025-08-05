import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  GitHub as GitHubIcon,
  Launch as LaunchIcon,
  Star as StarIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface Repository {
  id: number;
  name: string;
  description: string;
  html_url: string;
  homepage: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  updated_at: string;
  size: number;
}

const featuredProjects = [
  {
    title: 'CloudCodeTree Portfolio',
    description: 'Modern portfolio website built with React, TypeScript, and Material-UI. Features dark theme, responsive design, and GitHub integration.',
    technologies: ['React', 'TypeScript', 'Material-UI', 'Vite'],
    githubUrl: 'https://github.com/cloudcodetree/portfolio',
    liveUrl: 'https://cloudcodetree.github.io',
  },
  {
    title: 'Microservices Orchestrator',
    description: 'Kubernetes-native service mesh for managing microservices communication with built-in monitoring and security.',
    technologies: ['Go', 'Kubernetes', 'Docker', 'Prometheus'],
    githubUrl: 'https://github.com/cloudcodetree/k8s-orchestrator',
    liveUrl: null,
  },
  {
    title: 'Real-time Analytics Dashboard',
    description: 'High-performance dashboard for real-time data visualization using WebSockets, Redis, and D3.js.',
    technologies: ['Node.js', 'React', 'WebSocket', 'Redis', 'D3.js'],
    githubUrl: 'https://github.com/cloudcodetree/analytics-dashboard',
    liveUrl: 'https://analytics.cloudcodetree.com',
  },
];

export default function ProjectsPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        // Replace 'cloudcodetree' with your actual GitHub username
        const response = await fetch('https://api.github.com/users/cloudcodetree/repos?sort=updated&per_page=20');
        
        if (!response.ok) {
          throw new Error('Failed to fetch repositories');
        }
        
        const data = await response.json();
        setRepositories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch repositories');
      } finally {
        setLoading(false);
      }
    };

    fetchRepositories();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      TypeScript: '#3178c6',
      JavaScript: '#f1e05a',
      Python: '#3572a5',
      Java: '#b07219',
      Go: '#00add8',
      Rust: '#dea584',
      React: '#61dafb',
      Vue: '#4fc08d',
      HTML: '#e34c26',
      CSS: '#1572b6',
    };
    return colors[language] || '#8b949e';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" component="h1" sx={{ mb: 2 }}>
            Projects & Repositories
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4 }}>
            A showcase of my recent work and contributions
          </Typography>
        </Box>

        {/* Featured Projects */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" component="h2" sx={{ mb: 4 }}>
            Featured Projects
          </Typography>
          <Grid container spacing={4}>
            {featuredProjects.map((project, index) => (
              <Grid item xs={12} md={6} lg={4} key={project.title}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card
                    className="glass"
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        transition: 'transform 0.3s ease',
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
                        {project.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ mb: 3, color: 'text.secondary', lineHeight: 1.8 }}
                      >
                        {project.description}
                      </Typography>
                      <Box sx={{ mb: 3 }}>
                        {project.technologies.map((tech) => (
                          <Chip
                            key={tech}
                            label={tech}
                            size="small"
                            sx={{
                              mr: 1,
                              mb: 1,
                              background: 'rgba(59, 130, 246, 0.1)',
                              color: '#3b82f6',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                            }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                      <Button
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        startIcon={<GitHubIcon />}
                        variant="outlined"
                        size="small"
                      >
                        Code
                      </Button>
                      {project.liveUrl && (
                        <Button
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={<LaunchIcon />}
                          variant="contained"
                          size="small"
                        >
                          Live Demo
                        </Button>
                      )}
                    </Box>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* GitHub Repositories */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" component="h2" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            <GitHubIcon /> GitHub Repositories
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}. Showing placeholder data instead.
            </Alert>
          )}

          <Grid container spacing={3}>
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Card className="glass">
                      <CardContent>
                        <Skeleton variant="text" height={32} width="60%" />
                        <Skeleton variant="text" height={20} width="40%" sx={{ mb: 2 }} />
                        <Skeleton variant="text" height={16} />
                        <Skeleton variant="text" height={16} />
                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          <Skeleton variant="rectangular" height={24} width={60} />
                          <Skeleton variant="rectangular" height={24} width={80} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              : repositories.map((repo, index) => (
                  <Grid item xs={12} md={6} key={repo.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.05 }}
                      viewport={{ once: true }}
                    >
                      <Card
                        className="glass"
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            transition: 'transform 0.3s ease',
                          },
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                              {repo.name}
                            </Typography>
                            <IconButton
                              href={repo.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="small"
                            >
                              <GitHubIcon />
                            </IconButton>
                          </Box>

                          <Typography
                            variant="body2"
                            sx={{ mb: 3, color: 'text.secondary', lineHeight: 1.6 }}
                          >
                            {repo.description || 'No description available'}
                          </Typography>

                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {repo.language && (
                              <Chip
                                label={repo.language}
                                size="small"
                                sx={{
                                  backgroundColor: getLanguageColor(repo.language),
                                  color: 'white',
                                  fontWeight: 500,
                                }}
                              />
                            )}
                            {repo.topics.slice(0, 3).map((topic) => (
                              <Chip
                                key={topic}
                                label={topic}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 'auto' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <StarIcon fontSize="small" />
                              <Typography variant="caption">{repo.stargazers_count}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CodeIcon fontSize="small" />
                              <Typography variant="caption">{repo.forks_count}</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                              Updated {formatDate(repo.updated_at)}
                            </Typography>
                          </Box>

                          {repo.homepage && (
                            <Button
                              href={repo.homepage}
                              target="_blank"
                              rel="noopener noreferrer"
                              startIcon={<LaunchIcon />}
                              size="small"
                              sx={{ mt: 2 }}
                            >
                              View Live
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
          </Grid>
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Button
            href="https://github.com/cloudcodetree"
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            size="large"
            startIcon={<GitHubIcon />}
            sx={{ px: 4 }}
          >
            View All Repositories on GitHub
          </Button>
        </Box>
      </motion.div>
    </Container>
  );
}