# NotifyFlow — Multi-Channel Notification System

Sistema serverless de notificações multi-canal usando AWS SQS, SES e SNS.

## Arquitetura
## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + TypeScript + Framer Motion |
| API | AWS API Gateway + Lambda |
| Fila | AWS SQS FIFO |
| Email | AWS SES |
| SMS/Push | AWS SNS |
| Banco | Amazon DynamoDB |
| IaC | Terraform |

## Deploy

```bash
# 1. Verificar email no SES (obrigatório)
aws ses verify-email-identity --email-address flaviopaixao1992@gmail.com --region us-east-1

# 2. Build e zip das Lambdas
cd functions/send-notification && npm install && npm run build
cd ../process-queue && npm install && npm run build
cd functions/send-notification/dist && zip handler.zip handler.js
cd ../../process-queue/dist && zip handler.zip handler.js

# 3. Deploy infraestrutura
cd infrastructure && terraform init && terraform apply

# 4. Frontend
cd frontend && cp .env.example .env && npm install && npm run dev
```

## Autor

Flávio da Paixão Nunes — github.com/Flavio-Paixao
