output "api_gateway_url" {
  description = "URL of the API Gateway endpoint"
  value       = "${aws_api_gateway_stage.todos_stage.invoke_url}/todos"
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = "https://${aws_cloudfront_distribution.static_website.domain_name}"
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.todos.name
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.todos_api.function_name
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for static website"
  value       = aws_s3_bucket.static_website.id
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alarms"
  value       = var.alarm_email != "" ? aws_sns_topic.alarms[0].arn : "No SNS topic created (alarm_email not set)"
}

output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}
