'use client';

import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  useTheme,
} from '@mui/material';
import {
  AutoAwesome as AIIcon,
  Hub as AgentIcon,
  Cloud as CloudIcon,
  Code as CodeIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import Link from 'next/link';

const skills = [
  'Claude Code', 'AI Agents', 'MCP', 'LLMs', 'RAG', 'Embeddings',
  'Python', 'TypeScript', 'React', 'Node.js', 'AWS', 'Azure', 'GCP',
  'Docker', 'PostgreSQL', 'DevOps', 'Microservices'
];

const services = [
  {
    icon: AIIcon,
    title: 'AI-Assisted Development',
    description: 'Building with agentic coding tools — Claude Code, subagents, MCP, and prompt/context engineering — and shipping AI-powered apps. This site’s AI News blog runs on an autonomous research-and-publish pipeline I built.',
  },
  {
    icon: AgentIcon,
    title: 'Custom Models & Agents',
    description: 'Hands-on with the model stack — RAG, embeddings, vector search, fine-tuning, and self-hosting — wiring LLMs into real developer workflows.',
  },
  {
    icon: CloudIcon,
    title: 'Cloud & Full-Stack',
    description: 'Cloud-native solutions across AWS/Azure/GCP with modern full-stack delivery — reliable, scalable infrastructure and clean app architecture.',
  },
  {
    icon: CodeIcon,
    title: 'Engineering & Teams',
    description: 'Shipping software collaboratively: CI/CD, microservices, and automation, plus mentoring and helping engineering teams grow.',
  },
];

export default function HomePage() {
  const theme = useTheme();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Box
        sx={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <Box>
          <Avatar
            sx={{
              width: 150,
              height: 150,
              mx: 'auto',
              mb: 4,
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              fontSize: '4rem',
            }}
          >
            CH
          </Avatar>
          
          <Typography
            variant="h1"
            component="h1"
            sx={{
              mb: 2,
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Chris Harper
          </Typography>
          
          <Typography
            variant="h3"
            component="h2"
            sx={{
              mb: 4,
              color: theme.palette.text.secondary,
              fontWeight: 400,
            }}
          >
            Engineering Leader · AI-Assisted Development, Cloud &amp; Full-Stack
          </Typography>

          <Typography
            variant="h6"
            sx={{
              mb: 6,
              maxWidth: '640px',
              mx: 'auto',
              lineHeight: 1.8,
              color: theme.palette.text.secondary,
            }}
          >
            I build with AI — agentic coding tools, custom models, and automation — and write about
            the craft on the <Box component={Link} href="/" sx={{ color: '#3b82f6', textDecoration: 'none' }}>AI News</Box> blog.
            Day to day I lead engineering work across cloud and full-stack, with a deep interest in how AI is changing how we ship software.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              href="/"
              variant="contained"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb, #0891b2)',
                },
              }}
            >
              Read the AI News blog
            </Button>
            <Button
              component={Link}
              href="/about/resume"
              variant="outlined"
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              Resume
            </Button>
            <Button
              component={Link}
              href="/about/contact"
              variant="outlined"
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              Get In Touch
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Skills Section */}
      <Box sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Typography variant="h2" component="h2" sx={{ mb: 6, textAlign: 'center' }}>
            Technologies & Skills
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
            {skills.map((skill, index) => (
              <motion.div
                key={skill}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Chip
                  label={skill}
                  sx={{
                    px: 2,
                    py: 1,
                    fontSize: '1rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    '&:hover': {
                      background: 'rgba(59, 130, 246, 0.2)',
                    },
                  }}
                />
              </motion.div>
            ))}
          </Box>
        </motion.div>
      </Box>

      {/* Services Section */}
      <Box sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Typography variant="h2" component="h2" sx={{ mb: 6, textAlign: 'center' }}>
            What I Do
          </Typography>
          <Grid container spacing={4}>
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Grid size={{ xs: 12, md: 6 }} key={service.title}>
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
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          transition: 'transform 0.3s ease',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 4 }}>
                        <Icon
                          sx={{
                            fontSize: '3rem',
                            color: '#3b82f6',
                            mb: 2,
                          }}
                        />
                        <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
                          {service.title}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ color: theme.palette.text.secondary, lineHeight: 1.8 }}
                        >
                          {service.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </motion.div>
      </Box>

      {/* Contact CTA */}
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Typography variant="h3" component="h2" sx={{ mb: 4 }}>
            Let’s talk shop
          </Typography>
          <Typography
            variant="h6"
            sx={{
              mb: 6,
              maxWidth: '600px',
              mx: 'auto',
              color: theme.palette.text.secondary,
            }}
          >
            Always happy to compare notes on AI-assisted development, agents, or anything cloud and full-stack.
            Reach out or grab a time to chat.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              href="/about/schedule"
              variant="contained"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2563eb, #0891b2)',
                },
              }}
            >
              Schedule a chat
            </Button>
            <Button
              href="mailto:chris@cloudcodetree.com"
              variant="outlined"
              size="large"
              startIcon={<EmailIcon />}
              sx={{ px: 4, py: 1.5 }}
            >
              Email Me
            </Button>
          </Box>
        </motion.div>
      </Box>
    </Container>
  );
}