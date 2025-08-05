# AWS Security Best Practices for Developers

Building secure applications on AWS requires understanding and implementing multiple layers of security. Here are essential practices every developer should follow.

## Identity and Access Management (IAM)

### Principle of Least Privilege

Always grant the minimum permissions necessary:

```json
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
```

### Use IAM Roles, Not Access Keys

Instead of embedding access keys in your application:

```typescript
// ❌ Don't do this
const s3 = new AWS.S3({
  accessKeyId: 'AKIAI...',
  secretAccessKey: '...'
});

// ✅ Use IAM roles instead
const s3 = new AWS.S3(); // Automatically uses IAM role
```

## Data Encryption

### Encryption at Rest

Enable encryption for all data stores:

- **S3**: Server-side encryption with KMS
- **RDS**: Encrypted storage
- **EBS**: Encrypted volumes

### Encryption in Transit

Always use HTTPS/TLS:

```typescript
const app = express();
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}));
```

## Network Security

### VPC Configuration

- Use private subnets for application servers
- Implement proper security groups
- Use NACLs for additional layer

### Security Groups Rules

```terraform
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
```

## Monitoring and Logging

### Enable CloudTrail

Monitor all API calls:

```terraform
resource "aws_cloudtrail" "main" {
  name           = "main-trail"
  s3_bucket_name = aws_s3_bucket.trail.bucket
  
  enable_log_file_validation = true
  include_global_service_events = true
  is_multi_region_trail = true
}
```

### Application Monitoring

Use CloudWatch and AWS Config:

```typescript
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
```

Security is not a one-time implementation but an ongoing process that requires continuous monitoring and improvement.