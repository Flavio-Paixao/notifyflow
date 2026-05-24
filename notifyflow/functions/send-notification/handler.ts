import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { randomUUID } from "crypto";

const sqs = new SQSClient({ region: process.env.AWS_REGION ?? "us-east-1" });
const QUEUE_URL = process.env.QUEUE_URL ?? "";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

function res(statusCode: number, body: unknown): APIGatewayProxyResult {
  return { statusCode, headers, body: JSON.stringify(body) };
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === "OPTIONS") return res(200, {});
  try {
    if (!event.body) return res(400, { error: "Request body is required." });
    const payload = JSON.parse(event.body);
    if (!payload.type || !payload.recipient || !payload.message) {
      return res(400, { error: "Fields type, recipient and message are required." });
    }
    if (!["email", "sms", "push"].includes(payload.type)) {
      return res(400, { error: "type must be email, sms or push." });
    }
    const notificationId = randomUUID();
    const notification = {
      notificationId,
      ...payload,
      priority: payload.priority ?? "normal",
      createdAt: new Date().toISOString(),
      status: "queued",
    };
    await sqs.send(new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(notification),
      MessageGroupId: payload.type,
      MessageDeduplicationId: notificationId,
    }));
    console.log(`✅ Notification queued: ${notificationId}`);
    return res(202, { message: "Notification queued successfully.", notificationId, status: "queued" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error:", message);
    return res(500, { error: "Internal server error.", detail: message });
  }
};
