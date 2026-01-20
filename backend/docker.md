# Docker Commands

### Image:
1. `docker build -t sastamaal_app .`
### Container
1. `docker run -p 3000:3000 --name sastamaal_container sastamaal_app`
2. `docker rm -f sastamaal_container` - Stops the container (if it's running) and deletes the container
3. `docker logs sastamaal_container` - Shows container logs
4. `docker run -p 3000:3000 --name sastamaal_container --cpus="1.0" --memory=1g --memory-swap=1536m --shm-size=512m  --pids-limit=400 sastamaal_app`
