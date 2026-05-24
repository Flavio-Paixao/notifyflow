resource "aws_lambda_function" "send_notification" {
  function_name    = "${local.prefix}-send-notification"
  role             = aws_iam_role.lambda_role.arn
  handler          = "handler.handler"
  runtime          = "nodejs20.x"
  timeout          = 30
  memory_size      = 256
  filename         = "../functions/send-notification/dist/handler.zip"
  source_code_hash = filebase64sha256("../functions/send-notification/dist/handler.zip")
  environment {
    variables = { QUEUE_URL = aws_sqs_queue.notifications.url }
  }
  depends_on = [aws_iam_role_policy.lambda_policy]
  tags = { Name = "${local.prefix}-send-notification", Environment = var.environment }
}

resource "aws_lambda_function" "process_queue" {
  function_name    = "${local.prefix}-process-queue"
  role             = aws_iam_role.lambda_role.arn
  handler          = "handler.handler"
  runtime          = "nodejs20.x"
  timeout          = 60
  memory_size      = 256
  filename         = "../functions/process-queue/dist/handler.zip"
  source_code_hash = filebase64sha256("../functions/process-queue/dist/handler.zip")
  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.notifications.name
      FROM_EMAIL     = var.from_email
    }
  }
  depends_on = [aws_iam_role_policy.lambda_policy]
  tags = { Name = "${local.prefix}-process-queue", Environment = var.environment }
}

resource "aws_lambda_event_source_mapping" "sqs_trigger" {
  event_source_arn = aws_sqs_queue.notifications.arn
  function_name    = aws_lambda_function.process_queue.arn
  batch_size       = 5
  enabled          = true
}

resource "aws_cloudwatch_log_group" "send_notification" {
  name              = "/aws/lambda/${aws_lambda_function.send_notification.function_name}"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "process_queue" {
  name              = "/aws/lambda/${aws_lambda_function.process_queue.function_name}"
  retention_in_days = 14
}
