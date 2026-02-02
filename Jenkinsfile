pipeline {
  agent any
  options { timestamps() }

  environment {
    // Defined environment variables for the pipeline
    COMPOSE_FILE = "docker-compose.prod.yml"
    DOCKER_IMAGE_BACKEND = "janithhisara/food-delivery-system:backend"
    DOCKER_IMAGE_FRONTEND = "janithhisara/food-delivery-system:frontend"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    // Creates the necessary .env file for the backend
    // CRITICAL for Stripe and Database connections
    stage('Create Configuration') {
      steps {
        sh '''
          mkdir -p backend
          echo "Creating backend/.env..."
          cat > backend/.env <<EOF
PORT=4000
NODE_ENV=production
MONGO_URI=mongodb://mongo:27017/food_delivery
JWT_SECRET=secure-production-secret-123
STRIPE_SECRET_KEY=sk_test_placeholder_REPLACE_ME_WITH_REAL_KEY
EOF
        '''
      }
    }

    stage('Build Docker Images') {
      steps {
        sh '''
          echo "Building backend..."
          docker build -t $DOCKER_IMAGE_BACKEND -f backend/Dockerfile.prod ./backend
          
          echo "Building frontend..."
          docker build -t $DOCKER_IMAGE_FRONTEND -f frontend/Dockerfile.prod ./frontend
        '''
      }
    }

    stage('Push to Docker Hub') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker-hub-login', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh '''
            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
            
            echo "Pushing Backend..."
            docker push $DOCKER_IMAGE_BACKEND
            
            echo "Pushing Frontend..."
            docker push $DOCKER_IMAGE_FRONTEND
          '''
        }
      }
    }

    stage('Deploy to EC2') {
      steps {
        // Deployment uses the existing EC2 IP and SSH Key
        withCredentials([string(credentialsId: 'ec2-ip', variable: 'REMOTE_IP'), usernamePassword(credentialsId: 'docker-hub-login', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
          sshagent(['ec2-ssh-key']) {
             sh '''
                set -e
                echo "Deploying to $REMOTE_IP..."
                
                # 1. Login to Docker Hub on Remote Server (to pull private images)
                ssh -o StrictHostKeyChecking=no ubuntu@$REMOTE_IP "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"

                # 2. Package configuration files
                # We send docker-compose.prod.yml and the generated backend/.env
                tar -czf deploy_package.tar.gz docker-compose.prod.yml backend/.env

                # 3. Copy package to server
                scp -o StrictHostKeyChecking=no deploy_package.tar.gz ubuntu@$REMOTE_IP:~/

                # 4. Execute Remote Deployment Commands
                ssh -o StrictHostKeyChecking=no ubuntu@$REMOTE_IP "
                    # Create app directory if not exists
                    mkdir -p app
                    mv deploy_package.tar.gz app/
                    cd app
                    
                    # Cleanup old configs to ensure update
                    rm -rf backend docker-compose.prod.yml
                    
                    # Extract new files
                    tar -xzf deploy_package.tar.gz
                    
                    # Pull latest images from Docker Hub
                    docker compose -f docker-compose.prod.yml pull
                    
                    # Restart containers with new configuration
                    docker compose -f docker-compose.prod.yml up -d --remove-orphans
                    
                    # Cleanup unused images
                    docker system prune -f
                "
             '''
          }
        }
      }
    }

    stage('Verify Deployment') {
      steps {
         withCredentials([string(credentialsId: 'ec2-ip', variable: 'REMOTE_IP')]) {
           sh '''
             echo "Waiting for health check on http://$REMOTE_IP:4000..."
             sleep 10
             if curl -fsS --max-time 5 "http://$REMOTE_IP:4000"; then
                 echo "Backend is UP!"
             else
                 echo "Warning: Backend verification failed (might just be slow startup)"
             fi
           '''
         }
      }
    }
  }

  post {
    failure {
      echo '❌ Deployment Failed'
    }
    success {
      echo '✅ Food Delivery System Deployed Successfully'
    }
  }
}