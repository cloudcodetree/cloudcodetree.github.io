import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Email as EmailIcon,
  LocationOn as LocationIcon,
  LinkedIn as LinkedInIcon,
  GitHub as GitHubIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import ReCAPTCHA from 'react-google-recaptcha';
import emailjs from '@emailjs/browser';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const contactInfo = [
  {
    icon: EmailIcon,
    label: 'Email',
    value: 'chris@cloudcodetree.com',
    link: 'mailto:chris@cloudcodetree.com',
  },
  {
    icon: LocationIcon,
    label: 'Location',
    value: 'San Francisco, CA',
    link: null,
  },
  {
    icon: LinkedInIcon,
    label: 'LinkedIn',
    value: '/in/chris-harper-dev',
    link: 'https://linkedin.com/in/chris-harper-dev',
  },
  {
    icon: GitHubIcon,
    label: 'GitHub',
    value: '@cloudcodetree',
    link: 'https://github.com/cloudcodetree',
  },
];

const services = [
  'Full Stack Development',
  'Cloud Architecture',
  'DevSecOps Implementation',
  'Technical Consulting',
  'Code Review & Optimization',
  'Team Training & Mentoring',
];

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);

  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!captchaValue) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Initialize EmailJS with your public key
      emailjs.init('YOUR_PUBLIC_KEY'); // Replace with your actual public key

      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        subject: formData.subject,
        message: formData.message,
        to_email: 'chris@cloudcodetree.com',
      };

      await emailjs.send(
        'YOUR_SERVICE_ID', // Replace with your service ID
        'YOUR_TEMPLATE_ID', // Replace with your template ID
        templateParams
      );

      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setCaptchaValue(null);
    } catch (err) {
      console.error('Email send error:', err);
      setError('Failed to send message. Please try again or contact me directly at chris@cloudcodetree.com');
    } finally {
      setLoading(false);
    }
  };

  const onCaptchaChange = (value: string | null) => {
    setCaptchaValue(value);
  };

  const isFormValid = formData.name && formData.email && formData.subject && formData.message && captchaValue;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" component="h1" sx={{ mb: 2 }}>
            Get In Touch
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4 }}>
            Let's discuss your project requirements and explore how we can work together
          </Typography>
        </Box>

        <Grid container spacing={6}>
          {/* Contact Form */}
          <Grid item xs={12} lg={8}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="glass">
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h4" component="h2" sx={{ mb: 4 }}>
                    Send Message
                  </Typography>

                  {success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                      Thank you for your message! I'll get back to you within 24 hours.
                    </Alert>
                  )}

                  {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {error}
                    </Alert>
                  )}

                  <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Your Name"
                          value={formData.name}
                          onChange={handleInputChange('name')}
                          required
                          disabled={loading}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email Address"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange('email')}
                          required
                          disabled={loading}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Subject"
                          value={formData.subject}
                          onChange={handleInputChange('subject')}
                          required
                          disabled={loading}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Message"
                          multiline
                          rows={6}
                          value={formData.message}
                          onChange={handleInputChange('message')}
                          required
                          disabled={loading}
                          placeholder="Tell me about your project, timeline, and any specific requirements..."
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                          <ReCAPTCHA
                            sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // Test key - replace with your actual site key
                            onChange={onCaptchaChange}
                            theme="dark"
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          fullWidth
                          disabled={!isFormValid || loading}
                          startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                          sx={{
                            py: 1.5,
                            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #2563eb, #0891b2)',
                            },
                            '&:disabled': {
                              background: 'rgba(59, 130, 246, 0.3)',
                            },
                          }}
                        >
                          {loading ? 'Sending...' : 'Send Message'}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Contact Info & Services */}
          <Grid item xs={12} lg={4}>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {/* Contact Information */}
              <Card className="glass" sx={{ mb: 4 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" component="h3" sx={{ mb: 3 }}>
                    Contact Information
                  </Typography>
                  {contactInfo.map((info) => {
                    const Icon = info.icon;
                    return (
                      <Box
                        key={info.label}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          mb: 2,
                          textDecoration: 'none',
                          color: 'inherit',
                          ...(info.link && {
                            cursor: 'pointer',
                            '&:hover': { color: '#3b82f6' }
                          })
                        }}
                        component={info.link ? 'a' : 'div'}
                        href={info.link || undefined}
                        target={info.link ? '_blank' : undefined}
                        rel={info.link ? 'noopener noreferrer' : undefined}
                      >
                        <Icon sx={{ color: '#3b82f6' }} />
                        <Box>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {info.label}
                          </Typography>
                          <Typography variant="body1">
                            {info.value}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Services */}
              <Card className="glass">
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" component="h3" sx={{ mb: 3 }}>
                    Services Offered
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {services.map((service) => (
                      <Chip
                        key={service}
                        label={service}
                        sx={{
                          justifyContent: 'flex-start',
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#3b82f6',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          '&:hover': {
                            background: 'rgba(59, 130, 246, 0.2)',
                          },
                        }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Response Time Info */}
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            I typically respond to messages within 24 hours during business days.
            For urgent matters, feel free to reach out directly via email.
          </Typography>
        </Box>
      </motion.div>
    </Container>
  );
}