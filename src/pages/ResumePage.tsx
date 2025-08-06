import { useState } from 'react';
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
  Grid,
  Divider,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Verified as VerifiedIcon,
  LinkedIn as LinkedInIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import PrintableResume from '../components/PrintableResume';

export default function ResumePage() {
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [honeypot, setHoneypot] = useState<string>('');
  const [dialogStartTime, setDialogStartTime] = useState<number>(0);
  const [printMode, setPrintMode] = useState<boolean>(false);

  const handleDownloadClick = () => {
    if (isVerified) {
      // Simulate PDF download
      const link = document.createElement('a');
      link.href = '/resume.pdf'; // You'll need to add this file to public folder
      link.download = 'Chris_Harper_Resume.pdf';
      link.click();
    } else {
      setVerificationOpen(true);
      setDialogStartTime(Date.now());
    }
  };

  const handleVerification = () => {
    // Check honeypot - if filled, it's a bot
    if (honeypot) {
      console.log('Bot detected: honeypot field filled');
      return; // Silently reject
    }

    // Check if enough time has passed (at least 2 seconds)
    const timeTaken = Date.now() - dialogStartTime;
    if (timeTaken < 2000) {
      return; // Too fast, likely a bot
    }

    setIsVerified(true);
    setVerificationOpen(false);
    setHoneypot(''); // Reset honeypot
    
    // Trigger download after verification
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = '/resume.pdf';
      link.download = 'Chris_Harper_Resume.pdf';
      link.click();
    }, 500);
  };

  const handleHoneypotChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHoneypot(event.target.value);
  };

  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 100);
  };

  if (printMode) {
    return <PrintableResume />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" component="h1" sx={{ mb: 2 }}>
            Resume
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4 }}>
            Full Stack Developer & Cloud Solutions Architect
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 2 }}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ px: 4, py: 1.5 }}
            >
              Print Resume
            </Button>
            
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
              {isVerified ? 'Download Full Resume (Verified)' : 'Download Full Resume'}
            </Button>
          </Box>
          
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, fontStyle: 'italic' }}>
            Print optimized version available • Full PDF with contact details requires verification
          </Typography>
          {isVerified && (
            <Alert severity="success" sx={{ mt: 2, maxWidth: 'sm', mx: 'auto' }}>
              Verification successful! You can now download the complete resume with contact information.
            </Alert>
          )}
        </Box>

        {/* Resume Content */}
        <Box sx={{ mb: 8 }}>
          <Card className="glass">
            <CardContent sx={{ p: 4 }}>
              {/* Header */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography 
                  variant="h3" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 700, 
                    mb: 1,
                    background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  CHRIS HARPER
                </Typography>
                <Typography variant="h6" sx={{ color: '#06b6d4', mb: 3, fontWeight: 600 }}>
                  Senior Software Engineering Leader | Cloud Architect | Engineering Manager
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#3b82f6' }}>
                    <LinkedInIcon fontSize="small" />
                    <Typography variant="body2">linkedin.com/in/cloudcodetree</Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 3, background: 'rgba(59, 130, 246, 0.3)' }} />

              {/* Professional Summary */}
              <Box sx={{ mb: 4, textAlign: 'left' }}>
                <Typography variant="h5" sx={{ color: '#3b82f6', fontWeight: 600, mb: 2, borderBottom: '2px solid rgba(59, 130, 246, 0.3)', pb: 1 }}>
                  PROFESSIONAL SUMMARY
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 2, textAlign: 'left' }}>
                  <strong>Engineering Manager & Cloud Architect</strong> with 25+ years of comprehensive experience in <strong>full-stack development</strong>, <strong>cloud architecture</strong>, <strong>infrastructure automation</strong>, <strong>enterprise application design</strong>, and <strong>AI/ML systems</strong>. Proven track record of <strong>leading cross-functional teams of 8-15 engineers</strong>, <strong>driving digital transformation</strong>, and <strong>delivering scalable solutions</strong> from concept to production. Expert in <strong>AWS cloud migrations</strong>, <strong>CI/CD implementation</strong>, <strong>microservices architecture</strong>, <strong>DevOps practices</strong>, <strong>database design</strong>, <strong>API development</strong>, <strong>modern web frameworks</strong>, and <strong>AI agent development</strong>. Strong background in <strong>mobile development</strong>, <strong>e-commerce platforms</strong>, <strong>real-time systems</strong>, <strong>payment integrations</strong>, and <strong>intelligent automation</strong>. Combines <strong>hands-on technical leadership</strong> with <strong>strategic architectural vision</strong> and <strong>agile methodologies</strong>. Advocates for <strong>DevOps culture</strong>, <strong>continuous learning</strong>, and <strong>scalable architecture decisions</strong>. Seeking <strong>Engineering Manager</strong> or <strong>Principal Architect</strong> role to drive <strong>innovation</strong> and <strong>team growth</strong>.
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.8, fontWeight: 600, textAlign: 'left' }}>
                  <strong>Core Leadership Competencies:</strong> Team Leadership • Technical Strategy • Agile/Scrum • Stakeholder Management • Mentoring • Architecture Reviews
                </Typography>
              </Box>

              <Divider sx={{ my: 3, background: 'rgba(59, 130, 246, 0.3)' }} />

              {/* Technical Expertise */}
              <Box sx={{ mb: 4, textAlign: 'left' }}>
                <Typography variant="h5" sx={{ color: '#3b82f6', fontWeight: 600, mb: 3, borderBottom: '2px solid rgba(59, 130, 246, 0.3)', pb: 1 }}>
                  TECHNICAL EXPERTISE
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#06b6d4', fontWeight: 600, mb: 1, textAlign: 'left' }}>
                      Artificial Intelligence & Machine Learning
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6, textAlign: 'left' }}>
                      AI Agent Development • Large Language Models (LLMs) • OpenAI GPT Integration • Claude API • Prompt Engineering • RAG (Retrieval-Augmented Generation) • Vector Databases • AI-Powered Automation • Machine Learning Pipelines • Natural Language Processing • Intelligent Content Moderation
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#06b6d4', fontWeight: 600, mb: 1, textAlign: 'left' }}>
                      Full-Stack Development & Architecture
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.6, textAlign: 'left' }}>
                      <strong>Frontend:</strong> React • Angular • Vue.js • TypeScript • JavaScript • HTML5 • CSS3/SCSS • Material UI • Bootstrap • Responsive Design • Progressive Web Apps (PWA)
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6, textAlign: 'left' }}>
                      <strong>Backend:</strong> Node.js • Python • Java • Express • RESTful APIs • GraphQL • Microservices • Serverless Architecture • Event-Driven Architecture • Domain-Driven Design
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#06b6d4', fontWeight: 600, mb: 1, textAlign: 'left' }}>
                      Mobile & Cross-Platform
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6, textAlign: 'left' }}>
                      React Native • Cordova • Hybrid Applications • iOS SDK • Android SDK • Mobile-First Design • App Store Deployment
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#06b6d4', fontWeight: 600, mb: 1, textAlign: 'left' }}>
                      Database & Data Management
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.6, textAlign: 'left' }}>
                      <strong>SQL:</strong> PostgreSQL • MySQL • SQL Server • Oracle
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6, textAlign: 'left' }}>
                      <strong>NoSQL:</strong> MongoDB • DynamoDB • Redis • Elasticsearch • Data Architecture • Database Design • Performance Optimization • Data Migration
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#06b6d4', fontWeight: 600, mb: 1, textAlign: 'left' }}>
                      E-Commerce & Payment Systems
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6, textAlign: 'left' }}>
                      Payment Gateway Integration • Magento • Shopify • E-commerce Architecture • PCI Compliance • Financial Services Applications • Real-time Transaction Processing
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#06b6d4', fontWeight: 600, mb: 1, textAlign: 'left' }}>
                      Cloud Platforms & DevOps
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6, textAlign: 'left' }}>
                      AWS (Compute: Lambda, ECS, EKS, EC2 • Storage: S3, RDS • Networking: VPC, API Gateway, Route53 • Management: CloudFormation, CloudWatch) • Azure • Infrastructure as Code (Terraform, CDK) • CI/CD Pipelines • Docker • Kubernetes • OpenShift • GitOps
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#06b6d4', fontWeight: 600, mb: 1, textAlign: 'left' }}>
                      Real-Time & Interactive Systems
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6, textAlign: 'left' }}>
                      WebSockets • Real-time Chat Systems • Video Streaming • Interactive Media • WebRTC • Socket.io • Real-time Analytics • Live Data Visualization
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#06b6d4', fontWeight: 600, mb: 1, textAlign: 'left' }}>
                      Development Tools & Processes
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6, textAlign: 'left' }}>
                      Git • Webpack • Gulp • Grunt • NPM • Testing Frameworks (Jest, Jasmine, Karma, Protractor) • Code Quality Tools • Performance Monitoring
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" sx={{ color: '#06b6d4', fontWeight: 600, mb: 1, textAlign: 'left' }}>
                      Leadership & Process
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6, textAlign: 'left' }}>
                      Agile/Scrum • Kanban • Sprint Planning • Backlog Grooming • Code Reviews • Technical Interviews • Team Mentoring • Cross-functional Collaboration
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3, background: 'rgba(59, 130, 246, 0.3)' }} />

              {/* Leadership Highlights */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ color: '#3b82f6', fontWeight: 600, mb: 2, borderBottom: '2px solid rgba(59, 130, 246, 0.3)', pb: 1 }}>
                  LEADERSHIP HIGHLIGHTS
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 0, listStyleType: 'disc', '& li': { mb: 1, lineHeight: 1.6, display: 'list-item' } }}>
                  <li><Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>Led cloud transformation initiatives</Typography> for 15+ development teams across multiple business units</li>
                  <li><Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>Mentored 20+ junior and mid-level developers</Typography> throughout career, with 80% promotion rate to senior roles</li>
                  <li><Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>Established DevOps practices and CI/CD standards</Typography> adopted company-wide, reducing deployment failures by 60%</li>
                  <li><Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>Drove technical hiring standards</Typography> and interview processes, improving team quality and retention</li>
                  <li><Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>Championed automation-first culture</Typography> with AI-powered tools, resulting in 70% reduction in manual processes</li>
                  <li><Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>Built cross-functional collaboration frameworks</Typography> between development, operations, and business teams</li>
                  <li><Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>Pioneered AI agent development</Typography> for enterprise automation, reducing operational overhead by 45%</li>
                </Box>
              </Box>

              <Divider sx={{ my: 3, background: 'rgba(59, 130, 246, 0.3)' }} />

              {/* Professional Experience */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ color: '#3b82f6', fontWeight: 600, mb: 3, borderBottom: '2px solid rgba(59, 130, 246, 0.3)', pb: 1 }}>
                  PROFESSIONAL EXPERIENCE
                </Typography>

                {/* ALSAC */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ color: '#06b6d4', fontWeight: 600, mb: 0.5 }}>
                    Cloud Solutions Architect (Contract) | ALSAC/St. Jude Children's Research Hospital
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontStyle: 'italic' }}>
                    May 2023 - Present | Remote
                  </Typography>
                  <Box component="ul" sx={{ pl: 3, mb: 0, listStyleType: 'disc', '& li': { mb: 1, lineHeight: 1.6, display: 'list-item' } }}>
                    <li>Led enterprise cloud transformation initiative, architecting and executing migration of legacy on-premises applications to AWS in 6 months vs. 18-month industry average, improving scalability and reducing infrastructure costs by 40%</li>
                    <li>Designed and implemented CI/CD pipelines using GitLab/Jenkins, enabling automated testing and deployment processes that reduced release cycle time from 2 weeks to 4 hours</li>
                    <li>Architected enterprise Kafka messaging infrastructure for real-time data processing, supporting critical healthcare applications with 99.9% uptime and processing 10M+ messages daily</li>
                    <li>Developed Infrastructure as Code solutions using Terraform, creating reusable templates that standardized deployment processes across 15+ development teams and reduced provisioning time by 85%</li>
                    <li>Built and published NPM libraries for internal development teams, increasing code reusability by 60% and accelerating feature development by 3 weeks per sprint</li>
                    <li>Managed production Kubernetes clusters on OpenShift, ensuring high availability and optimal resource utilization for 50+ containerized microservices</li>
                    <li>Mentored development teams on cloud-native development patterns and DevOps best practices, resulting in 40% improvement in code quality metrics</li>
                  </Box>
                </Box>

                {/* Blue Sky */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ color: '#06b6d4', fontWeight: 600, mb: 0.5 }}>
                    Managing Principal Cloud Consultant | Blue Sky Cloud Consulting
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontStyle: 'italic' }}>
                    Aug 2020 - Apr 2023 | Remote
                  </Typography>
                  <Box component="ul" sx={{ pl: 3, mb: 0, listStyleType: 'disc', '& li': { mb: 1, lineHeight: 1.6, display: 'list-item' } }}>
                    <li>Led technical consulting engagements for Fortune 500 clients including GitKraken and Rivian, managing cross-functional teams of 8+ engineers and delivering projects 20% ahead of schedule</li>
                    <li>Architected cloud migration strategies performing "lift and shift" operations for 12 enterprise clients, reducing operational costs by 35% while improving system reliability to 99.8% uptime</li>
                    <li>Designed IoT integration solutions for Rivian's battery cell factories using AWS CDK, connecting 500+ PLC systems with cloud analytics platforms processing real-time manufacturing data</li>
                    <li>Built complete SaaS platforms for solar energy companies, implementing multi-tenant architecture serving 10,000+ users with real-time analytics and automated billing systems</li>
                    <li>Architected white-label social media platform for residential communities featuring real-time chat, AI-powered content moderation using machine learning models, and social feeds using React, Node.js, and AWS services, deployed across 50+ properties</li>
                    <li>Conducted technical interviews and candidate assessments for Cognits, establishing hiring standards that improved team retention by 30% and technical evaluation processes</li>
                    <li>Delivered Infrastructure as Code solutions using CDK and Terraform, enabling clients to achieve 90% faster deployment cycles and reducing manual configuration errors by 95%</li>
                    <li>Assessed client infrastructure and identified cost-saving opportunities, enhancing operational resilience and business agility</li>
                  </Box>
                </Box>

                {/* Recent positions - condensed for space */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#06b6d4', fontWeight: 600, mb: 0.5 }}>
                    Principal Developer | Cerity
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, fontStyle: 'italic' }}>
                    Aug 2018 - Aug 2020 | Austin, TX
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 2 }}>
                    Led frontend development using Angular and React, architected serverless solutions with AWS services supporting 50,000+ concurrent users, implemented mono-repo architecture, and optimized SEO increasing organic traffic by 200%.
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#06b6d4', fontWeight: 600, mb: 0.5 }}>
                    Lead Developer | ThunderDork LLC
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, fontStyle: 'italic' }}>
                    May 2015 - Aug 2018 | Austin, TX
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 2 }}>
                    Architected full-stack solutions for enterprise clients including Capital One, designed point-of-sale systems, developed mobile applications using React Native, and implemented microservices architecture using Node.js, Docker, and AWS services.
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ color: '#06b6d4', fontWeight: 600, mb: 0.5 }}>
                    Senior Frontend Developer | Netspend
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, fontStyle: 'italic' }}>
                    Dec 2013 - May 2015 | Austin, TX
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 2 }}>
                    Designed and built customer account interfaces for leading prepaid card platform serving millions of users, developed internal corporate tools using Angular, and implemented comprehensive automated testing with CI/CD deployments.
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', textAlign: 'center' }}>
                  Additional experience includes senior roles at Cinsay, Schematic, Imc2, True.com, and Idea Integration (2001-2013)
                </Typography>
              </Box>

              <Divider sx={{ my: 3, background: 'rgba(59, 130, 246, 0.3)' }} />

              {/* Education & Certifications */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ color: '#3b82f6', fontWeight: 600, mb: 2, borderBottom: '2px solid rgba(59, 130, 246, 0.3)', pb: 1 }}>
                  EDUCATION & CERTIFICATIONS
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.6 }}>
                  <strong>Associate of Applied Arts, Computer Animation</strong><br />
                  The Art Institute of Dallas
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
                  <strong>AWS Certified Developer - Associate</strong><br />
                  <strong>Additional AWS Certifications</strong> (multiple cloud competencies)
                </Typography>
              </Box>

              <Divider sx={{ my: 3, background: 'rgba(59, 130, 246, 0.3)' }} />

              {/* Key Achievements */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ color: '#3b82f6', fontWeight: 600, mb: 2, borderBottom: '2px solid rgba(59, 130, 246, 0.3)', pb: 1 }}>
                  KEY ACHIEVEMENTS
                </Typography>
                <Box component="ul" sx={{ pl: 3, mb: 0, listStyleType: 'disc', '& li': { mb: 1, lineHeight: 1.6, fontWeight: 600, display: 'list-item' } }}>
                  <li>25+ years of progressive software engineering experience across healthcare, fintech, automotive, and government sectors</li>
                  <li>Webby People's Choice Award Winner (2007) - recognized for excellence in digital innovation and healthcare awareness campaigns</li>
                  <li>Led digital transformation initiatives for Fortune 500 clients resulting in 40%+ cost reductions and improved scalability</li>
                  <li>Managed cross-functional teams of 8-15 engineers across multiple time zones and business units</li>
                  <li>Architected enterprise solutions serving 50,000+ concurrent users with 99.9% uptime and sub-100ms response times</li>
                  <li>Established DevOps practices reducing deployment cycles from weeks to hours while improving system reliability by 60%</li>
                  <li>Built reusable platforms and frameworks adopted across multiple business units, accelerating development by 30%</li>
                  <li>Mentored 20+ developers with 80% promotion rate to senior engineering roles</li>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

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
          
          {/* Honeypot field - hidden from users */}
          <Box 
            component="input" 
            type="text"
            name="website"
            value={honeypot}
            onChange={handleHoneypotChange}
            sx={{ 
              position: 'absolute',
              left: '-9999px',
              opacity: 0,
              pointerEvents: 'none',
              tabIndex: -1
            }}
            tabIndex={-1}
            autoComplete="off"
          />
          
          <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary' }}>
            Click "Verify & Download" to proceed with the download.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleVerification}
            variant="contained"
          >
            Verify & Download
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}