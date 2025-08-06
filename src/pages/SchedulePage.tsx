import { useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  AccessTime as TimeIcon,
  VideoCall as VideoCallIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

declare global {
  interface Window {
    Calendly: any;
  }
}

const meetingTypes = [
  {
    title: 'Technical Consultation',
    duration: '30 minutes',
    description: 'Quick discussion about your technical challenges, architecture questions, or project requirements.',
    icon: PersonIcon,
    ideal: ['Project scoping', 'Architecture advice', 'Technology selection'],
  },
  {
    title: 'Full Project Interview',
    duration: '60 minutes',
    description: 'Comprehensive discussion about your project, including requirements, timeline, and detailed technical planning.',
    icon: BusinessIcon,
    ideal: ['New project planning', 'Full requirements review', 'Team collaboration'],
  },
  {
    title: 'Code Review Session',
    duration: '45 minutes',
    description: 'Review your existing codebase, identify improvements, and discuss best practices and optimization strategies.',
    icon: VideoCallIcon,
    ideal: ['Code audit', 'Performance optimization', 'Security review'],
  },
];

const availability = {
  timezone: 'CST (UTC-6)',
  hours: 'Monday - Friday, 9:00 AM - 6:00 PM',
  note: 'I accommodate different time zones and can schedule outside regular hours when needed.',
};

export default function SchedulePage() {
  useEffect(() => {
    // Load Calendly widget script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script when component unmounts
      const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const openCalendlyModal = (url: string) => {
    if (window.Calendly) {
      window.Calendly.initPopupWidget({
        url: url
      });
    } else {
      // Fallback - open in new window
      window.open(url, '_blank');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" component="h1" sx={{ mb: 2 }}>
            Schedule Interview
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4 }}>
            Book a time that works for you to discuss your project requirements
          </Typography>
        </Box>

        {/* Meeting Types */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" component="h2" sx={{ mb: 4, textAlign: 'center' }}>
            Choose Meeting Type
          </Typography>
          <Grid container spacing={4}>
            {meetingTypes.map((meeting, index) => {
              const Icon = meeting.icon;
              return (
                <Grid item xs={12} md={4} key={meeting.title}>
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
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Icon sx={{ color: '#3b82f6', fontSize: '2rem', mr: 2 }} />
                          <Box>
                            <Typography variant="h5" component="h3">
                              {meeting.title}
                            </Typography>
                            <Chip
                              label={meeting.duration}
                              size="small"
                              sx={{
                                background: 'rgba(6, 182, 212, 0.1)',
                                color: '#06b6d4',
                                border: '1px solid rgba(6, 182, 212, 0.3)',
                              }}
                            />
                          </Box>
                        </Box>

                        <Typography
                          variant="body2"
                          sx={{ mb: 3, color: 'text.secondary', lineHeight: 1.8 }}
                        >
                          {meeting.description}
                        </Typography>

                        <Typography variant="subtitle2" sx={{ mb: 2, color: '#3b82f6' }}>
                          Ideal for:
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, mb: 3 }}>
                          {meeting.ideal.map((item) => (
                            <Typography
                              key={item}
                              component="li"
                              variant="body2"
                              sx={{ color: 'text.secondary', mb: 0.5 }}
                            >
                              {item}
                            </Typography>
                          ))}
                        </Box>

                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => openCalendlyModal('https://calendly.com/cloudcodetree')}
                          sx={{
                            mt: 'auto',
                            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #2563eb, #0891b2)',
                            },
                          }}
                        >
                          Schedule {meeting.title}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* Availability Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Card className="glass" sx={{ mb: 6 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" component="h2" sx={{ mb: 4, textAlign: 'center' }}>
                Availability & Details
              </Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <TimeIcon sx={{ color: '#3b82f6' }} />
                    <Typography variant="h6">Timezone</Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    {availability.timezone}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <ScheduleIcon sx={{ color: '#3b82f6' }} />
                    <Typography variant="h6">Regular Hours</Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    {availability.hours}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <VideoCallIcon sx={{ color: '#3b82f6' }} />
                    <Typography variant="h6">Meeting Format</Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    Video call via Google Meet or Zoom
                  </Typography>
                </Grid>
              </Grid>
              <Box sx={{ mt: 4, p: 3, background: 'rgba(59, 130, 246, 0.05)', borderRadius: 2 }}>
                <Typography variant="body1" sx={{ textAlign: 'center', color: 'text.secondary' }}>
                  <strong>Note:</strong> {availability.note}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Embedded Calendly Widget */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <Card className="glass">
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h4" component="h2" sx={{ mb: 3, textAlign: 'center' }}>
                Schedule Directly
              </Typography>
              <Box
                sx={{
                  height: '600px',
                  background: '#fff',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                {/* Replace the URL below with your actual Calendly URL */}
                <iframe
                  src="https://calendly.com/cloudcodetree"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  title="Schedule Interview"
                  style={{ border: 'none' }}
                />
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* What to Expect */}
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h4" component="h2" sx={{ mb: 4 }}>
            What to Expect
          </Typography>
          <Grid container spacing={4}>
            {[
              {
                title: 'Preparation',
                description: 'You\'ll receive a confirmation email with meeting details and a brief questionnaire to help me prepare.',
              },
              {
                title: 'Discussion',
                description: 'We\'ll discuss your project requirements, technical challenges, and explore potential solutions together.',
              },
              {
                title: 'Follow-up',
                description: 'After our meeting, I\'ll send you a summary with recommendations and next steps if we decide to work together.',
              },
            ].map((step, index) => (
              <Grid item xs={12} md={4} key={step.title}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h5" component="h3" sx={{ mb: 2, color: '#3b82f6' }}>
                      {index + 1}. {step.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                      {step.description}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>
    </Container>
  );
}