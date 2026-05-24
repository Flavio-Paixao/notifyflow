resource "aws_api_gateway_rest_api" "notifyflow" {
  name        = "${local.prefix}-api"
  description = "NotifyFlow Notification API"
  endpoint_configuration { types = ["REGIONAL"] }
}

resource "aws_api_gateway_resource" "notifications" {
  rest_api_id = aws_api_gateway_rest_api.notifyflow.id
  parent_id   = aws_api_gateway_rest_api.notifyflow.root_resource_id
  path_part   = "notifications"
}

resource "aws_api_gateway_method" "post_notification" {
  rest_api_id   = aws_api_gateway_rest_api.notifyflow.id
  resource_id   = aws_api_gateway_resource.notifications.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "post_notification" {
  rest_api_id             = aws_api_gateway_rest_api.notifyflow.id
  resource_id             = aws_api_gateway_resource.notifications.id
  http_method             = aws_api_gateway_method.post_notification.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.send_notification.invoke_arn
}

resource "aws_api_gateway_method" "options_notifications" {
  rest_api_id   = aws_api_gateway_rest_api.notifyflow.id
  resource_id   = aws_api_gateway_resource.notifications.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options_notifications" {
  rest_api_id       = aws_api_gateway_rest_api.notifyflow.id
  resource_id       = aws_api_gateway_resource.notifications.id
  http_method       = aws_api_gateway_method.options_notifications.http_method
  type              = "MOCK"
  request_templates = { "application/json" = "{\"statusCode\": 200}" }
}

resource "aws_api_gateway_method_response" "options_notifications" {
  rest_api_id = aws_api_gateway_rest_api.notifyflow.id
  resource_id = aws_api_gateway_resource.notifications.id
  http_method = aws_api_gateway_method.options_notifications.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "options_notifications" {
  rest_api_id = aws_api_gateway_rest_api.notifyflow.id
  resource_id = aws_api_gateway_resource.notifications.id
  http_method = aws_api_gateway_method.options_notifications.http_method
  status_code = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
  depends_on = [aws_api_gateway_integration.options_notifications]
}

resource "aws_api_gateway_deployment" "notifyflow" {
  rest_api_id = aws_api_gateway_rest_api.notifyflow.id
  depends_on  = [
    aws_api_gateway_integration.post_notification,
    aws_api_gateway_integration.options_notifications,
  ]
  lifecycle { create_before_destroy = true }
}

resource "aws_api_gateway_stage" "notifyflow" {
  deployment_id = aws_api_gateway_deployment.notifyflow.id
  rest_api_id   = aws_api_gateway_rest_api.notifyflow.id
  stage_name    = var.environment
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.send_notification.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.notifyflow.execution_arn}/*/*"
}
