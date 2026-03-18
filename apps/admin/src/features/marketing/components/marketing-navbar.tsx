import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Button, Container, Stack, Typography } from '@mui/material';

interface MarketingNavbarProps {
  onCreateAccount: () => void;
  onSignIn: () => void;
}

const navLinks = [
  { href: '#features', label: 'المميزات' },
  { href: '#themes', label: 'القوالب' },
  { href: '#pricing', label: 'الأسعار' },
  { href: '#faq', label: 'الأسئلة الشائعة' },
];

export function MarketingNavbar({ onCreateAccount, onSignIn }: MarketingNavbarProps) {
  const theme = useTheme();
  const sectionIds = useMemo(() => navLinks.map((item) => item.href.replace('#', '')), []);
  const [activeSection, setActiveSection] = useState(sectionIds[0] ?? '');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function resolveActiveSection(): string {
      const offset = 100;
      const currentY = window.scrollY + offset;
      let currentSection = sectionIds[0] ?? '';

      sectionIds.forEach((id) => {
        const section = document.getElementById(id);
        if (section && currentY >= section.offsetTop) {
          currentSection = id;
        }
      });

      return currentSection;
    }

    function handleScroll(): void {
      setIsScrolled(window.scrollY > 20);
      setActiveSection(resolveActiveSection());
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sectionIds]);

  function navigateToSection(event: MouseEvent<HTMLAnchorElement>, href: string): void {
    event.preventDefault();
    const id = href.replace('#', '');
    const target = document.getElementById(id);
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  }

  return (
    <Box
      component="header"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'all 0.3s ease',
        borderBottom: '1px solid',
        borderColor: isScrolled ? 'divider' : 'transparent',
        bgcolor: isScrolled ? alpha(theme.palette.background.paper, 0.9) : 'transparent',
        backdropFilter: isScrolled ? 'blur(12px)' : 'none',
        py: { xs: 1.5, md: 2 },
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.main',
                color: 'white',
                fontWeight: 900,
                fontSize: '1.2rem',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              K
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.5px', mb: 0 }}>
              كليم ستور
            </Typography>
          </Stack>

          {/* Links - Desktop */}
          <Stack direction="row" spacing={3} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {navLinks.map((item) => (
              <Box
                key={item.href}
                component="a"
                href={item.href}
                onClick={(e) => navigateToSection(e as any, item.href)}
                sx={{
                  textDecoration: 'none',
                  color: activeSection === item.href.replace('#', '') ? 'primary.main' : 'text.secondary',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  transition: 'color 0.2s',
                  '&:hover': { color: 'primary.main' },
                }}
              >
                {item.label}
              </Box>
            ))}
          </Stack>

          {/* Actions */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="text"
              onClick={onSignIn}
              sx={{ display: { xs: 'none', sm: 'flex' }, color: 'text.primary', fontWeight: 700 }}
            >
              تسجيل الدخول
            </Button>
            <Button
              variant="contained"
              onClick={onCreateAccount}
              sx={{ px: { xs: 2, md: 3 } }}
            >
              أنشئ متجرك مجاناً
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
