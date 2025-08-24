import { useState, useEffect } from 'react';
import { Typography, Link } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { getObfuscatedEmailData, reconstructEmail } from '../utils/emailObfuscation';

interface ObfuscatedEmailProps {
  showAsLink?: boolean;
  variant?: 'inherit' | 'body1' | 'body2' | 'caption';
  sx?: SxProps<Theme>;
}

export default function ObfuscatedEmail({ 
  showAsLink = false, 
  variant = 'inherit',
  sx = {} 
}: ObfuscatedEmailProps) {
  const [email, setEmail] = useState<string>('');
  const [displayText, setDisplayText] = useState<string>('Loading...');
  
  useEffect(() => {
    // Delay execution to make it harder for bots
    const timer = setTimeout(() => {
      const emailData = getObfuscatedEmailData();
      const decodedEmail = reconstructEmail(emailData.user, emailData.domain);
      
      setEmail(decodedEmail);
      setDisplayText(emailData.display);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (!showAsLink) return;
    
    e.preventDefault();
    // Additional verification - check if user interaction seems genuine
    const userAgent = navigator.userAgent;
    const hasValidUserAgent = userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari');
    
    if (hasValidUserAgent) {
      window.location.href = `mailto:${email}`;
    }
  };

  if (showAsLink) {
    return (
      <Link
        href={`mailto:${email}`}
        onClick={handleClick}
        sx={{ 
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' },
          ...sx 
        }}
      >
        <Typography variant={variant} component="span">
          {displayText}
        </Typography>
      </Link>
    );
  }

  return (
    <Typography variant={variant} sx={sx}>
      {displayText}
    </Typography>
  );
}