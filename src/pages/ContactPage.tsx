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
import ObfuscatedEmail from '../components/ObfuscatedEmail';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  honeypot: string; // Hidden field to catch bots
  website: string; // Additional honeypot
  phone: string; // Phone honeypot
  company: string; // Company honeypot
}

const contactInfo = [
  {
    icon: EmailIcon,
    label: 'Email',
    value: 'obfuscated', // Special marker for obfuscated email
    link: 'mailto:chris@cloudcodetree.com',
  },
  {
    icon: LocationIcon,
    label: 'Location',
    value: 'Austin Metropolitan Area',
    link: null,
  },
  {
    icon: LinkedInIcon,
    label: 'LinkedIn',
    value: '/in/cloudcodetree',
    link: 'https://www.linkedin.com/in/cloudcodetree/',
  },
  {
    icon: GitHubIcon,
    label: 'GitHub',
    value: '@cloudcodetree',
    link: 'https://github.com/cloudcodetree',
  },
];

const services = [
  'Engineering Team Leadership',
  'Cloud Architecture (AWS/Azure/GCP)',
  'Digital Transformation',
  'DevOps & AI/ML Implementation',
  'Technical Strategy & Consulting',
  'Enterprise Application Development',
];

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    honeypot: '', // Hidden honeypot field
    website: '', // Website honeypot
    phone: '', // Phone honeypot  
    company: '', // Company honeypot
  });

  // Set initial time when component mounts
  const [formStartTime] = useState<number>(Date.now());
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mouseMovements, setMouseMovements] = useState<number>(0);
  const [keystrokes, setKeystrokes] = useState<number>(0);

  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    // Track keystroke activity (legitimate user behavior)
    setKeystrokes(prev => prev + 1);
    
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleMouseMove = () => {
    setMouseMovements(prev => prev + 1);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Multiple honeypot validation - if any filled, it's a bot
    if (formData.honeypot || formData.website || formData.phone || formData.company) {
      console.log('Bot detected: honeypot field filled');
      return; // Silently reject
    }

    // User interaction validation
    if (mouseMovements < 3 || keystrokes < 5) {
      console.log('Bot detected: insufficient user interaction');
      return; // Silently reject
    }

    // Time validation - too fast submission indicates bot
    const timeTaken = Date.now() - formStartTime;
    if (timeTaken < 3000) { // Less than 3 seconds
      setError('Please take a moment to review your message before sending.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Web3Forms submission
      const formDataToSend = new FormData();
      formDataToSend.append('access_key', '0f6f8184-a082-4307-ba26-af5ada2a4511');
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('message', formData.message);
      
      // Add honeypot field for additional spam protection
      if (formData.honeypot) {
        formDataToSend.append('botcheck', formData.honeypot);
      }

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({ name: '', email: '', subject: '', message: '', honeypot: '', website: '', phone: '', company: '' });
        setMouseMovements(0);
        setKeystrokes(0);
      } else {
        throw new Error('Form submission failed');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError('Failed to send message. Please try again or use the email button below to contact me directly.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name && formData.email && formData.subject && formData.message;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" component="h1" sx={{ mb: 2 }}>
            Get In Touch
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
            Looking for engineering leadership or enterprise cloud solutions? Let's discuss your needs.
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, fontStyle: 'italic' }}>
            Extensive experience leading engineering teams and delivering Fortune 500 solutions • All messages go directly to my inbox
          </Typography>
        </Box>

        <Grid container spacing={6}>
          {/* Contact Form */}
          <Grid item xs={12} lg={8}>
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

                  <Box 
                    component="form" 
                    onSubmit={handleSubmit}
                    onMouseMove={handleMouseMove}
                  >
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
                          placeholder="Tell me about your engineering challenges, team needs, or cloud architecture requirements..."
                        />
                      </Grid>
                      {/* Multiple honeypot fields - hidden from users but visible to bots */}
                      <Grid item xs={12} sx={{ display: 'none' }}>
                        <TextField
                          name="website"
                          label="Website (leave blank)"
                          value={formData.honeypot}
                          onChange={handleInputChange('honeypot')}
                          tabIndex={-1}
                          autoComplete="off"
                          sx={{ 
                            position: 'absolute',
                            left: '-9999px',
                            opacity: 0,
                            pointerEvents: 'none'
                          }}
                        />
                        <TextField
                          name="url"
                          label="URL (leave blank)"
                          value={formData.website}
                          onChange={handleInputChange('website')}
                          tabIndex={-1}
                          autoComplete="off"
                          sx={{ 
                            position: 'absolute',
                            left: '-9999px',
                            opacity: 0,
                            pointerEvents: 'none'
                          }}
                        />
                        <TextField
                          name="phone_number"
                          label="Phone (leave blank)"
                          value={formData.phone}
                          onChange={handleInputChange('phone')}
                          tabIndex={-1}
                          autoComplete="off"
                          sx={{ 
                            position: 'absolute',
                            left: '-9999px',
                            opacity: 0,
                            pointerEvents: 'none'
                          }}
                        />
                        <TextField
                          name="company_name"
                          label="Company (leave blank)"
                          value={formData.company}
                          onChange={handleInputChange('company')}
                          tabIndex={-1}
                          autoComplete="off"
                          sx={{ 
                            position: 'absolute',
                            left: '-9999px',
                            opacity: 0,
                            pointerEvents: 'none'
                          }}
                        />
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
          </Grid>

          {/* Contact Info & Services */}
          <Grid item xs={12} lg={4}>
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
                          {info.value === 'obfuscated' ? (
                            <ObfuscatedEmail variant="body1" />
                          ) : (
                            <Typography variant="body1">
                              {info.value}
                            </Typography>
                          )}
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
          </Grid>
        </Grid>

        {/* Response Time Info */}
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            I typically respond to messages within 24 hours during business days.
            For urgent matters, feel free to reach out directly via email.
          </Typography>
        </Box>
    </Container>
  );
}