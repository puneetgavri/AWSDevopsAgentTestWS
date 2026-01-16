# AWS Serverless CRUD Application

A complete serverless todo application built with AWS Lambda, DynamoDB, API Gateway, S3, and CloudFront, deployed using Terraform with GitHub Actions CI/CD.

[![Deploy Serverless CRUD App](https://github.com/your-username/your-repo/actions/workflows/deploy.yml/badge.svg)](https://github.com/your-username/your-repo/actions/workflows/deploy.yml)
[![Terraform Validation](https://github.com/your-username/your-repo/actions/workflows/terraform-check.yml/badge.svg)](https://github.com/your-username/your-repo/actions/workflows/terraform-check.yml)

## 🚀 Quick Start

**New to this project?** Check out [QUICKSTART.md](QUICKSTART.md) for a 5-minute deployment guide!

**Monitoring & Alerts:** See [MONITORING.md](MONITORING.md) for CloudWatch alarms and dashboard setup.

## Architecture

- **Lambda Function**: Python 3.12 runtime handling CRUD operations
- **DynamoDB**: NoSQL database storing todo items
- **API Gateway**: REST API with proxy integration
- **S3**: Static website hosting
- **CloudFront**: CDN with Origin Access Control (OAC)
- **Terraform Backend**: S3 + DynamoDB for state management

## Project Structure

```
AWSDevopsAgentTestWS/
├── .github/
│   ├── workflows/
│   │   ├── deploy.yml           # Main deployment workflow
│   │   └── terraform-check.yml  # Validation workflow
│   ├── CODEOWNERS              # Code ownership
│   └── dependabot.yml          # Dependency updates
├── iac/
│   ├── main.tf                 # Main infrastructure resources
│   ├── monitoring.tf           # CloudWatch alarms & dashboard
│   ├── variables.tf            # Input variables
│   ├── outputs.tf              # Output values
│   ├── backend.tf              # Terraform backend configuration
│   └── terraform.tfvars.example # Example configuration
├── lambda/
│   └── src/
│       ├── handler.py          # Lambda function code
│       └── requirements.txt
├── static-ui/
│   ├── index.html              # Frontend HTML
│   ├── style.css               # Styling
│   └── script.js               # Frontend JavaScript
├── .gitignore
├── QUICKSTART.md               # 5-minute deployment guide
├── DEPLOYMENT.md               # Detailed CI/CD setup
├── MONITORING.md               # CloudWatch alarms guide
├── test-alarms.sh              # Script to test alarms
└── README.md                   # Complete documentation
```

## CI/CD Pipeline

This project includes GitHub Actions workflows for automated deployment. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed setup instructions.

**Quick Setup:**
1. Add AWS credentials to GitHub Secrets
2. (Optional) Set `alarm_email` in `iac/terraform.tfvars`
3. Push to `main` branch
4. Automatic deployment with CloudFront invalidation

## Monitoring

Simple CloudWatch monitoring with 3 essential alarms:
- **Lambda Errors** - Application failures (> 1 error/min)
- **API Gateway 5XX** - Backend failures (> 2 errors/min)  
- **API Gateway High Latency** - Performance issues (> 2 seconds)

**Quick Test:**
```bash
./test-alarms.sh
```

See [MONITORING.md](MONITORING.md) for setup and testing guide.

## Testing the API

### Create a Todo
```bash
curl -X POST https://YOUR_API_URL/todos \
  -H "Content-Type: application/json" \
  -d '{"task": "Learn Terraform"}'
```

### Get All Todos
```bash
curl https://YOUR_API_URL/todos
```

### Get Single Todo
```bash
curl https://YOUR_API_URL/todos/{id}
```

### Update Todo
```bash
curl -X PUT https://YOUR_API_URL/todos/{id} \
  -H "Content-Type: application/json" \
  -d '{"task": "Master Terraform", "completed": true}'
```

### Delete Todo
```bash
curl -X DELETE https://YOUR_API_URL/todos/{id}
```

## Deployment Options

### Option 1: GitHub Actions (Recommended)

#### Initial Setup

1. **Fork/Clone this repository**

2. **Configure GitHub Secrets**
   
   Go to Settings → Secrets and variables → Actions, add:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

3. **Setup AWS Backend** (one-time):
   ```bash
   # Create S3 bucket for Terraform state
   aws s3api create-bucket \
     --bucket my-terraform-state-bucket \
     --region us-east-1

   # Enable versioning
   aws s3api put-bucket-versioning \
     --bucket my-terraform-state-bucket \
     --versioning-configuration Status=Enabled

   # Create DynamoDB table for state locking
   aws dynamodb create-table \
     --table-name terraform-state-lock \
     --attribute-definitions AttributeName=LockID,AttributeType=S \
     --key-schema AttributeName=LockID,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST \
     --region us-east-1
   ```

4. **Deploy**
   
   Push to main branch or manually trigger workflow:
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

   Or use GitHub UI: Actions → Deploy Serverless CRUD App → Run workflow

#### Workflow Features

- **Automatic Deployment**: Pushes to `main` branch trigger deployment
- **PR Validation**: Pull requests show Terraform plan in comments
- **Manual Destroy**: Workflow dispatch with approval for cleanup
- **CloudFront Invalidation**: Automatic cache clearing
- **Deployment Summary**: View outputs in GitHub Actions summary

### Option 2: Manual Deployment

#### Step 1: Initialize Terraform

```bash
cd iac
terraform init
```

#### Step 2: Review the Plan

```bash
terraform plan
```

#### Step 3: Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted. Deployment takes 5-10 minutes.

#### Step 4: Update Frontend with API URL

```bash
# Get API URL
API_URL=$(terraform output -raw api_gateway_url)

# Update script.js
sed -i "s|const API_URL = '.*';|const API_URL = '$API_URL';|g" ../static-ui/script.js

# Upload to S3
BUCKET=$(terraform output -raw s3_bucket_name)
aws s3 cp ../static-ui/script.js s3://$BUCKET/script.js

# Invalidate CloudFront
DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[?DomainName=='$BUCKET.s3.us-east-1.amazonaws.com']].Id" --output text)
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

#### Step 5: Access Your Application

```bash
terraform output cloudfront_domain
```

## Monitoring & Observability

Simple CloudWatch monitoring with 3 essential alarms:
- **Lambda Errors** - Application failures (> 1 error/min)
- **API Gateway 5XX** - Backend failures (> 2 errors/min)
- **API Gateway High Latency** - Performance issues (> 2 seconds)

See [MONITORING.md](MONITORING.md) for setup and testing guide.

## Cleanup

### Option 1: GitHub Actions

1. Go to Actions → Deploy Serverless CRUD App
2. Click "Run workflow"
3. Select "terraform-destroy" job (requires approval)
4. Confirm destruction

### Option 2: Manual

```bash
cd iac

# Empty S3 bucket first
aws s3 rm s3://$(terraform output -raw s3_bucket_name) --recursive

# Destroy all resources
terraform destroy
```

Type `yes` when prompted.

## Customization

### Change AWS Region

Edit `iac/variables.tf`:
```hcl
variable "aws_region" {
  default = "us-west-2"  # Change to your preferred region
}
```

### Change Project Name

Edit `iac/variables.tf`:
```hcl
variable "project_name" {
  default = "my-app"
}
```

### Modify DynamoDB Table

Edit `iac/main.tf` to add attributes or change billing mode:
```hcl
resource "aws_dynamodb_table" "todos" {
  billing_mode = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  # ...
}
```

## Cost Estimation

With AWS Free Tier:
- **Lambda**: 1M requests/month free
- **DynamoDB**: 25GB storage, 25 RCU/WCU free
- **API Gateway**: 1M requests/month free (12 months)
- **S3**: 5GB storage, 20K GET requests free
- **CloudFront**: 1TB transfer, 10M requests free (12 months)
- **CloudWatch**: 3 alarms = $0.30/month

Estimated cost after free tier: $1-5/month for light usage

## Next Steps

- ✅ CI/CD with GitHub Actions
- ✅ CloudWatch monitoring with 3 essential alarms
- ✅ CloudWatch dashboard with key metrics
- Add authentication with AWS Cognito
- Implement input validation
- Add pagination for large todo lists
- Add custom domain with Route53
- Implement caching strategies
- Add monitoring and alerting
- Multi-environment setup (dev/staging/prod)

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request (Terraform plan will be commented automatically)

## License

MIT License - Feel free to use for learning and production!
