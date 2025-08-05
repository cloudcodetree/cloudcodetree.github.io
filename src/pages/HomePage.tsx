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
  'React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker',
  'Kubernetes', 'PostgreSQL', 'MongoDB', 'GraphQL', 'Next.js', 'Rust'
];

const services = [
  {
    icon: CodeIcon,
    title: 'Full Stack Development',
    description: 'Modern web applications built with React, TypeScript, and cutting-edge technologies.',
  },
  {
    icon: CloudIcon,
    title: 'Cloud Solutions',
    description: 'Scalable and secure cloud architectures on AWS, GCP, and Azure platforms.',
  },
  {
    icon: SecurityIcon,
    title: 'DevSecOps',
    description: 'Implementing security best practices throughout the development lifecycle.',
  },
  {
    icon: SpeedIcon,
    title: 'Performance Optimization',
    description: 'Optimizing applications for speed, scalability, and user experience.',
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
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
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
            Full Stack Developer & Cloud Solutions Architect
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
            Building scalable, secure, and performant web applications with modern technologies.
            Passionate about clean code, cloud architecture, and innovative solutions.
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
              to="/projects"
              variant="outlined"
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              View Projects
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
        </motion.div>
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
            Let's Work Together
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
            Ready to bring your ideas to life? Let's discuss your project requirements
            and explore how we can build something amazing together.
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