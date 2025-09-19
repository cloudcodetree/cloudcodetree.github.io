'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery,
  Container,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  ContactMail as ContactIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { name: 'Home', path: '/', icon: HomeIcon },
  { name: 'Resume', path: '/resume', icon: PersonIcon },
  { name: 'Contact', path: '/contact', icon: ContactIcon },
  { name: 'Schedule', path: '/schedule', icon: ScheduleIcon },
];

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAnimationReady, setIsAnimationReady] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimationReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            component="img"
            src="/Fav_Icon.svg"
            alt="CloudCodeTree Logo"
            sx={{
              width: 28,
              height: 28,
              mr: 1.5,
            }}
          />
          <Typography variant="h6" className="gradient-text">
            CloudCodeTree
          </Typography>
        </Box>
        <IconButton onClick={handleDrawerToggle} sx={{ display: { md: 'none' } }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <ListItem key={item.name} disablePadding>
              <ListItemButton
                component={Link}
                href={item.path}
                onClick={handleDrawerToggle}
                selected={pathname === item.path}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRight: '3px solid #3b82f6',
                  },
                }}
              >
                <Icon sx={{ mr: 2, color: pathname === item.path ? '#3b82f6' : 'inherit' }} />
                <ListItemText primary={item.name} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: { xs: 1, md: 0 }, mr: 4 }}>
              <Box
                component="img"
                src="/Fav_Icon.svg"
                alt="CloudCodeTree Logo"
                sx={{
                  width: 32,
                  height: 32,
                  mr: 1.5,
                }}
              />
              <Typography
                variant="h6"
                component={Link}
                href="/"
                sx={{
                  textDecoration: 'none',
                  color: 'inherit',
                }}
                className="gradient-text"
              >
                CloudCodeTree
              </Typography>
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, ml: 'auto' }}>
              {navItems.map((item) => (
                <Button
                  key={item.name}
                  component={Link}
                  href={item.path}
                  color="inherit"
                  startIcon={<item.icon />}
                  sx={{
                    color: pathname === item.path ? '#3b82f6' : 'inherit',
                    '&:hover': {
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    },
                  }}
                >
                  {item.name}
                </Button>
              ))}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: mobileOpen ? 'block' : 'none', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 250,
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRight: '1px solid rgba(148, 163, 184, 0.1)',
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: 8, md: 9 },
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        }}
      >
        {isAnimationReady ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                duration: 0.3,
                ease: "easeOut",
                opacity: { duration: 0.2 },
                y: { duration: 0.3 }
              }}
              style={{ minHeight: '100vh' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        ) : (
          <Box
            sx={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
            }}
          />
        )}
      </Box>

      <style jsx global>{`
        .gradient-text {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-fill-color: transparent;
        }
      `}</style>
    </Box>
  );
}