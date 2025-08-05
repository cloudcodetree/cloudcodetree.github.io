import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Skeleton,
} from '@mui/material';
import {
  Search as SearchIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  tags: string[];
  readTime: number;
}

// Static blog posts - in a real app, these would be loaded from markdown files
const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Building Scalable Microservices with Kubernetes',
    excerpt: 'Learn how to design and deploy microservices architecture using Kubernetes, including best practices for service mesh, monitoring, and security.',
    content: `# Building Scalable Microservices with Kubernetes

Kubernetes has revolutionized how we deploy and manage containerized applications at scale. In this comprehensive guide, we'll explore best practices for building microservices architectures.

## Why Kubernetes for Microservices?

Kubernetes provides several key benefits for microservices:

- **Service Discovery**: Automatic service registration and discovery
- **Load Balancing**: Built-in load balancing across service instances  
- **Health Monitoring**: Automatic health checks and self-healing
- **Scaling**: Horizontal pod autoscaling based on metrics

## Architecture Patterns

### 1. Service Mesh Pattern

A service mesh provides communication infrastructure between services:

\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector:
    app: user-service
  ports:
  - port: 80
    targetPort: 8080
\`\`\`

### 2. Gateway Pattern

Use an API Gateway to handle external traffic:

- Rate limiting
- Authentication
- Request routing
- Protocol translation

## Best Practices

1. **Keep services small and focused**
2. **Use health checks effectively**
3. **Implement proper logging and monitoring**
4. **Plan for failure scenarios**

Building microservices with Kubernetes requires careful planning, but the benefits of scalability and maintainability make it worthwhile.`,
    author: 'Chris Harper',
    date: '2024-01-15',
    tags: ['Kubernetes', 'Microservices', 'DevOps', 'Cloud'],
    readTime: 8,
  },
  {
    id: '2',
    title: 'Modern React Patterns and Best Practices',
    excerpt: 'Explore the latest React patterns including hooks, context, and performance optimization techniques for building maintainable applications.',
    content: `# Modern React Patterns and Best Practices

React has evolved significantly over the years. Let's explore modern patterns that make your applications more maintainable and performant.

## Custom Hooks

Custom hooks let you extract component logic into reusable functions:

\`\`\`tsx
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue] as const;
}
\`\`\`

## Context for State Management

Use React Context for global state:

\`\`\`tsx
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
\`\`\`

## Performance Optimization

### React.memo for Component Memoization

\`\`\`tsx
const ExpensiveComponent = React.memo(({ data, onUpdate }) => {
  // Expensive computations here
  return <div>{/* render logic */}</div>;
});
\`\`\`

### useMemo and useCallback

\`\`\`tsx
function MyComponent({ items, filter }) {
  const filteredItems = useMemo(() => 
    items.filter(item => item.category === filter),
    [items, filter]
  );

  const handleClick = useCallback((id) => {
    // Handle click logic
  }, []);

  return (
    <div>
      {filteredItems.map(item => (
        <Item key={item.id} data={item} onClick={handleClick} />
      ))}
    </div>
  );
}
\`\`\`

These patterns help create more maintainable and performant React applications.`,
    author: 'Chris Harper',
    date: '2024-01-10',
    tags: ['React', 'TypeScript', 'JavaScript', 'Frontend'],
    readTime: 6,
  },
  {
    id: '3',
    title: 'AWS Security Best Practices for Developers',
    excerpt: 'Essential security practices every developer should follow when building applications on AWS, from IAM roles to data encryption.',
    content: `# AWS Security Best Practices for Developers

Building secure applications on AWS requires understanding and implementing multiple layers of security. Here are essential practices every developer should follow.

## Identity and Access Management (IAM)

### Principle of Least Privilege

Always grant the minimum permissions necessary:

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-bucket/user-data/*"
    }
  ]
}
\`\`\`

### Use IAM Roles, Not Access Keys

Instead of embedding access keys in your application:

\`\`\`typescript
// ❌ Don't do this
const s3 = new AWS.S3({
  accessKeyId: 'AKIAI...',
  secretAccessKey: '...'
});

// ✅ Use IAM roles instead
const s3 = new AWS.S3(); // Automatically uses IAM role
\`\`\`

## Data Encryption

### Encryption at Rest

Enable encryption for all data stores:

- **S3**: Server-side encryption with KMS
- **RDS**: Encrypted storage
- **EBS**: Encrypted volumes

### Encryption in Transit

Always use HTTPS/TLS:

\`\`\`typescript
const app = express();
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}));
\`\`\`

## Network Security

### VPC Configuration

- Use private subnets for application servers
- Implement proper security groups
- Use NACLs for additional layer

### Security Groups Rules

\`\`\`terraform
resource "aws_security_group" "web_sg" {
  name_prefix = "web-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
\`\`\`

## Monitoring and Logging

### Enable CloudTrail

Monitor all API calls:

\`\`\`terraform
resource "aws_cloudtrail" "main" {
  name           = "main-trail"
  s3_bucket_name = aws_s3_bucket.trail.bucket
  
  enable_log_file_validation = true
  include_global_service_events = true
  is_multi_region_trail = true
}
\`\`\`

### Application Monitoring

Use CloudWatch and AWS Config:

\`\`\`typescript
import AWS from 'aws-sdk';

const cloudwatch = new AWS.CloudWatch();

async function logMetric(metricName: string, value: number) {
  await cloudwatch.putMetricData({
    Namespace: 'MyApp/Security',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: 'Count'
    }]
  }).promise();
}
\`\`\`

Security is not a one-time implementation but an ongoing process that requires continuous monitoring and improvement.`,
    author: 'Chris Harper',
    date: '2024-01-05',
    tags: ['AWS', 'Security', 'DevSecOps', 'Cloud'],
    readTime: 10,
  },
];

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || post.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(blogPosts.flatMap(post => post.tags)));

  const handlePostClick = (post: BlogPost) => {
    setLoading(true);
    // Simulate loading time
    setTimeout(() => {
      setSelectedPost(post);
      setLoading(false);
    }, 500);
  };

  const handleBackToList = () => {
    setSelectedPost(null);
  };

  if (selectedPost) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button onClick={handleBackToList} sx={{ mb: 4 }}>
            ← Back to Blog
          </Button>
          
          <Typography variant="h2" component="h1" sx={{ mb: 2 }}>
            {selectedPost.title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, color: 'text.secondary' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <PersonIcon fontSize="small" />
              <Typography variant="body2">{selectedPost.author}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TimeIcon fontSize="small" />
              <Typography variant="body2">{selectedPost.readTime} min read</Typography>
            </Box>
            <Typography variant="body2">{selectedPost.date}</Typography>
          </Box>

          <Box sx={{ mb: 4 }}>
            {selectedPost.tags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{
                  mr: 1,
                  mb: 1,
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              />
            ))}
          </Box>

          <Card className="glass">
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ 
                '& h1': { fontSize: '2rem', fontWeight: 600, mb: 2 },
                '& h2': { fontSize: '1.5rem', fontWeight: 600, mb: 1.5 },
                '& h3': { fontSize: '1.25rem', fontWeight: 600, mb: 1 },
                '& p': { mb: 2, lineHeight: 1.8 },
                '& pre': { 
                  backgroundColor: 'rgba(30, 41, 59, 0.8)', 
                  borderRadius: 1, 
                  p: 2, 
                  overflow: 'auto',
                  mb: 2
                },
                '& code': { 
                  backgroundColor: 'rgba(30, 41, 59, 0.6)', 
                  px: 1, 
                  py: 0.5, 
                  borderRadius: 0.5,
                  fontFamily: 'monospace'
                },
                '& ul, & ol': { mb: 2, pl: 3 },
                '& li': { mb: 0.5 }
              }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedPost.content}
                </ReactMarkdown>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" component="h1" sx={{ mb: 2 }}>
            Blog
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4 }}>
            Thoughts on web development, cloud architecture, and technology
          </Typography>

          {/* Search and Filter */}
          <Box sx={{ maxWidth: 'md', mx: 'auto', mb: 4 }}>
            <TextField
              fullWidth
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              <Chip
                label="All"
                onClick={() => setSelectedTag(null)}
                color={selectedTag === null ? 'primary' : 'default'}
                sx={{ cursor: 'pointer' }}
              />
              {allTags.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  color={selectedTag === tag ? 'primary' : 'default'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Blog Posts Grid */}
        <Grid container spacing={4}>
          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <Card className="glass">
                    <CardContent>
                      <Skeleton variant="text" height={32} width="80%" />
                      <Skeleton variant="text" height={20} width="60%" sx={{ mb: 2 }} />
                      <Skeleton variant="text" height={16} />
                      <Skeleton variant="text" height={16} />
                      <Skeleton variant="text" height={16} />
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Skeleton variant="rectangular" height={24} width={60} />
                        <Skeleton variant="rectangular" height={24} width={80} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            : filteredPosts.map((post, index) => (
                <Grid item xs={12} md={6} lg={4} key={post.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Card
                      className="glass"
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          transition: 'transform 0.3s ease',
                        },
                      }}
                      onClick={() => handlePostClick(post)}
                    >
                      <CardContent sx={{ flexGrow: 1, p: 3 }}>
                        <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
                          {post.title}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, color: 'text.secondary' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TimeIcon fontSize="small" />
                            <Typography variant="caption">{post.readTime} min</Typography>
                          </Box>
                          <Typography variant="caption">{post.date}</Typography>
                        </Box>

                        <Typography
                          variant="body2"
                          sx={{ mb: 3, color: 'text.secondary', lineHeight: 1.8 }}
                        >
                          {post.excerpt}
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 'auto' }}>
                          {post.tags.slice(0, 3).map(tag => (
                            <Chip
                              key={tag}
                              label={tag}
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

        {filteredPosts.length === 0 && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              No articles found matching your search criteria.
            </Typography>
          </Box>
        )}
      </motion.div>
    </Container>
  );
}