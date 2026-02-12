# Quick Commerce Price Comparison - Learning Project

## 🎯 Purpose
Educational tool for understanding how quick-commerce platforms (Swiggy Instamart, Blinkit, etc.) work behind the scenes.

## 🔧 Why Puppeteer?
Platforms use advanced bot protection:
- **AWS WAF/CAPTCHA** challenges
- **Dynamic session tokens**
- **JavaScript-rendered content**
- **Cookie-based authentication**
- **Rate limiting** based on behavior

Puppeteer simulates real browsers, bypassing these protections.

## 🚀 Quick Start
To verify api ends points quickly through puppeteer, run :- 

- npm init -y
- npm install puppeteer
- node <script>.js


# 🚀 End-to-End: Deploy Node.js App on AWS Fargate (With ALB)

---

# 1️⃣ Architecture Overview (Mental Model)

Final working architecture:

```
Internet
   ↓
Application Load Balancer (Public Subnet)
   ↓
Target Group (IP:3000)
   ↓
ECS Service (Fargate)
   ↓
Task (awsvpc mode)
   ↓
Container (Node.js)
```

Key components:

| Component       | Purpose                    |
| --------------- | -------------------------- |
| ECR             | Stores Docker image        |
| ECS Cluster     | Logical container group    |
| Task Definition | Defines container config   |
| Service         | Maintains running tasks    |
| Fargate         | Serverless compute         |
| ALB             | Public traffic entry point |
| Target Group    | Routes traffic to tasks    |

---

# 2️⃣ Application Requirements (Critical for Cloud)

Your Node app must:

### ✅ Bind to `0.0.0.0`

Correct:

```js
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
```

Why?

* Containers have their own network namespace
* `localhost` = only inside container
* ALB connects via ENI private IP
* If binding to 127.0.0.1 → ALB cannot reach it → 504

---

### ✅ Use Environment Port

```js
const PORT = process.env.PORT || 3000;
```

Never hardcode.

---

### ✅ Health Check Route

If target group health path is `/health`, you must define:

```js
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});
```

If health check path is `/`, ensure root route returns 200.

---

# 3️⃣ Dockerfile (Working Version)

Your Dockerfile is correct:

```dockerfile
FROM node:20-bullseye-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
EXPOSE 3000

CMD ["node", "src/server.js"]
```

Important:

* `EXPOSE 3000` informs ECS metadata
* CMD must match actual entry file

---

# 4️⃣ Build and Push to ECR

### Step 1 — Build

```bash
docker build -t sastamaal-backend .
```

---

### Step 2 — Tag for ECR

Get repository URI from:

```
AWS Console → ECR → Repository
```

Then:

```bash
docker tag sastamaal-backend:latest <account-id>.dkr.ecr.us-east-2.amazonaws.com/sastamaal-backend:latest
```

---

### Step 3 — Login to ECR

From ECR → "View push commands"

Run:

```bash
docker login -u AWS -p <token> https://<account-id>.dkr.ecr.us-east-2.amazonaws.com
```

---

### Step 4 — Push

```bash
docker push <account-id>.dkr.ecr.us-east-2.amazonaws.com/sastamaal-backend:latest
```

Verify:

```
ECR → Images → latest → Updated timestamp
```

---

# 5️⃣ ECS Task Definition

Create Task Definition:

* Launch type: Fargate
* CPU: 0.25 vCPU (minimum)
* Memory: 0.5 GB (note: low for Chromium)

Container settings:

* Image: ECR URI
* Port mapping:

  * Container port: 3000
* Log driver: awslogs

---

# 6️⃣ ECS Service Creation (With ALB)

During service creation:

### Load Balancer

* Type: Application Load Balancer
* Scheme: internet-facing
* Listener: HTTP 80
* Create new target group

### Target Group Settings

* Target type: IP (auto for Fargate)
* Protocol: HTTP
* Port: 3000
* Health check protocol: HTTP
* Health check path: `/`

---

# 7️⃣ Networking Configuration (Critical Section)

This is where most deployments fail.

---

## 🔐 Security Groups

### ALB Security Group

Inbound:

```
HTTP 80 → 0.0.0.0/0
```

Outbound:

```
All traffic → 0.0.0.0/0
```

---

### ECS Task Security Group

Inbound:

```
Custom TCP
Port: 3000
Source: ALB Security Group
```

This is mandatory.

If missing:

```
Target → Unhealthy
Reason → Request timed out
Browser → 504
```

Why?

Traffic flow:

```
Browser → ALB SG → ECS SG → Container
```

If second step blocked → timeout.

---

## Subnets

* ALB → Public Subnets
* ECS Tasks → Private or Public (either works)
* Both must be in same VPC

---

# 8️⃣ Deployment Update Flow

When fixing code:

You must:

1. Modify code
2. Rebuild Docker image
3. Push image to ECR
4. Force new deployment in ECS

Important:

Forcing deployment without pushing new image will redeploy old image.

---

# 9️⃣ Debugging Errors You Encountered

---

## ❌ Service Disappeared

Cause:
Service creation failed.

Fix:
Check:

```
ECS → Cluster → Events
ECS → Tasks → Stopped reason
```

---

## ❌ 504 Gateway Timeout

Meaning:

ALB reachable
Backend not responding

Common causes:

* Binding to localhost
* Security group blocking
* App not started
* Health check path wrong

---

## ❌ Target Unhealthy – Request timed out

Meaning:

ALB tried to connect to IP:3000
No response

Causes:

1. App not listening
2. ECS SG blocking
3. Wrong port mapping
4. Server startup stuck

---

# 🔟 Special Note About Puppeteer in Fargate

You are using Chromium.

You must ensure:

* Adequate memory (prefer 1 vCPU + 2GB)
* Launch flags:

  ```js
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage"
  ]
  ```

Fargate 0.5GB may be too small for heavy browser usage.

---

# 1️⃣1️⃣ How Health Check Actually Works Internally

ALB sends:

```
GET /
```

To:

```
<task-private-ip>:3000
```

If:

* Response code 200–399 → Healthy
* No response in timeout window → Unhealthy

Default timeout: 5 seconds
Default unhealthy threshold: 2 failures

---

# 1️⃣2️⃣ Final Working Flow Summary

Correct setup:

```
Node app → binds 0.0.0.0
Docker → build & push
ECR → stores image
ECS → pulls image
ALB → forwards 80 → 3000
Security group → allows ALB → ECS
Target group → healthy
Browser → 200 OK
```

---
