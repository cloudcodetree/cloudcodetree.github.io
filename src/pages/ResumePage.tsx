import { useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Verified as VerifiedIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import ReCAPTCHA from 'react-google-recaptcha';
import { motion } from 'framer-motion';

const experience = [
  {
    title: 'Senior Full Stack Developer',
    company: 'CloudCodeTree',
    period: '2022 - Present',
    description: 'Lead development of scalable web applications using React, Node.js, and AWS. Implemented DevSecOps practices and mentored junior developers.',
    technologies: ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker', 'Kubernetes'],
  },
  {
    title: 'Cloud Solutions Architect',
    company: 'TechCorp Inc.',
    period: '2020 - 2022',
    description: 'Designed and implemented cloud infrastructure solutions for enterprise clients. Reduced operational costs by 40% through optimization.',
    technologies: ['AWS', 'Terraform', 'Python', 'PostgreSQL', 'Redis'],
  },
  {
    title: 'Full Stack Developer',
    company: 'StartupXYZ',
    period: '2018 - 2020',
    description: 'Built MVP products from scratch using modern web technologies. Collaborated closely with product and design teams.',
    technologies: ['React', 'Node.js', 'MongoDB', 'GraphQL', 'Docker'],
  },
];

const education = [
  {
    degree: 'Master of Science in Computer Science',
    school: 'Stanford University',
    period: '2016 - 2018',
    description: 'Specialized in Distributed Systems and Machine Learning',
  },
  {
    degree: 'Bachelor of Science in Software Engineering',
    school: 'UC Berkeley',
    period: '2012 - 2016',
    description: 'Graduated Magna Cum Laude, Focus on Web Technologies',
  },
];

const certifications = [
  'AWS Solutions Architect Professional',
  'Certified Kubernetes Administrator',
  'Google Cloud Professional Cloud Architect',
  'HashiCorp Terraform Associate',
];

export default function ResumePage() {
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);

  const handleDownloadClick = () => {
    if (isVerified) {
      // Simulate PDF download
      const link = document.createElement('a');
      link.href = '/resume.pdf'; // You'll need to add this file to public folder
      link.download = 'Chris_Harper_Resume.pdf';
      link.click();
    } else {
      setVerificationOpen(true);
    }
  };

  const handleVerification = () => {
    if (captchaValue) {
      setIsVerified(true);
      setVerificationOpen(false);
      // Trigger download after verification
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = '/resume.pdf';
        link.download = 'Chris_Harper_Resume.pdf';
        link.click();
      }, 500);
    }
  };

  const onCaptchaChange = (value: string | null) => {
    setCaptchaValue(value);
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
            Resume
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4 }}>
            Full Stack Developer & Cloud Solutions Architect
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={isVerified ? <VerifiedIcon /> : <DownloadIcon />}
            onClick={handleDownloadClick}
            sx={{
              px: 4,
              py: 1.5,
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #2563eb, #0891b2)',
              },
            }}
          >
            {isVerified ? 'Download Resume (Verified)' : 'Download Resume PDF'}
          </Button>
          {isVerified && (
            <Alert severity="success" sx={{ mt: 2, maxWidth: 'sm', mx: 'auto' }}>
              Verification successful! You can now download the complete resume with contact information.
            </Alert>
          )}
        </Box>

        {/* Experience Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" component="h2" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            <WorkIcon /> Professional Experience
          </Typography>
          <Grid container spacing={3}>
            {experience.map((exp, index) => (
              <Grid item xs={12} key={exp.title}>
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="glass" sx={{ p: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h5" component="h3" sx={{ mb: 1 }}>
                            {exp.title}
                          </Typography>
                          <Typography variant="h6" sx={{ color: '#3b82f6', mb: 1 }}>
                            {exp.company}
                          </Typography>
                        </Box>
                        <Chip label={exp.period} variant="outlined" />
                      </Box>
                      <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8 }}>
                        {exp.description}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {exp.technologies.map((tech) => (
                          <Chip
                            key={tech}
                            label={tech}
                            size="small"
                            sx={{
                              background: 'rgba(59, 130, 246, 0.1)',
                              color: '#3b82f6',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                            }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Education Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" component="h2" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            <SchoolIcon /> Education
          </Typography>
          <Grid container spacing={3}>
            {education.map((edu, index) => (
              <Grid item xs={12} md={6} key={edu.degree}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="glass" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
                        {edu.degree}
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#3b82f6', mb: 1 }}>
                        {edu.school}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        {edu.period}
                      </Typography>
                      <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                        {edu.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Certifications Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" component="h2" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            <StarIcon /> Certifications
          </Typography>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Card className="glass">
              <CardContent>
                <Grid container spacing={2}>
                  {certifications.map((cert, index) => (
                    <Grid item xs={12} sm={6} key={cert}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <VerifiedIcon sx={{ color: '#3b82f6' }} />
                        <Typography variant="body1">{cert}</Typography>
                      </Box>
                      {index < certifications.length - 1 && (
                        <Divider sx={{ mt: 2, display: { sm: 'none' } }} />
                      )}
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Box>
      </motion.div>

      {/* Verification Dialog */}
      <Dialog 
        open={verificationOpen} 
        onClose={() => setVerificationOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Human Verification Required</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3 }}>
            To protect sensitive contact information, please verify that you're human before downloading the complete resume.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <ReCAPTCHA
              sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // Test key - replace with your actual site key
              onChange={onCaptchaChange}
              theme="dark"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleVerification}
            disabled={!captchaValue}
            variant="contained"
          >
            Verify & Download
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}