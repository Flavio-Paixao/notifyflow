# NotifyFlow

> Sistema serverless de notificações multi-canal com arquitetura event-driven na AWS.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![AWS Lambda](https://img.shields.io/badge/Lambda-FF9900?style=flat&logo=awslambda&logoColor=white)
![AWS SQS](https://img.shields.io/badge/SQS-FF4F8B?style=flat&logo=amazonsqs&logoColor=white)
![AWS SES](https://img.shields.io/badge/SES-FF9900?style=flat&logo=amazonaws&logoColor=white)
![AWS SNS](https://img.shields.io/badge/SNS-FF9900?style=flat&logo=amazonaws&logoColor=white)
![DynamoDB](https://img.shields.io/badge/DynamoDB-4053D6?style=flat&logo=amazondynamodb&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=flat&logo=terraform&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)

---

## Sobre o Projeto

O NotifyFlow resolve um problema comum em sistemas modernos: como enviar notificações de forma confiável, sem perder mensagens e sem sobrecarregar os serviços de entrega?

A solução usa uma **fila SQS FIFO** como buffer entre a API e os provedores de entrega. Isso garante ordem de processamento, retry automático em caso de falha e isolamento entre produtores e consumidores.

---

## Arquitetura

```
Cliente / Frontend (React)
          ↓
    API Gateway (REST)
          ↓
 Lambda: send-notification
          ↓
    SQS FIFO Queue ──── Dead Letter Queue (falhas)
          ↓
  Lambda: process-queue
          ↓
   ┌──────┴──────┐
  SES           SNS
(Email)    (SMS / Push)
          ↓
      DynamoDB
  (rastreamento de status)
```

---

## Funcionalidades

- ✉ **Email** — envio via AWS SES com assunto e corpo personalizados
- 📱 **SMS** — envio via AWS SNS para qualquer número com DDI
- 🔔 **Push Notification** — publicação em tópico SNS para múltiplos assinantes
- 📊 **Rastreamento de status** — cada notificação tem status em tempo real: `queued → processing → sent / failed`
- 🔄 **Retry automático** — SQS reprocessa mensagens que falharam até 3 vezes
- 💀 **Dead Letter Queue** — mensagens que excedem o limite de retry são preservadas para análise
- 📋 **Histórico no frontend** — dashboard React com histórico de notificações enviadas

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend** | React + TypeScript + Framer Motion |
| **API** | AWS API Gateway (REST) |
| **Computação** | AWS Lambda (Node.js 20) |
| **Fila** | AWS SQS FIFO + Dead Letter Queue |
| **Email** | AWS SES |
| **SMS / Push** | AWS SNS |
| **Banco de dados** | Amazon DynamoDB |
| **IaC** | Terraform |
| **Linguagem** | TypeScript |

---

## Estrutura do Projeto

```
notifyflow/
├── functions/
│   ├── send-notification/     # Lambda — recebe via API e enfileira no SQS
│   │   ├── handler.ts
│   │   └── package.json
│   └── process-queue/         # Lambda — consome SQS e envia por SES/SNS
│       ├── handler.ts
│       └── package.json
├── infrastructure/            # Terraform
│   ├── main.tf
│   ├── variables.tf
│   ├── sqs_dynamodb.tf
│   ├── lambda.tf
│   ├── api_gateway.tf
│   └── iam.tf
├── frontend/                  # React + TypeScript
│   └── src/
│       ├── App.tsx
│       └── main.tsx
└── README.md
```

---

## Como Executar

### Pré-requisitos

- Node.js 20+
- Terraform 1.5+
- AWS CLI configurado (`aws configure`)

### 1. Verificar email no SES (obrigatório)

O SES em sandbox exige verificação prévia do email remetente:

```bash
aws ses verify-email-identity \
  --email-address flaviopaixao1992@gmail.com \
  --region us-east-1
```

Confirme o link que chegará no email antes de continuar.

### 2. Instalar dependências e fazer build

```bash
# send-notification
cd functions/send-notification
npm install && npm run build

# process-queue
cd ../process-queue
npm install && npm run build
```

### 3. Zipar as Lambdas

```bash
# Windows
powershell Compress-Archive -Path functions/send-notification/dist/handler.js -DestinationPath functions/send-notification/dist/handler.zip -Force
powershell Compress-Archive -Path functions/process-queue/dist/handler.js -DestinationPath functions/process-queue/dist/handler.zip -Force

# Mac/Linux
cd functions/send-notification/dist && zip handler.zip handler.js
cd ../../process-queue/dist && zip handler.zip handler.js
```

### 4. Deploy da infraestrutura

```bash
cd infrastructure
terraform init
terraform apply -auto-approve
```

Outputs esperados:
```
api_gateway_url = "https://xxx.execute-api.us-east-1.amazonaws.com/dev"
sqs_queue_url   = "https://sqs.us-east-1.amazonaws.com/.../notifyflow-dev-notifications.fifo"
```

### 5. Rodar o frontend

```bash
cd frontend
echo "VITE_API_URL=https://xxx.execute-api.us-east-1.amazonaws.com/dev" > .env
npm install
npm run dev
```

Acessa: **http://localhost:5173**

---

## Exemplos de Requisição

### Enviar email

```bash
curl -X POST https://xxx.execute-api.us-east-1.amazonaws.com/dev/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "recipient": "destinatario@email.com",
    "subject": "Teste NotifyFlow",
    "message": "Notificação enviada via SQS + SES!",
    "priority": "high"
  }'
```

### Enviar SMS

```bash
curl -X POST https://xxx.execute-api.us-east-1.amazonaws.com/dev/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sms",
    "recipient": "+5513974083045",
    "message": "Teste SMS via NotifyFlow",
    "priority": "normal"
  }'
```

### Resposta esperada

```json
{
  "message": "Notification queued successfully.",
  "notificationId": "uuid-gerado",
  "status": "queued"
}
```

---

## Destruir Infraestrutura

```bash
cd infrastructure
terraform destroy -auto-approve
```

---

## Estimativa de Custos

| Serviço | Free Tier | Custo após free tier |
|---|---|---|
| Lambda | 1M req/mês | ~$0.20 por 1M req |
| SQS | 1M req/mês | ~$0.40 por 1M req |
| DynamoDB | 25 GB + 200M req | Pay per request |
| API Gateway | 1M req/mês | ~$3.50 por 1M req |
| SES | 62k emails/mês | ~$0.10 por 1k emails |
| SNS SMS | — | ~$0.0075 por SMS |

**Custo estimado para desenvolvimento e testes: ~$0** 🎉

---

## Autor

**Flávio da Paixão Nunes**
Backend Developer & AWS Cloud Engineer — Santos, SP

[![GitHub](https://img.shields.io/badge/GitHub-Flavio--Paixao-181717?style=flat&logo=github)](https://github.com/Flavio-Paixao)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-flaviopx-0A66C2?style=flat&logo=linkedin)](https://linkedin.com/in/flaviopx)

> Parte do roadmap de certificações AWS e portfólio TypeScript para vagas remotas internacionais.
