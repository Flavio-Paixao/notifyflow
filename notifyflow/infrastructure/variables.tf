variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "notifyflow"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "from_email" {
  type    = string
  default = "flaviopaixao1992@gmail.com"
}
