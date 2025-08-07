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
  Code as CodeIcon,
  Cloud as CloudIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const skills = [
  'Python', 'TypeScript', 'React', 'Node.js', 'AWS', 'Azure', 'GCP',
  'Kubernetes', 'Docker', 'PostgreSQL', 'MongoDB', 'GraphQL', 'AI/ML',
  'DevOps', 'Microservices', 'Leadership', 'Agile/Scrum'
];

const services = [
  {
    icon: CodeIcon,
    title: 'Engineering Leadership',
    description: 'Leading cross-functional teams of 8-15 engineers, delivering projects 20% ahead of schedule with 80% team promotion rate.',
  },
  {
    icon: CloudIcon,
    title: 'Cloud Architecture',
    description: 'Enterprise cloud solutions on AWS/Azure/GCP processing 10M+ daily transactions with 99.9% uptime.',
  },
  {
    icon: SecurityIcon,
    title: 'DevOps & AI/ML',
    description: 'Modern software practices including CI/CD, microservices, AI integration, and automation reducing operational overhead by 70%.',
  },
  {
    icon: SpeedIcon,
    title: 'Digital Transformation',
    description: 'Driving enterprise digital transformation for Fortune 500 clients, resulting in 40%+ cost reductions and improved scalability.',
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
            Principal Software Engineering Manager & Cloud Solutions Architect
          </Typography>
          
          <Typography
            variant="h6"
            sx={{
              mb: 6,
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.8,
              color: theme.palette.text.secondary,
            }}
          >
            Extensive experience building and leading engineering teams, architecting cloud solutions, and delivering enterprise-scale applications.
            Expert in full-stack development, AWS/Azure/GCP, and modern software engineering practices including AI/ML, DevOps, and microservices.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              to="/resume"
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
              View Resume
            </Button>
            <Button
              component={Link}
              to="/contact"
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
                <Grid item xs={12} md={6} key={service.title}>
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
            Ready to Build Something Great?
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
            Looking for an experienced engineering leader to drive your next project?
            Let's discuss how extensive expertise can help scale your team and deliver exceptional results.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              to="/schedule"
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
              Schedule Interview
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