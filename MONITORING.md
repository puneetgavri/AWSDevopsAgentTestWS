# Monitoring Guide

## Overview

This application includes 3 essential CloudWatch alarms that monitor critical issues:

1. **Lambda Errors** - Application failures
2. **API Gateway 5XX Errors** - Backend failures  
3. **API Gateway High Latency** - Performance issues

## 📧 Setup Email Alerts

1. Create `iac/terraform.tfvars`:
```hcl
alarm_email = "your-email@example.com"
```

2. Deploy:
```bash
cd iac
terraform apply
```

3. **Confirm subscription** - Check your email and click the confirmation link

## 🚨 Alarms

### 1. Lambda Errors
- **Threshold**: > 1 error in 1 minute
- **Why**: Indicates application bugs or integration failures
- **Severity**: Critical

### 2. API Gateway 5XX Errors
- **Threshold**: > 2 errors in 1 minute
- **Why**: Backend failures affecting users
- **Severity**: Critical

### 3. API Gateway High Latency
- **Threshold**: > 2 seconds average
- **Why**: Poor user experience
- **Severity**: Warning

## 🧪 Testing Alarms

### Test 1: Trigger Lambda Error Alarm

Break the DynamoDB table name:

```bash
cd iac

# Update Lambda environment variable with wrong table name
aws lambda update-function-configuration \
  --function-name serverless-todos-api \
  --environment "Variables={DYNAMODB_TABLE=wrong-table-name}"

# Make API calls to trigger errors
curl https://YOUR_API_URL/todos
curl https://YOUR_API_URL/todos
curl https://YOUR_API_URL/todos

# Wait 1-2 minutes for alarm to trigger
# Check email for notification

# Fix it
aws lambda update-function-configuration \
  --function-name serverless-todos-api \
  --environment "Variables={DYNAMODB_TABLE=todos}"
```

### Test 2: Trigger 5XX Error Alarm

Same as Test 1 - Lambda errors cause API Gateway 5XX errors.

### Test 3: Trigger High Latency Alarm

Add a delay in Lambda function:

Edit `lambda/src/handler.py`:
```python
import time

def lambda_handler(event, context):
    time.sleep(3)  # Add 3 second delay
    # ... rest of code
```

Deploy:
```bash
cd iac
terraform apply

# Make several API calls
for i in {1..5}; do
  curl https://YOUR_API_URL/todos
done

# Wait 1-2 minutes for alarm
# Remove the sleep() and redeploy to fix
```

## 📊 CloudWatch Dashboard

View metrics:
```bash
cd iac
terraform output cloudwatch_dashboard_url
```

Dashboard shows:
- Lambda invocations, errors, duration
- API Gateway requests, errors
- API Gateway latency
- Recent error logs

## 🔍 Troubleshooting

### Check Lambda Logs
```bash
aws logs tail /aws/lambda/serverless-todos-api --follow
```

### Check Alarm Status
```bash
aws cloudwatch describe-alarms \
  --alarm-names serverless-todos-lambda-errors \
               serverless-todos-api-5xx-errors \
               serverless-todos-api-high-latency
```

### View Alarm History
```bash
aws cloudwatch describe-alarm-history \
  --alarm-name serverless-todos-lambda-errors \
  --max-records 10
```

## 📈 What to Monitor

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Lambda Errors | 0 | 1-5 | > 5 |
| API 5XX Errors | 0 | 1-2 | > 2 |
| API Latency | < 500ms | 500ms-2s | > 2s |

## 🔔 Notification Format

Email notifications include:
- Alarm name and description
- Current metric value
- Threshold that was breached
- Link to CloudWatch console
- Timestamp

## 💰 Cost

- 3 CloudWatch Alarms: $0.30/month
- Dashboard: Free
- SNS emails: Free (first 1,000)

**Total: ~$0.30/month**

## 🎯 Best Practices

1. **Respond quickly** to critical alarms (Lambda errors, 5XX errors)
2. **Investigate** warning alarms (high latency) during business hours
3. **Review dashboard** weekly to spot trends
4. **Tune thresholds** based on your traffic patterns
5. **Test alarms** after deployment to ensure they work

## 📚 Additional Resources

- [AWS CloudWatch Alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html)
- [Lambda Monitoring](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-metrics.html)
- [API Gateway Monitoring](https://docs.aws.amazon.com/apigateway/latest/developerguide/monitoring-cloudwatch.html)
