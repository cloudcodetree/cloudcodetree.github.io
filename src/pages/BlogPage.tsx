import { useState, useEffect } from 'react';
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

// Dynamic blog posts loaded from external markdown files

export default function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Load blog posts from external markdown files
  useEffect(() => {
    const loadBlogPosts = async () => {
      try {
        setLoading(true);
        
        // Load posts index
        const postsResponse = await fetch('/blog/posts.json');
        if (!postsResponse.ok) {
          throw new Error('Failed to load posts index');
        }
        const postsIndex = await postsResponse.json();
        
        // Load markdown content for each post
        const postsWithContent = await Promise.all(
          postsIndex.map(async (post: any) => {
            try {
              const contentResponse = await fetch(`/blog/${post.filename}`);
              if (!contentResponse.ok) {
                throw new Error(`Failed to load ${post.filename}`);
              }
              const content = await contentResponse.text();
              return { ...post, content };
            } catch (error) {
              console.error(`Error loading ${post.filename}:`, error);
              return { ...post, content: 'Error loading post content.' };
            }
          })
        );
        
        setBlogPosts(postsWithContent);
      } catch (error) {
        console.error('Failed to load blog posts:', error);
        setBlogPosts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadBlogPosts();
  }, []);

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || post.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(blogPosts.flatMap(post => post.tags)));

  const handlePostClick = (post: BlogPost) => {
    setSelectedPost(post);
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