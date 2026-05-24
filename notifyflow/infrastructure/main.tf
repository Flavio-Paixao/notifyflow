terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" { region = var.aws_region }

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  prefix     = "${var.project_name}-${var.environment}"
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
}

output "api_gateway_url" {
  value = "https://${aws_api_gateway_rest_api.notifyflow.id}.execute-api.${local.region}.amazonaws.com/${var.environment}"
}

output "sqs_queue_url" {
  value = aws_sqs_queue.notifications.url
}
