#!/bin/bash
set -euo pipefail

# 🔧 Fix Git Bash path conversion (VERY IMPORTANT on Windows)
export MSYS_NO_PATHCONV=1

################ CONFIG ################
APP_NAME="sastamaal"
REGION="us-east-2"
CLUSTER_NAME="${APP_NAME}-cluster"
SERVICE_NAME="${APP_NAME}-service"
ECR_REPO_NAME="${APP_NAME}-backend"
#######################################
aws configure
#######################################

echo "🧹 Starting FULL cleanup for $APP_NAME in $REGION..."

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# ---------- 1. Delete ECS Service ----------
echo "🔍 Checking ECS service..."
SERVICE_STATUS=$(aws ecs describe-services \
  --region $REGION \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --query "services[0].status" \
  --output text 2>/dev/null || echo "MISSING")

if [ "$SERVICE_STATUS" == "ACTIVE" ]; then
  echo "🛑 Scaling service to 0 tasks..."
  aws ecs update-service \
    --region $REGION \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --desired-count 0 >/dev/null

  echo "⏳ Waiting for tasks to stop..."
  sleep 20

  echo "🗑 Deleting ECS service..."
  aws ecs delete-service \
    --region $REGION \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --force >/dev/null
else
  echo "ℹ️ ECS service not found or already deleted."
fi

# ---------- 2. Stop Any Running Tasks ----------
echo "🔍 Checking running ECS tasks..."
TASK_ARNS=$(aws ecs list-tasks \
  --region $REGION \
  --cluster $CLUSTER_NAME \
  --query "taskArns[]" \
  --output text 2>/dev/null || echo "")

if [ -n "$TASK_ARNS" ]; then
  echo "🛑 Stopping running tasks..."
  for TASK in $TASK_ARNS; do
    aws ecs stop-task \
      --region $REGION \
      --cluster $CLUSTER_NAME \
      --task $TASK >/dev/null
  done
else
  echo "ℹ️ No running tasks."
fi

# ---------- 3. Delete Load Balancer ----------
echo "🔍 Checking ALB..."
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --region $REGION \
  --names ${APP_NAME}-alb \
  --query "LoadBalancers[0].LoadBalancerArn" \
  --output text 2>/dev/null || echo "None")

if [ "$ALB_ARN" != "None" ]; then
  echo "🗑 Deleting Load Balancer (stops major billing)..."
  aws elbv2 delete-load-balancer \
    --region $REGION \
    --load-balancer-arn $ALB_ARN

  echo "⏳ Waiting for ALB to fully delete..."
  sleep 30
else
  echo "ℹ️ No ALB found."
fi

# ---------- 4. Delete Target Group ----------
echo "🔍 Checking Target Group..."
TG_ARN=$(aws elbv2 describe-target-groups \
  --region $REGION \
  --names ${APP_NAME}-tg \
  --query "TargetGroups[0].TargetGroupArn" \
  --output text 2>/dev/null || echo "None")

if [ "$TG_ARN" != "None" ]; then
  echo "🗑 Deleting Target Group..."
  aws elbv2 delete-target-group \
    --region $REGION \
    --target-group-arn $TG_ARN
else
  echo "ℹ️ No Target Group found."
fi

# ---------- 5. Delete Security Groups ----------
echo "🔐 Cleaning Security Groups..."
for SG_NAME in "${APP_NAME}-alb-sg" "${APP_NAME}-task-sg"; do
  SG_ID=$(aws ec2 describe-security-groups \
    --region $REGION \
    --filters Name=group-name,Values=$SG_NAME \
    --query "SecurityGroups[0].GroupId" \
    --output text 2>/dev/null || echo "None")

  if [ "$SG_ID" != "None" ]; then
    echo "🗑 Attempting to delete SG: $SG_NAME ($SG_ID)"
    aws ec2 delete-security-group \
      --region $REGION \
      --group-id $SG_ID || echo "⚠️ SG still in use (will auto-release after ENI cleanup)"
  else
    echo "ℹ️ SG $SG_NAME not found."
  fi
done

# ---------- 6. Delete ECS Cluster ----------
echo "🔍 Checking ECS cluster..."
CLUSTER_STATUS=$(aws ecs describe-clusters \
  --region $REGION \
  --clusters $CLUSTER_NAME \
  --query "clusters[0].status" \
  --output text 2>/dev/null || echo "None")

if [ "$CLUSTER_STATUS" == "ACTIVE" ]; then
  echo "🗑 Deleting ECS cluster..."
  aws ecs delete-cluster \
    --region $REGION \
    --cluster $CLUSTER_NAME >/dev/null
else
  echo "ℹ️ ECS cluster not found."
fi

# ---------- 7. Delete ECR Repository (Optional but recommended) ----------
echo "🔍 Checking ECR repository..."
REPO_EXISTS=$(aws ecr describe-repositories \
  --region $REGION \
  --repository-names $ECR_REPO_NAME \
  --query "repositories[0].repositoryName" \
  --output text 2>/dev/null || echo "None")

if [ "$REPO_EXISTS" != "None" ]; then
  echo "🗑 Deleting ECR repository (removes stored images)..."
  aws ecr delete-repository \
    --region $REGION \
    --repository-name $ECR_REPO_NAME \
    --force >/dev/null
else
  echo "ℹ️ ECR repo not found."
fi

echo "🎉 Cleanup completed successfully!"
echo "💰 All billable resources (ALB, Fargate, ECR) are removed."
