resource "aws_sqs_queue" "notifications_dlq" {
  name       = "${local.prefix}-notifications-dlq.fifo"
  fifo_queue = true
  tags = { Name = "${local.prefix}-notifications-dlq", Environment = var.environment }
}

resource "aws_sqs_queue" "notifications" {
  name                        = "${local.prefix}-notifications.fifo"
  fifo_queue                  = true
  content_based_deduplication = false
  visibility_timeout_seconds  = 60
  message_retention_seconds   = 86400
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.notifications_dlq.arn
    maxReceiveCount     = 3
  })
  tags = { Name = "${local.prefix}-notifications", Environment = var.environment }
}

resource "aws_dynamodb_table" "notifications" {
  name         = "${local.prefix}-notifications"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "notificationId"

  attribute {
    name = "notificationId"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  global_secondary_index {
    name            = "status-index"
    hash_key        = "status"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = { Name = "${local.prefix}-notifications", Environment = var.environment }
}
