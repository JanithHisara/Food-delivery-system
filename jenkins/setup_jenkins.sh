#!/bin/bash

# Configuration
IMAGE_NAME="jenkins-docker"
CONTAINER_NAME="jenkins-local"
HOST_DOCKER_SOCK="/var/run/docker.sock"

# Build the custom Jenkins image
echo "Building Jenkins image with Docker CLI..."
docker build -t $IMAGE_NAME -f jenkins/Dockerfile .

# Stop and remove existing container if it exists
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "Stopping and removing existing $CONTAINER_NAME container..."
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
fi

# Run the new container
echo "Starting Jenkins container..."
# We mount the host's docker socket to the container's docker socket
# This allows the docker CLI inside the container to communicate with the host's docker daemon
docker run -d \
  -p 8080:8080 \
  -p 50000:50000 \
  --name $CONTAINER_NAME \
  --restart=on-failure \
  -v jenkins_home:/var/jenkins_home \
  -v $HOST_DOCKER_SOCK:/var/run/docker.sock \
  $IMAGE_NAME

echo "Jenkins is running! Access it at http://localhost:8080"
echo "To verify Docker access, run: docker exec -it $CONTAINER_NAME docker --version"
