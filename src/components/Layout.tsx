import { useState, useEffect } from 'react';
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
  Fade,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  // Work as WorkIcon,
  // Article as ArticleIcon,
  ContactMail as ContactIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

import HomePage from '../pages/HomePage';
import ResumePage from '../pages/ResumePage';
import ContactPage from '../pages/ContactPage';
import SchedulePage from '../pages/SchedulePage';

const navItems = [
  { name: 'Home', path: '/', icon: HomeIcon },
  { name: 'Resume', path: '/resume', icon: PersonIcon },
  // { name: 'Projects', path: '/projects', icon: WorkIcon },
  // { name: 'Blog', path: '/blog', icon: ArticleIcon },
  { name: 'Contact', path: '/contact', icon: ContactIcon },
  { name: 'Schedule', path: '/schedule', icon: ScheduleIcon },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAnimationReady, setIsAnimationReady] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  // Ensure animations are ready before showing content
  useEffect(() => {
    // Small delay to prevent flash of unstyled content
    const timer = setTimeout(() => {
      setIsAnimationReady(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const currentPage = navItems.find(item => item.path === location.pathname);
  const pageTitle = currentPage ? `${currentPage.name} | Chris Harper` : 'Chris Harper | CloudCodeTree';

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
              // Keep original SVG colors - purple circle with white content looks good in dark theme
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
                to={item.path}
                onClick={handleDrawerToggle}
                selected={location.pathname === item.path}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRight: '3px solid #3b82f6',
                  },
                }}
              >
                <Icon sx={{ mr: 2, color: location.pathname === item.path ? '#3b82f6' : 'inherit' }} />
                <ListItemText primary={item.name} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content="Chris Harper - Principal Software Engineering Manager with extensive experience leading teams and architecting enterprise cloud solutions" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>

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
                    // Keep original SVG colors - purple circle with white content looks good in dark theme
                  }}
                />
                <Typography
                  variant="h6"
                  component={Link}
                  to="/"
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
                    to={item.path}
                    color="inherit"
                    startIcon={<item.icon />}
                    sx={{
                      color: location.pathname === item.path ? '#3b82f6' : 'inherit',
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
                key={location.pathname}
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
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/resume" element={<ResumePage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/schedule" element={<SchedulePage />} />
                </Routes>
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
            >
              {/* Hidden loading state - content will fade in when ready */}
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
}