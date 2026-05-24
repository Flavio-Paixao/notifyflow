import { SQSEvent, SQSHandler } from "aws-lambda";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const ses = new SESClient({ region: process.env.AWS_REGION ?? "us-east-1" });
const sns = new SNSClient({ region: process.env.AWS_REGION ?? "us-east-1" });
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION ?? "us-east-1" }));
const TABLE_NAME = process.env.DYNAMODB_TABLE ?? "notifyflow-notifications";
const FROM_EMAIL = process.env.FROM_EMAIL ?? "noreply@example.com";

export const handler: SQSHandler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    const notification = JSON.parse(record.body);
    console.log(`Processing: ${notification.notificationId} (${notification.type})`);
    await ddb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: { ...notification, status: "processing", processedAt: new Date().toISOString() },
    }));
    try {
      let providerResponse: string;
      if (notification.type === "email") {
        const r = await ses.send(new SendEmailCommand({
          Source: FROM_EMAIL,
          Destination: { ToAddresses: [notification.recipient] },
          Message: {
            Subject: { Data: notification.subject ?? "Notification from NotifyFlow" },
            Body: { Text: { Data: notification.message } },
          },
        }));
        providerResponse = r.MessageId ?? "sent";
      } else {
        const r = await sns.send(new PublishCommand({
          PhoneNumber: notification.type === "sms" ? notification.recipient : undefined,
          TopicArn: notification.type === "push" ? notification.recipient : undefined,
          Message: notification.message,
        }));
        providerResponse = r.MessageId ?? "sent";
      }
      await ddb.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { notificationId: notification.notificationId },
        UpdateExpression: "SET #s = :s, sentAt = :t, providerResponse = :r",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":s": "sent", ":t": new Date().toISOString(), ":r": providerResponse },
      }));
      console.log(`✅ Sent: ${notification.notificationId}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed:`, msg);
      await ddb.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { notificationId: notification.notificationId },
        UpdateExpression: "SET #s = :s, errorMessage = :e",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":s": "failed", ":e": msg },
      }));
    }
  }
};
