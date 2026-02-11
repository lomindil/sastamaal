### Deployment


1. aws configure
2. Paste Access Key and Secret Access Key!!
3. Verify Identity: aws sts get-caller-identity
3.```aws ecr create-repository --repository-name sastamaal-app --region ap-south-1```
```bash
{
    "repository": {
        "repositoryArn": "arn:aws:ecr:ap-south-1:598357934871:repository/sastamaal-app",
        "registryId": "598357934871",
        "repositoryName": "sastamaal-app",
        "repositoryUri": "598357934871.dkr.ecr.ap-south-1.amazonaws.com/sastamaal-app",
        "createdAt": "2026-02-02T19:53:57.310000+05:30",
        "imageTagMutability": "MUTABLE",
        "imageScanningConfiguration": {
            "scanOnPush": false
        },
        "encryptionConfiguration": {
            "encryptionType": "AES256"
        }
    }
}
```
5. ```aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 598357934871.dkr.ecr.ap-south-1.amazonaws.com```
6. ```docker build -f Dockerfile.lambda -t sastamaal-app .```
7. ```docker buildx build --platform linux/amd64 -f Dockerfile.lambda -t sastamaal-app --load .```: Building Image for x86
7. ```docker tag sastamaal-app:latest 598357934871.dkr.ecr.ap-south-1.amazonaws.com/sastamaal-app:latest```
8. ```docker push 598357934871.dkr.ecr.ap-south-1.amazonaws.com/sastamaal-app:latest```