import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import ReCAPTCHA from 'react-google-recaptcha';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ResumePage() {
  const [resumeContent, setResumeContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [captchaValue, setCaptchaValue] = useState<string | null>(null);

  // Load resume content from markdown file
  useEffect(() => {
    const loadResumeContent = async () => {
      try {
        const response = await fetch('/resume/chris-harper-resume.md');
        if (!response.ok) {
          throw new Error('Failed to load resume');
        }
        const content = await response.text();
        setResumeContent(content);
      } catch (error) {
        console.error('Error loading resume:', error);
        setResumeContent('# Error Loading Resume\n\nUnable to load resume content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadResumeContent();
  }, []);

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

        {/* Resume Content */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <Typography variant="h6">Loading resume...</Typography>
          </Box>
        ) : (
          <Box sx={{ mb: 8 }}>
            <Card className="glass">
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ 
                  '& h1': { 
                    fontSize: '2.5rem', 
                    fontWeight: 700, 
                    mb: 2, 
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  },
                  '& h2': { 
                    fontSize: '1.8rem', 
                    fontWeight: 600, 
                    mb: 2, 
                    mt: 4,
                    color: '#3b82f6',
                    borderBottom: '2px solid rgba(59, 130, 246, 0.3)',
                    paddingBottom: '0.5rem'
                  },
                  '& h3': { 
                    fontSize: '1.4rem', 
                    fontWeight: 600, 
                    mb: 1.5, 
                    mt: 3,
                    color: '#06b6d4'
                  },
                  '& p': { 
                    mb: 2, 
                    lineHeight: 1.8,
                    '&:has(strong)': {
                      textAlign: 'center',
                      fontSize: '1.1rem',
                      mb: 3
                    }
                  },
                  '& ul': { 
                    mb: 2, 
                    pl: 3,
                    '& li': {
                      mb: 0.5,
                      lineHeight: 1.6
                    }
                  },
                  '& hr': {
                    border: 'none',
                    borderTop: '1px solid rgba(148, 163, 184, 0.3)',
                    my: 4
                  },
                  '& strong': {
                    color: '#3b82f6',
                    fontWeight: 600
                  },
                  '& em': {
                    color: '#06b6d4',
                    fontStyle: 'italic'
                  }
                }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {resumeContent}
                  </ReactMarkdown>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
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