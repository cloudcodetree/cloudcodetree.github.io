import { Container, Typography, Box, Divider, Grid } from '@mui/material';

export default function PrintableResume() {
  return (
    <Container maxWidth="lg" sx={{ 
      py: 2,
      '@media print': {
        py: 0,
        maxWidth: 'none',
        margin: 0,
        padding: '0.4in',
      }
    }}>
      <Box sx={{ 
        backgroundColor: 'white', 
        color: 'black',
        minHeight: '100vh',
        '@media print': {
          minHeight: 'auto',
        }
      }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontWeight: 700, 
              mb: 1,
              color: '#2563eb',
              '@media print': {
                fontSize: '22px',
                color: 'black',
                mb: 0.5,
              }
            }}
          >
            CHRIS HARPER
          </Typography>
          <Typography variant="h6" sx={{ 
            color: '#06b6d4', 
            mb: 1, 
            fontWeight: 600,
            '@media print': {
              fontSize: '14px',
              color: 'black',
              mb: 0.5,
            }
          }}>
            Senior Software Engineering Leader | Cloud Architect | Engineering Manager
          </Typography>
          
          <Typography variant="body2" sx={{ 
            color: '#666',
            '@media print': {
              color: 'black',
              fontSize: '10px',
            }
          }}>
            📍 Austin Metropolitan Area • 🔗 linkedin.com/in/cloudcodetree • 📧 Contact via cloudcodetree.com
          </Typography>
        </Box>

        <Divider sx={{ my: 1, '@media print': { borderColor: 'black', my: 0.5 } }} />

        {/* Professional Summary */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ 
            color: '#2563eb', 
            fontWeight: 600, 
            mb: 1,
            '@media print': {
              fontSize: '12px',
              color: 'black',
              textDecoration: 'underline',
              mb: 0.5,
            }
          }}>
            PROFESSIONAL SUMMARY
          </Typography>
          <Typography variant="body2" sx={{ 
            lineHeight: 1.6, 
            mb: 1,
            '@media print': {
              fontSize: '9px',
              lineHeight: 1.4,
              mb: 0.5,
            }
          }}>
            <strong>Engineering Manager & Cloud Architect</strong> with 25+ years of comprehensive experience in <strong>full-stack development</strong>, <strong>cloud architecture</strong>, <strong>infrastructure automation</strong>, <strong>enterprise application design</strong>, and <strong>AI/ML systems</strong>. Proven track record of <strong>leading cross-functional teams of 8-15 engineers</strong>, <strong>driving digital transformation</strong>, and <strong>delivering scalable solutions</strong> from concept to production. Expert in <strong>AWS cloud migrations</strong>, <strong>CI/CD implementation</strong>, <strong>microservices architecture</strong>, <strong>DevOps practices</strong>, <strong>database design</strong>, <strong>API development</strong>, <strong>modern web frameworks</strong>, and <strong>AI agent development</strong>. Strong background in <strong>mobile development</strong>, <strong>e-commerce platforms</strong>, <strong>real-time systems</strong>, <strong>payment integrations</strong>, and <strong>intelligent automation</strong>. Combines <strong>hands-on technical leadership</strong> with <strong>strategic architectural vision</strong> and <strong>agile methodologies</strong>. Advocates for <strong>DevOps culture</strong>, <strong>continuous learning</strong>, and <strong>scalable architecture decisions</strong>. Seeking <strong>Engineering Manager</strong> or <strong>Principal Architect</strong> role to drive <strong>innovation</strong> and <strong>team growth</strong>.
          </Typography>
          <Typography variant="body2" sx={{ 
            lineHeight: 1.6, 
            fontWeight: 600,
            '@media print': {
              fontSize: '9px',
              lineHeight: 1.4,
            }
          }}>
            <strong>Core Leadership Competencies:</strong> Team Leadership • Technical Strategy • Agile/Scrum • Stakeholder Management • Mentoring • Architecture Reviews
          </Typography>
        </Box>

        <Divider sx={{ my: 1, '@media print': { borderColor: 'black', my: 0.3 } }} />

        {/* Technical Expertise */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ 
            color: '#2563eb', 
            fontWeight: 600, 
            mb: 1,
            '@media print': {
              fontSize: '12px',
              color: 'black',
              textDecoration: 'underline',
              mb: 0.5,
            }
          }}>
            TECHNICAL EXPERTISE
          </Typography>
          
          <Grid container spacing={1}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ 
                color: '#06b6d4', 
                fontWeight: 600, 
                mb: 0.5,
                '@media print': {
                  fontSize: '10px',
                  color: 'black',
                  fontWeight: 'bold',
                }
              }}>
                Artificial Intelligence & Machine Learning
              </Typography>
              <Typography variant="body2" sx={{ 
                mb: 1, 
                lineHeight: 1.4,
                '@media print': {
                  fontSize: '8px',
                  mb: 0.5,
                }
              }}>
                AI Agent Development • Large Language Models (LLMs) • OpenAI GPT Integration • Claude API • Prompt Engineering • RAG (Retrieval-Augmented Generation) • Vector Databases • AI-Powered Automation • Machine Learning Pipelines • Natural Language Processing • Intelligent Content Moderation
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ 
                color: '#06b6d4', 
                fontWeight: 600, 
                mb: 0.5,
                '@media print': {
                  fontSize: '10px',
                  color: 'black',
                  fontWeight: 'bold',
                }
              }}>
                Full-Stack Development & Architecture
              </Typography>
              <Typography variant="body2" sx={{ 
                mb: 0.5, 
                lineHeight: 1.4,
                '@media print': {
                  fontSize: '8px',
                }
              }}>
                <strong>Frontend:</strong> React • Angular • Vue.js • TypeScript • JavaScript • HTML5 • CSS3/SCSS • Material UI • Bootstrap • Responsive Design • Progressive Web Apps (PWA)
              </Typography>
              <Typography variant="body2" sx={{ 
                mb: 1, 
                lineHeight: 1.4,
                '@media print': {
                  fontSize: '8px',
                  mb: 0.5,
                }
              }}>
                <strong>Backend:</strong> Node.js • Python • Java • Express • RESTful APIs • GraphQL • Microservices • Serverless Architecture • Event-Driven Architecture • Domain-Driven Design
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ 
                color: '#06b6d4', 
                fontWeight: 600, 
                mb: 0.5,
                '@media print': {
                  fontSize: '10px',
                  color: 'black',
                  fontWeight: 'bold',
                }
              }}>
                Cloud Platforms & DevOps
              </Typography>
              <Typography variant="body2" sx={{ 
                mb: 1, 
                lineHeight: 1.4,
                '@media print': {
                  fontSize: '8px',
                  mb: 0.5,
                }
              }}>
                AWS (Compute: Lambda, ECS, EKS, EC2 • Storage: S3, RDS • Networking: VPC, API Gateway, Route53 • Management: CloudFormation, CloudWatch) • Azure • Infrastructure as Code (Terraform, CDK) • CI/CD Pipelines • Docker • Kubernetes • OpenShift • GitOps
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ 
                color: '#06b6d4', 
                fontWeight: 600, 
                mb: 0.5,
                '@media print': {
                  fontSize: '10px',
                  color: 'black',
                  fontWeight: 'bold',
                }
              }}>
                Database & Data Management
              </Typography>
              <Typography variant="body2" sx={{ 
                mb: 0.5, 
                lineHeight: 1.4,
                '@media print': {
                  fontSize: '8px',
                }
              }}>
                <strong>SQL:</strong> PostgreSQL • MySQL • SQL Server • Oracle
              </Typography>
              <Typography variant="body2" sx={{ 
                mb: 1, 
                lineHeight: 1.4,
                '@media print': {
                  fontSize: '8px',
                  mb: 0.5,
                }
              }}>
                <strong>NoSQL:</strong> MongoDB • DynamoDB • Redis • Elasticsearch • Data Architecture • Database Design • Performance Optimization • Data Migration
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ 
                color: '#06b6d4', 
                fontWeight: 600, 
                mb: 0.5,
                '@media print': {
                  fontSize: '10px',
                  color: 'black',
                  fontWeight: 'bold',
                }
              }}>
                Mobile & Cross-Platform
              </Typography>
              <Typography variant="body2" sx={{ 
                mb: 1, 
                lineHeight: 1.4,
                '@media print': {
                  fontSize: '8px',
                  mb: 0.5,
                }
              }}>
                React Native • Cordova • Hybrid Applications • iOS SDK • Android SDK • Mobile-First Design • App Store Deployment
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" sx={{ 
                color: '#06b6d4', 
                fontWeight: 600, 
                mb: 0.5,
                '@media print': {
                  fontSize: '10px',
                  color: 'black',
                  fontWeight: 'bold',
                }
              }}>
                E-Commerce & Payment Systems
              </Typography>
              <Typography variant="body2" sx={{ 
                mb: 1, 
                lineHeight: 1.4,
                '@media print': {
                  fontSize: '8px',
                  mb: 0.5,
                }
              }}>
                Payment Gateway Integration • Magento • Shopify • E-commerce Architecture • PCI Compliance • Financial Services Applications • Real-time Transaction Processing
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 1, '@media print': { borderColor: 'black', my: 0.3 } }} />

        {/* Leadership Highlights */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ 
            color: '#2563eb', 
            fontWeight: 600, 
            mb: 1,
            '@media print': {
              fontSize: '12px',
              color: 'black',
              textDecoration: 'underline',
              mb: 0.5,
            }
          }}>
            LEADERSHIP HIGHLIGHTS
          </Typography>
          <Box component="ul" sx={{ 
            pl: 2, 
            mb: 0, 
            listStyleType: 'disc', 
            '& li': { 
              mb: 0.5, 
              lineHeight: 1.6, 
              display: 'list-item',
              '@media print': {
                fontSize: '8px',
                lineHeight: 1.3,
                mb: 0.2,
              }
            } 
          }}>
            <li>Led cloud transformation initiatives for 15+ development teams across multiple business units</li>
            <li>Mentored 20+ junior and mid-level developers throughout career, with 80% promotion rate to senior roles</li>
            <li>Established DevOps practices and CI/CD standards adopted company-wide, reducing deployment failures by 60%</li>
            <li>Drove technical hiring standards and interview processes, improving team quality and retention</li>
            <li>Championed automation-first culture with AI-powered tools, resulting in 70% reduction in manual processes</li>
            <li>Built cross-functional collaboration frameworks between development, operations, and business teams</li>
            <li>Pioneered AI agent development for enterprise automation, reducing operational overhead by 45%</li>
          </Box>
        </Box>

        <Divider sx={{ my: 1, '@media print': { borderColor: 'black', my: 0.3 } }} />

        {/* Professional Experience */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ 
            color: '#2563eb', 
            fontWeight: 600, 
            mb: 1,
            '@media print': {
              fontSize: '12px',
              color: 'black',
              textDecoration: 'underline',
              mb: 0.5,
            }
          }}>
            PROFESSIONAL EXPERIENCE
          </Typography>

          {/* ALSAC */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ 
              color: '#06b6d4', 
              fontWeight: 600, 
              mb: 0.5,
              '@media print': {
                fontSize: '10px',
                color: 'black',
                fontWeight: 'bold',
                mb: 0.2,
              }
            }}>
              Cloud Solutions Architect (Contract) | ALSAC/St. Jude Children's Hospital
            </Typography>
            <Typography variant="body2" sx={{ 
              color: '#666', 
              mb: 0.5, 
              fontStyle: 'italic',
              '@media print': {
                fontSize: '9px',
                color: 'black',
                mb: 0.2,
              }
            }}>
              May 2023 - Present | Remote
            </Typography>
            <Box component="ul" sx={{ 
              pl: 2, 
              mb: 0, 
              listStyleType: 'disc', 
              '& li': { 
                mb: 0.3, 
                lineHeight: 1.4, 
                display: 'list-item',
                '@media print': {
                  fontSize: '8px',
                  lineHeight: 1.2,
                  mb: 0.1,
                }
              } 
            }}>
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
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ 
              color: '#06b6d4', 
              fontWeight: 600, 
              mb: 0.5,
              '@media print': {
                fontSize: '10px',
                color: 'black',
                fontWeight: 'bold',
                mb: 0.2,
              }
            }}>
              Managing Principal Cloud Consultant | Blue Sky Cloud Consulting
            </Typography>
            <Typography variant="body2" sx={{ 
              color: '#666', 
              mb: 0.5, 
              fontStyle: 'italic',
              '@media print': {
                fontSize: '9px',
                color: 'black',
                mb: 0.2,
              }
            }}>
              Aug 2020 - Apr 2023 | Remote
            </Typography>
            <Box component="ul" sx={{ 
              pl: 2, 
              mb: 0, 
              listStyleType: 'disc', 
              '& li': { 
                mb: 0.3, 
                lineHeight: 1.4, 
                display: 'list-item',
                '@media print': {
                  fontSize: '8px',
                  lineHeight: 1.2,
                  mb: 0.1,
                }
              } 
            }}>
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

          {/* Cerity */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ 
              color: '#06b6d4', 
              fontWeight: 600, 
              mb: 0.5,
              '@media print': {
                fontSize: '10px',
                color: 'black',
                fontWeight: 'bold',
                mb: 0.2,
              }
            }}>
              Senior Software Engineer & Team Lead | Cerity
            </Typography>
            <Typography variant="body2" sx={{ 
              color: '#666', 
              mb: 0.5, 
              fontStyle: 'italic',
              '@media print': {
                fontSize: '9px',
                color: 'black',
                mb: 0.2,
              }
            }}>
              Aug 2018 - Aug 2020 | Austin, TX
            </Typography>
            <Box component="ul" sx={{ 
              pl: 2, 
              mb: 0, 
              listStyleType: 'disc', 
              '& li': { 
                mb: 0.3, 
                lineHeight: 1.4, 
                display: 'list-item',
                '@media print': {
                  fontSize: '8px',
                  lineHeight: 1.2,
                  mb: 0.1,
                }
              } 
            }}>
              <li>Guided full-stack team building insurance platform using Angular, React, Python, and AWS services</li>
              <li>Architected serverless applications with AWS Lambda, API Gateway, and DynamoDB supporting 50,000+ concurrent users</li>
              <li>Implemented modern development practices including automated testing, code reviews, and CI improving code quality and productivity</li>
              <li>Built responsive web applications using React and TypeScript for exceptional user experience</li>
              <li>Facilitated Agile ceremonies, maintaining team velocity and continuous improvement</li>
              <li>Optimized application performance through caching, database optimization, and CDN implementation, increasing user engagement by 200%</li>
            </Box>
          </Box>

          {/* ThunderDork */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ 
              color: '#06b6d4', 
              fontWeight: 600, 
              mb: 0.5,
              '@media print': {
                fontSize: '10px',
                color: 'black',
                fontWeight: 'bold',
                mb: 0.2,
              }
            }}>
              Lead Software Engineer | ThunderDork LLC
            </Typography>
            <Typography variant="body2" sx={{ 
              color: '#666', 
              mb: 0.5, 
              fontStyle: 'italic',
              '@media print': {
                fontSize: '9px',
                color: 'black',
                mb: 0.2,
              }
            }}>
              May 2015 - Aug 2018 | Austin, TX
            </Typography>
            <Box component="ul" sx={{ 
              pl: 2, 
              mb: 0, 
              listStyleType: 'disc', 
              '& li': { 
                mb: 0.3, 
                lineHeight: 1.4, 
                display: 'list-item',
                '@media print': {
                  fontSize: '8px',
                  lineHeight: 1.2,
                  mb: 0.1,
                }
              } 
            }}>
              <li>Led software development for enterprise clients including Capital One, managing onsite and remote teams</li>
              <li>Developed full-stack applications using JavaScript, Python, React, and Node.js for multiple industry verticals</li>
              <li>Architected microservices using Docker and AWS improving modularity and deployment flexibility</li>
              <li>Established testing frameworks and quality processes, reducing production defects by 40%</li>
              <li>Collaborated with clients and stakeholders, translating requirements into technical solutions</li>
            </Box>
          </Box>

          {/* Netspend */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ 
              color: '#06b6d4', 
              fontWeight: 600, 
              mb: 0.5,
              '@media print': {
                fontSize: '10px',
                color: 'black',
                fontWeight: 'bold',
                mb: 0.2,
              }
            }}>
              Senior Full-Stack Engineer | Netspend
            </Typography>
            <Typography variant="body2" sx={{ 
              color: '#666', 
              mb: 0.5, 
              fontStyle: 'italic',
              '@media print': {
                fontSize: '9px',
                color: 'black',
                mb: 0.2,
              }
            }}>
              Dec 2013 - May 2015 | Austin, TX
            </Typography>
            <Box component="ul" sx={{ 
              pl: 2, 
              mb: 0, 
              listStyleType: 'disc', 
              '& li': { 
                mb: 0.3, 
                lineHeight: 1.4, 
                display: 'list-item',
                '@media print': {
                  fontSize: '8px',
                  lineHeight: 1.2,
                  mb: 0.1,
                }
              } 
            }}>
              <li>Developed customer-facing applications for fintech platforms serving millions of users with high-performance and security requirements</li>
              <li>Built responsive web interfaces using Angular and JavaScript, improving user experience and conversion rates</li>
              <li>Implemented automated testing and deployment pipelines for financial services</li>
              <li>Collaborated with product and design teams to increase customer engagement</li>
            </Box>
          </Box>

          {/* Cinsay */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ 
              color: '#06b6d4', 
              fontWeight: 600, 
              mb: 0.5,
              '@media print': {
                fontSize: '10px',
                color: 'black',
                fontWeight: 'bold',
                mb: 0.2,
              }
            }}>
              Senior Full-Stack Engineer | Cinsay
            </Typography>
            <Typography variant="body2" sx={{ 
              color: '#666', 
              mb: 0.5, 
              fontStyle: 'italic',
              '@media print': {
                fontSize: '9px',
                color: 'black',
                mb: 0.2,
              }
            }}>
              Dec 2011 - Dec 2013 | Austin, TX
            </Typography>
            <Box component="ul" sx={{ 
              pl: 2, 
              mb: 0, 
              listStyleType: 'disc', 
              '& li': { 
                mb: 0.3, 
                lineHeight: 1.4, 
                display: 'list-item',
                '@media print': {
                  fontSize: '8px',
                  lineHeight: 1.2,
                  mb: 0.1,
                }
              } 
            }}>
              <li>Created cross-platform eCommerce applications using HTML5, JavaScript, Python, and cloud services</li>
              <li>Developed video-based shopping experiences with integrated payments and real-time features</li>
              <li>Led technical decision-making in a fast-paced startup environment, balancing innovation and delivery</li>
            </Box>
          </Box>

          {/* Schematic */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ 
              color: '#06b6d4', 
              fontWeight: 600, 
              mb: 0.5,
              '@media print': {
                fontSize: '10px',
                color: 'black',
                fontWeight: 'bold',
                mb: 0.2,
              }
            }}>
              Senior Full-Stack Engineer | Schematic
            </Typography>
            <Typography variant="body2" sx={{ 
              color: '#666', 
              mb: 0.5, 
              fontStyle: 'italic',
              '@media print': {
                fontSize: '9px',
                color: 'black',
                mb: 0.2,
              }
            }}>
              Aug 2008 - Dec 2011 | Austin, TX
            </Typography>
            <Box component="ul" sx={{ 
              pl: 2, 
              mb: 0, 
              listStyleType: 'disc', 
              '& li': { 
                mb: 0.3, 
                lineHeight: 1.4, 
                display: 'list-item',
                '@media print': {
                  fontSize: '8px',
                  lineHeight: 1.2,
                  mb: 0.1,
                }
              } 
            }}>
              <li>Designed and developed interactive web applications for Fortune 500 clients including Dell</li>
              <li>Built cross-platform solutions for desktop, mobile, and tablet with consistent user interfaces</li>
              <li>Collaborated with creative and marketing teams to drive customer engagement</li>
            </Box>
          </Box>

          {/* Imc2 */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ 
              color: '#06b6d4', 
              fontWeight: 600, 
              mb: 0.5,
              '@media print': {
                fontSize: '10px',
                color: 'black',
                fontWeight: 'bold',
                mb: 0.2,
              }
            }}>
              Full-Stack Engineer | Imc2
            </Typography>
            <Typography variant="body2" sx={{ 
              color: '#666', 
              mb: 0.5, 
              fontStyle: 'italic',
              '@media print': {
                fontSize: '9px',
                color: 'black',
                mb: 0.2,
              }
            }}>
              Jan 2006 - Aug 2008 | Dallas, TX
            </Typography>
            <Box component="ul" sx={{ 
              pl: 2, 
              mb: 0, 
              listStyleType: 'disc', 
              '& li': { 
                mb: 0.3, 
                lineHeight: 1.4, 
                display: 'list-item',
                '@media print': {
                  fontSize: '8px',
                  lineHeight: 1.2,
                  mb: 0.1,
                }
              } 
            }}>
              <li>Developed web applications for pharmaceutical, consumer products, and energy clients</li>
              <li>Created interactive user interfaces with animations and multimedia for marketing campaigns</li>
              <li>Managed technical project delivery, coordinating resources and client communication</li>
            </Box>
          </Box>

          {/* True.com */}
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ 
              color: '#06b6d4', 
              fontWeight: 600, 
              mb: 0.5,
              '@media print': {
                fontSize: '10px',
                color: 'black',
                fontWeight: 'bold',
                mb: 0.2,
              }
            }}>
              Frontend Engineer | True.com
            </Typography>
            <Typography variant="body2" sx={{ 
              color: '#666', 
              mb: 0.5, 
              fontStyle: 'italic',
              '@media print': {
                fontSize: '9px',
                color: 'black',
                mb: 0.2,
              }
            }}>
              Feb 2004 - Jan 2006 | Dallas, TX
            </Typography>
            <Box component="ul" sx={{ 
              pl: 2, 
              mb: 0, 
              listStyleType: 'disc', 
              '& li': { 
                mb: 0.3, 
                lineHeight: 1.4, 
                display: 'list-item',
                '@media print': {
                  fontSize: '8px',
                  lineHeight: 1.2,
                  mb: 0.1,
                }
              } 
            }}>
              <li>Built dating platform user interfaces for thousands of users with responsive web and real-time features</li>
              <li>Developed interactive matching systems with data visualization and engagement features</li>
              <li>Implemented real-time communication systems for scalability</li>
            </Box>
          </Box>

          {/* Idea Integration */}
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle1" sx={{ 
              color: '#06b6d4', 
              fontWeight: 600, 
              mb: 0.5,
              '@media print': {
                fontSize: '10px',
                color: 'black',
                fontWeight: 'bold',
                mb: 0.2,
              }
            }}>
              Frontend Developer | Idea Integration (MPS Group)
            </Typography>
            <Typography variant="body2" sx={{ 
              color: '#666', 
              mb: 0.5, 
              fontStyle: 'italic',
              '@media print': {
                fontSize: '9px',
                color: 'black',
                mb: 0.2,
              }
            }}>
              Jan 2001 - Feb 2004 | Dallas, TX
            </Typography>
            <Box component="ul" sx={{ 
              pl: 2, 
              mb: 0, 
              listStyleType: 'disc', 
              '& li': { 
                mb: 0.3, 
                lineHeight: 1.4, 
                display: 'list-item',
                '@media print': {
                  fontSize: '8px',
                  lineHeight: 1.2,
                  mb: 0.1,
                }
              } 
            }}>
              <li>Delivered web solutions for Fortune 1000 and government clients</li>
              <li>Created interactive web applications with modern web standards and accessibility</li>
              <li>Collaborated with design and backend teams for seamless integration</li>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 1, '@media print': { borderColor: 'black', my: 0.3 } }} />

        {/* Education & Key Achievements */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ 
              color: '#2563eb', 
              fontWeight: 600, 
              mb: 1,
              '@media print': {
                fontSize: '12px',
                color: 'black',
                textDecoration: 'underline',
                mb: 0.5,
              }
            }}>
              EDUCATION & CERTIFICATIONS
            </Typography>
            <Typography variant="body2" sx={{ 
              lineHeight: 1.4,
              '@media print': {
                fontSize: '8px',
                lineHeight: 1.3,
              }
            }}>
              <strong>Associate of Applied Arts, Computer Animation</strong><br />
              The Art Institute of Dallas<br/><br/>
              <strong>AWS Certified Developer - Associate</strong><br />
              <strong>Additional AWS Certifications</strong> (multiple cloud competencies)
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ 
              color: '#2563eb', 
              fontWeight: 600, 
              mb: 1,
              '@media print': {
                fontSize: '12px',
                color: 'black',
                textDecoration: 'underline',
                mb: 0.5,
              }
            }}>
              KEY ACHIEVEMENTS
            </Typography>
            <Box component="ul" sx={{ 
              pl: 2, 
              mb: 0, 
              listStyleType: 'disc', 
              '& li': { 
                mb: 0.3, 
                lineHeight: 1.4, 
                fontWeight: 600, 
                display: 'list-item',
                '@media print': {
                  fontSize: '8px',
                  lineHeight: 1.3,
                  mb: 0.1,
                }
              } 
            }}>
              <li>25+ years of progressive software engineering experience across healthcare, fintech, automotive, and government sectors</li>
              <li>Webby People's Choice Award Winner (2007) - recognized for excellence in digital innovation and healthcare awareness campaigns</li>
              <li>Led digital transformation initiatives for Fortune 500 clients resulting in 40%+ cost reductions and improved scalability</li>
              <li>Managed cross-functional teams of 8-15 engineers across multiple time zones and business units</li>
              <li>Architected enterprise solutions serving 50,000+ concurrent users with 99.9% uptime and sub-100ms response times</li>
              <li>Established DevOps practices reducing deployment cycles from weeks to hours while improving system reliability by 60%</li>
              <li>Built reusable platforms and frameworks adopted across multiple business units, accelerating development by 30%</li>
              <li>Mentored 20+ developers with 80% promotion rate to senior engineering roles</li>
            </Box>
          </Grid>
        </Grid>

        {/* Print Footer */}
        <Box sx={{ 
          display: 'none',
          '@media print': {
            display: 'block',
            textAlign: 'center',
            mt: 1,
            pt: 1,
            borderTop: '1px solid black',
          }
        }}>
          <Typography variant="caption" sx={{ '@media print': { fontSize: '8px' } }}>
            For the most current version and contact information, visit: cloudcodetree.com/resume
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}