import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Skeleton,
  Alert,
} from '@mui/material';
import { LinkedIn as LinkedInIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ResumeContentProps {
  showContactInfo?: boolean;
}

export default function ResumeContent({ showContactInfo = false }: ResumeContentProps) {
  const [resumeContent, setResumeContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResumeContent = async () => {
      try {
        const response = await fetch('/resume/chris-harper-resume.md');
        if (!response.ok) {
          throw new Error('Failed to fetch resume content');
        }
        const content = await response.text();
        setResumeContent(content);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resume');
      } finally {
        setLoading(false);
      }
    };

    fetchResumeContent();
  }, []);

  // Process the markdown content to hide/show contact information
  const processContent = (content: string) => {
    if (showContactInfo) {
      return content;
    }

    // Replace contact information with placeholder for non-verified users
    return content.replace(
      /chris@cloudcodetree\.com \| 512-938-9697/g,
      'Contact via cloudcodetree.com/contact'
    );
  };

  if (loading) {
    return (
      <Card className="glass">
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Skeleton variant="text" height={60} width="60%" sx={{ mx: 'auto', mb: 2 }} />
            <Skeleton variant="text" height={32} width="80%" sx={{ mx: 'auto', mb: 2 }} />
            <Skeleton variant="text" height={24} width="40%" sx={{ mx: 'auto' }} />
          </Box>
          <Divider sx={{ my: 3 }} />
          {Array.from({ length: 8 }).map((_, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Skeleton variant="text" height={24} width="30%" sx={{ mb: 1 }} />
              <Skeleton variant="text" height={20} width="100%" />
              <Skeleton variant="text" height={20} width="100%" />
              <Skeleton variant="text" height={20} width="80%" />
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass">
        <CardContent sx={{ p: 4 }}>
          <Alert severity="error">
            {error}. Please try refreshing the page or contact directly via cloudcodetree.com/contact.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass">
      <CardContent sx={{ p: 4 }}>
        <Box sx={{
          '& h1': { 
            textAlign: 'center',
            fontSize: '2.5rem',
            fontWeight: 700,
            mb: 2,
            background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          },
          '& h3': { 
            color: '#3b82f6', 
            fontWeight: 600, 
            mb: 2, 
            fontSize: '1.5rem',
            borderBottom: '2px solid rgba(59, 130, 246, 0.3)', 
            pb: 1,
            mt: 4,
          },
          '& p': { 
            mb: 2, 
            lineHeight: 1.8,
          },
          '& ul': { 
            pl: 3, 
            mb: 3,
            '& li': { 
              mb: 1, 
              lineHeight: 1.6,
            }
          },
          '& strong': {
            color: '#06b6d4',
            fontWeight: 600,
          },
          '& a': {
            color: '#3b82f6',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
          // Style the contact line specially
          '& p:nth-of-type(1)': {
            textAlign: 'center',
            color: 'text.secondary',
            fontSize: '1.1rem',
            mb: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 1,
          },
        }}>
          {!showContactInfo && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Alert severity="info" sx={{ maxWidth: 'md', mx: 'auto' }}>
                Contact information is protected. Complete verification to access full resume with phone and email.
              </Alert>
            </Box>
          )}
          
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom rendering for specific elements
              h1: ({ children }) => (
                <Typography 
                  variant="h2" 
                  component="h1" 
                  sx={{
                    textAlign: 'center',
                    fontWeight: 700,
                    mb: 2,
                    background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {children}
                </Typography>
              ),
              h3: ({ children }) => (
                <>
                  <Divider sx={{ my: 3, background: 'rgba(59, 130, 246, 0.3)' }} />
                  <Typography 
                    variant="h4" 
                    component="h3"
                    sx={{ 
                      color: '#3b82f6', 
                      fontWeight: 600, 
                      mb: 2,
                      fontSize: '1.5rem',
                      borderBottom: '2px solid rgba(59, 130, 246, 0.3)', 
                      pb: 1 
                    }}
                  >
                    {children}
                  </Typography>
                </>
              ),
              // Handle the first paragraph (contact info) specially
              p: ({ children, ...props }) => {
                const content = children?.toString() || '';
                
                // Check if this is the contact info paragraph
                if (content.includes('cloudcodetree.com') && content.includes('linkedin.com')) {
                  return (
                    <Box sx={{ 
                      textAlign: 'center', 
                      mb: 4, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                      gap: 1,
                      color: 'text.secondary',
                      fontSize: '1.1rem'
                    }}>
                      <LinkedInIcon fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body1" component="span">
                        {children}
                      </Typography>
                    </Box>
                  );
                }
                
                return (
                  <Typography 
                    variant="body1" 
                    sx={{ mb: 2, lineHeight: 1.8 }}
                    {...props}
                  >
                    {children}
                  </Typography>
                );
              },
            }}
          >
            {processContent(resumeContent)}
          </ReactMarkdown>
        </Box>
      </CardContent>
    </Card>
  );
}