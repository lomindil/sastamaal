#!/bin/bash
set -euo pipefail

export MSYS_NO_PATHCONV=1

################ CONFIG ################
APP_NAME="sastamaal"
REGION="us-east-2"
CLUSTER_NAME="${APP_NAME}-cluster"
SERVICE_NAME="${APP_NAME}-service"
TASK_FAMILY="${APP_NAME}-task"
ECR_REPO_NAME="${APP_NAME}-backend"
CONTAINER_PORT=3000
CPU="256"
MEMORY="512"
DESIRED_COUNT=1
#######################################
aws configure
######################################

echo "🚀 Starting FULL Infra + Deploy for $APP_NAME..."

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPO_NAME"

echo "🔹 Account: $ACCOUNT_ID"
echo "🔹 Region: $REGION"

# ---------- 1. Get Default VPC ----------
echo "🔍 Fetching default VPC..."
VPC_ID=$(aws ec2 describe-vpcs \
  --region $REGION \
  --filters Name=isDefault,Values=true \
  --query "Vpcs[0].VpcId" \
  --output text)

if [ "$VPC_ID" == "None" ]; then
  echo "❌ No default VPC found in region $REGION"
  exit 1
fi

echo "✅ Using VPC: $VPC_ID"

# ---------- 2. Detect PUBLIC Subnets (CRITICAL FIX) ----------
echo "🔍 Detecting public subnets (required for ALB)..."

SUBNETS=$(aws ec2 describe-subnets \
  --region $REGION \
  --filters "Name=vpc-id,Values=$VPC_ID" \
            "Name=map-public-ip-on-launch,Values=true" \
  --query "Subnets[*].SubnetId" \
  --output text)

SUBNET_COUNT=$(echo $SUBNETS | wc -w | tr -d ' ')

if [ "$SUBNET_COUNT" -lt 2 ]; then
  echo "❌ ERROR: Need at least 2 public subnets for ALB."
  echo "Create default VPC public subnets or enable auto-assign public IP."
  exit 1
fi

echo "✅ Public Subnets: $SUBNETS"
SUBNET_ARRAY=($SUBNETS)

# ---------- 3. Create ECR Repo (Idempotent) ----------
echo "📦 Checking ECR repository..."
if ! aws ecr describe-repositories \
  --region $REGION \
  --repository-names $ECR_REPO_NAME >/dev/null 2>&1; then

  echo "📦 Creating ECR repository..."
  aws ecr create-repository \
    --repository-name $ECR_REPO_NAME \
    --region $REGION >/dev/null
else
  echo "✅ ECR repository exists"
fi

# ---------- 4. Login to ECR ----------
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $REGION | \
docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# ---------- 5. Build & Push Docker Image ----------
echo "🐳 Building Docker image..."
docker build -t $APP_NAME .

echo "🏷️ Tagging image..."
docker tag $APP_NAME:latest $ECR_URI:latest

echo "📤 Pushing image to ECR..."
docker push $ECR_URI:latest

# ---------- 6. Create ECS Cluster ----------
echo "🧠 Checking ECS cluster..."
if ! aws ecs describe-clusters \
  --region $REGION \
  --clusters $CLUSTER_NAME \
  --query "clusters[0].status" \
  --output text 2>/dev/null | grep -q "ACTIVE"; then

  echo "🆕 Creating ECS cluster..."
  aws ecs create-cluster \
    --cluster-name $CLUSTER_NAME \
    --region $REGION >/dev/null
else
  echo "✅ ECS cluster exists"
fi

# ---------- 7. Create Security Groups ----------
echo "🔐 Creating / Fetching Security Groups..."

ALB_SG=$(aws ec2 describe-security-groups \
  --region $REGION \
  --filters Name=group-name,Values=${APP_NAME}-alb-sg \
  --query "SecurityGroups[0].GroupId" \
  --output text 2>/dev/null || echo "None")

if [ "$ALB_SG" == "None" ]; then
  echo "🆕 Creating ALB Security Group..."
  ALB_SG=$(aws ec2 create-security-group \
    --group-name ${APP_NAME}-alb-sg \
    --description "ALB SG" \
    --vpc-id $VPC_ID \
    --region $REGION \
    --query 'GroupId' --output text)

  aws ec2 authorize-security-group-ingress \
    --region $REGION \
    --group-id $ALB_SG \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 >/dev/null
else
  echo "✅ ALB SG exists: $ALB_SG"
fi

TASK_SG=$(aws ec2 describe-security-groups \
  --region $REGION \
  --filters Name=group-name,Values=${APP_NAME}-task-sg \
  --query "SecurityGroups[0].GroupId" \
  --output text 2>/dev/null || echo "None")

if [ "$TASK_SG" == "None" ]; then
  echo "🆕 Creating ECS Task Security Group..."
  TASK_SG=$(aws ec2 create-security-group \
    --group-name ${APP_NAME}-task-sg \
    --description "ECS Task SG" \
    --vpc-id $VPC_ID \
    --region $REGION \
    --query 'GroupId' --output text)

  aws ec2 authorize-security-group-ingress \
    --region $REGION \
    --group-id $TASK_SG \
    --protocol tcp \
    --port $CONTAINER_PORT \
    --source-group $ALB_SG >/dev/null
else
  echo "✅ Task SG exists: $TASK_SG"
fi

# ---------- 8. Create / Fetch ALB (FIXED) ----------
echo "🌐 Creating / Fetching ALB..."

ALB_ARN=$(aws elbv2 describe-load-balancers \
  --region $REGION \
  --names ${APP_NAME}-alb \
  --query "LoadBalancers[0].LoadBalancerArn" \
  --output text 2>/dev/null || echo "None")

if [ "$ALB_ARN" == "None" ]; then
  echo "🆕 Creating Application Load Balancer..."
  ALB_ARN=$(aws elbv2 create-load-balancer \
    --name ${APP_NAME}-alb \
    --subnets ${SUBNET_ARRAY[@]} \
    --security-groups $ALB_SG \
    --scheme internet-facing \
    --type application \
    --region $REGION \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)

  echo "⏳ Waiting for ALB to become active (2-3 mins)..."
  aws elbv2 wait load-balancer-available \
    --region $REGION \
    --load-balancer-arns $ALB_ARN
else
  echo "✅ ALB exists"
fi

# ---------- 9. Create / Fetch Target Group ----------
echo "🎯 Creating / Fetching Target Group..."

TG_ARN=$(aws elbv2 describe-target-groups \
  --region $REGION \
  --names ${APP_NAME}-tg \
  --query "TargetGroups[0].TargetGroupArn" \
  --output text 2>/dev/null || echo "None")

if [ "$TG_ARN" == "None" ]; then
  TG_ARN=$(aws elbv2 create-target-group \
    --name ${APP_NAME}-tg \
    --protocol HTTP \
    --port $CONTAINER_PORT \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-path "/health" \
    --region $REGION \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)
else
  echo "✅ Target Group exists"
fi

# ---------- 10. Create Listener ----------
echo "🎧 Ensuring ALB Listener..."

LISTENER=$(aws elbv2 describe-listeners \
  --region $REGION \
  --load-balancer-arn $ALB_ARN \
  --query "Listeners[0].ListenerArn" \
  --output text 2>/dev/null || echo "None")

if [ "$LISTENER" == "None" ]; then
  aws elbv2 create-listener \
    --region $REGION \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TG_ARN >/dev/null
fi

# ---------- 11. Register Task Definition ----------
echo "📜 Registering new task definition..."
TASK_DEF_ARN=$(aws ecs register-task-definition \
  --region $REGION \
  --family $TASK_FAMILY \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu $CPU \
  --memory $MEMORY \
  --execution-role-arn arn:aws:iam::$ACCOUNT_ID:role/ecsTaskExecutionRole \
  --container-definitions "[
    {
      \"name\": \"$APP_NAME\",
      \"image\": \"$ECR_URI:latest\",
      \"essential\": true,
      \"portMappings\": [
        {\"containerPort\": $CONTAINER_PORT, \"protocol\": \"tcp\"}
      ]
    }
  ]" \
  --query "taskDefinition.taskDefinitionArn" \
  --output text)

# ---------- 12. Create or Update ECS Service ----------
echo "🚀 Creating or Updating ECS Service..."

SERVICE_STATUS=$(aws ecs describe-services \
  --region $REGION \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --query "services[0].status" \
  --output text 2>/dev/null || echo "MISSING")

if [ "$SERVICE_STATUS" == "ACTIVE" ]; then
  echo "♻️ Service exists → forcing new deployment..."
  aws ecs update-service \
    --region $REGION \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --force-new-deployment >/dev/null
else
  echo "🆕 Creating ECS Service..."
  aws ecs create-service \
    --region $REGION \
    --cluster $CLUSTER_NAME \
    --service-name $SERVICE_NAME \
    --task-definition $TASK_DEF_ARN \
    --desired-count $DESIRED_COUNT \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_ARRAY[0]},${SUBNET_ARRAY[1]}],securityGroups=[$TASK_SG],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=$TG_ARN,containerName=$APP_NAME,containerPort=$CONTAINER_PORT" >/dev/null
fi

# ---------- 13. Output URL ----------
echo "🌍 Fetching Application URL..."
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --region $REGION \
  --load-balancer-arns $ALB_ARN \
  --query "LoadBalancers[0].DNSName" \
  --output text)

echo "🎉 Deployment Successful!"
echo "🔗 Application URL: http://$ALB_DNS"
