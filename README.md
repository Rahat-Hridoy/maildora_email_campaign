# Maildora

### Scalable Email Campaign SaaS Platform

![Node](https://img.shields.io/badge/Node.js-20-green)
![NestJS](https://img.shields.io/badge/NestJS-Backend-red)
![NextJS](https://img.shields.io/badge/Next.js-Frontend-black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
![Redis](https://img.shields.io/badge/Redis-Queue-red)
![Docker](https://img.shields.io/badge/Docker-Container-blue)

**Maildora** is a scalable **Email Campaign SaaS platform** that allows organizations to send targeted email campaigns to their contacts, track campaign analytics, and manage team members.

The system is built using a **queue-driven** architecture to efficiently handle **large-scale** email delivery.

---

# Documentation

The detailed documents are here: 

- 📄 [Maildora Case Study](./public/doc/maildora_case_study_v2.pdf)
- 📄 [Maildora System Architecture](./public/doc/maildora_architecture.pdf)

---

# System Architecture

![Maildora Architecture](./public/images/Maildora%20Email%20Campaign%20System%20Architecture.png)

Maildora use a **multi-layer architecture** 

- HTTP Layer → API request handling  
- Queue Layer → Job orchestration  
- Processing Layer → Email sending workers  

Core flow:

Client → Nginx → API → Redis Queue → Worker → Brevo → PostgreSQL

---

# Tech Stack

## Backend
- NestJS
- Prisma ORM
- PostgreSQL (Neon)

## Frontend
- Next.js
- Clerk Authentication

## Queue System
- BullMQ
- Redis

## Infrastructure
- Docker
- Nginx Reverse Proxy
- Turborepo Monorepo

## Email Provider
- Brevo API

---

# Monorepo Structure

```
maildora_email_campaign/
├── apps/
│   ├── api/        → NestJS Backend (port 4000)
│   ├── web/        → Next.js Frontend (port 3000)
│   └── worker/     → NestJS Worker Service
├── packages/
│   └── queue/      → Shared Queue Types
└── docker/
    └── nginx/      → Nginx Reverse Proxy

docker-compose.yml

```
---

# Features

## Multi-Tenancy
- Organization based isolation
- Role based access control
- `organizationId` enforced in queries

## Authentication (RBAC)
- Clerk authentication
- Email & OAuth (Google, GitHub) Login
- Webhook based user sync

## Contact Management
- Contact CRUD
- Pagination
- Search
- Bulk import

## Campaign Management

Campaign lifecycle:
#### DRAFT → SCHEDULED → PROCESSING → SENT / CANCELLED

Features:

- Create campaign
- Duplicate campaign
- Send campaign
- Cancel campaign

## Email Queue System

Email sending are handled asynchronously . 

Flow:

1. Contacts load  
2. Recipient records create  
3. Add to Jobs queue
4. Send Email by Worker   

Status flow:
#### PENDING → QUEUED → SENT → FAILED


Retry strategy:

- 3 attempts
- exponential backoff

---

# Multi Queue Architecture

To avoid **Enterprise campaigns delay** used **multi-queue system** .

|      Queue     |      Purpose     |      Rate      |
|----------------|------------------|----------------|
| priority-queue | Enterprise users |     150/min    |
| bulk-queue     | Free users       |     150/min    |
| retry-queue    | Failed jobs      |      retry     |

Brevo free tier limit:
300 emails/min

---

# Worker Architecture

The benefits of Separate worker service : 

Benefits:

- API fast 
- Worker easily scalable
- Email load isolatalbe

Flow:
```
User Request
     ↓
    API
     ↓
Redis Queue
     ↓
   Worker
     ↓
  Brevo API
```

---

# API Endpoints

## Contacts
- GET /organizations/:id/contacts
- POST /organizations/:id/contacts
- POST /organizations/:id/contacts/import
- PATCH /organizations/:id/contacts/:cid
- DELETE /organizations/:id/contacts/:cid


## Campaigns
- GET /organizations/:id/campaigns
- POST /organizations/:id/campaigns
- POST /organizations/:id/campaigns/:cid/send
- POST /organizations/:id/campaigns/:cid/duplicate
- PATCH /organizations/:id/campaigns/:cid/cancel
- DELETE /organizations/:id/campaigns/:cid


## Sender Emails
- GET /organizations/:id/sender-emails
- POST /organizations/:id/sender-emails
- POST /organizations/:id/sender-emails/:sid/sync
- DELETE /organizations/:id/sender-emails/:sid


## Queue dashboard: 

- /admin/queues 


---

# Local Development Setup

Clone repo

```bash
git clone https://github.com/Rahat-Hridoy/maildora_email_campaign
cd maildora_email_campaign

# Run Project 

docker compose up -d

# Services:
Frontend  → http://localhost
API       → http://localhost/api
Queues    → http://localhost/admin/queues
```
---

# Scaling Workers

**Workers horizontally scalalbe**

Default : 
```bash
docker compose up -d
```
Scale workers: 
```bash
docker compose up --scale worker=3 -d
```
---

# Conclusion:

**Maildora** shows how a **scalable Email Campaign SaaS platform** can efficiently manage and deliver **large-scale** emails using a **queue-driven architecture**. This project highlights the benefits of **asynchronous email processing**, **organized campaign management**, and **multi-tenant system design**. While building this system, I implemented my skills in full-stack development using **Next.js**, **NestJS**, **Redis**, **PostgreSQL**, and **Prisma**. I also applied concepts like **API design**, **database modeling**, and **Docker-based containerization** to create a **scalable** and **production-ready** SaaS solution.

----
# Author

### Md Rahatul Islam 
**[Full Stack Developer]**
- Email : rahathridoyd2x@gmail.com
- Phone : +880 1917 579030
