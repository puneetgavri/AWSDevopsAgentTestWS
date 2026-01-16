# SNS Topic for Alarms
resource "aws_sns_topic" "alarms" {
  count = var.alarm_email != "" ? 1 : 0
  name  = "${var.project_name}-alarms"

  tags = {
    Name        = "CloudWatch Alarms Topic"
    Environment = var.environment
  }
}

# SNS Topic Subscription
resource "aws_sns_topic_subscription" "alarm_email" {
  count     = var.alarm_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alarms[0].arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# CloudWatch Alarm - Lambda Errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors Lambda function errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.todos_api.function_name
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name        = "Lambda Errors Alarm"
    Environment = var.environment
  }
}

# CloudWatch Alarm - API Gateway 5XX Errors
resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  alarm_name          = "${var.project_name}-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors API Gateway 5XX errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.todos_api.name
    Stage   = var.api_stage_name
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name        = "API 5XX Errors Alarm"
    Environment = var.environment
  }
}

# CloudWatch Alarm - API Gateway High Latency
resource "aws_cloudwatch_metric_alarm" "api_high_latency" {
  alarm_name          = "${var.project_name}-api-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000"
  alarm_description   = "This metric monitors API Gateway latency (threshold: 1000ms)"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.todos_api.name
    Stage   = var.api_stage_name
  }

  alarm_actions = var.alarm_email != "" ? [aws_sns_topic.alarms[0].arn] : []

  tags = {
    Name        = "API High Latency Alarm"
    Environment = var.environment
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Invocations" }],
            [".", "Errors", { stat = "Sum", label = "Errors" }],
            [".", "Duration", { stat = "Average", label = "Avg Duration" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Lambda Function Metrics"
          period  = 300
          dimensions = {
            FunctionName = [aws_lambda_function.todos_api.function_name]
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", { stat = "Sum", label = "Request Count" }],
            [".", "4XXError", { stat = "Sum", label = "4XX Errors" }],
            [".", "5XXError", { stat = "Sum", label = "5XX Errors" }],
            [".", "Latency", { stat = "Average", label = "Avg Latency" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "API Gateway Metrics"
          period  = 300
          dimensions = {
            ApiName = [aws_api_gateway_rest_api.todos_api.name]
            Stage   = [var.api_stage_name]
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", { stat = "Sum", label = "Read Capacity" }],
            [".", "ConsumedWriteCapacityUnits", { stat = "Sum", label = "Write Capacity" }],
            [".", "UserErrors", { stat = "Sum", label = "User Errors" }],
            [".", "SystemErrors", { stat = "Sum", label = "System Errors" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "DynamoDB Metrics"
          period  = 300
          dimensions = {
            TableName = [aws_dynamodb_table.todos.name]
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/CloudFront", "Requests", { stat = "Sum", label = "Requests" }],
            [".", "BytesDownloaded", { stat = "Sum", label = "Bytes Downloaded" }],
            [".", "4xxErrorRate", { stat = "Average", label = "4XX Error Rate" }],
            [".", "5xxErrorRate", { stat = "Average", label = "5XX Error Rate" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "CloudFront Metrics"
          period  = 300
          dimensions = {
            DistributionId = [aws_cloudfront_distribution.static_website.id]
          }
        }
      },
      {
        type = "log"
        properties = {
          query   = "SOURCE '${aws_cloudwatch_log_group.lambda_logs.name}'\n| fields @timestamp, @message\n| filter @message like /ERROR/\n| sort @timestamp desc\n| limit 20"
          region  = var.aws_region
          title   = "Recent Lambda Errors"
          stacked = false
        }
      }
    ]
  })
}
