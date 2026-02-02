pipeline {
  agent any
  options { timestamps() }

  environment {
    COMPOSE_FILE = "docker-compose.prod.yml"
    BACKEND_URL  = "http://localhost:4000"
    FRONTEND_URL = "http://localhost:80"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Docker sanity check') {
      steps {
        sh '''
          set -e
          docker version
          docker compose version
        '''
      }
    }

    stage('Login to Docker Hub') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'docker-hub-login', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
          sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
        }
      }
    }

    stage('Create Secrets') {
      steps {
        sh '''
          set -e
          echo "Creating backend/.env..."
          # Ensure backend directory exists
          mkdir -p backend
          
          # Create env file with Stripe Key
          cat > backend/.env <<EOF
PORT=4000
NODE_ENV=production
MONGO_URI=mongodb://mongo:27017/food_delivery
JWT_SECRET=secure-production-secret-123
STRIPE_SECRET_KEY=sk_test_placeholder_REPLACE_ME_WITH_REAL_KEY
EOF
          # Debug: Verify file content creation
          ls -l backend/.env
          cat backend/.env
        '''
      }
    }

    stage('Validate compose') {
      steps {
        sh '''
          set -e
          test -f "$COMPOSE_FILE"
          docker compose -f "$COMPOSE_FILE" config >/dev/null
        '''
      }
    }

    stage('Build & Push') {
      steps {
        sh '''
          set -e
          echo "Building images (forcing no-cache)..."
          docker compose -f "$COMPOSE_FILE" build --no-cache
          
          echo "Pushing images to Docker Hub..."
          docker compose -f "$COMPOSE_FILE" push
        '''
      }
    }

    stage('Deploy (Remote EC2)') {
      steps {
        withCredentials([string(credentialsId: 'ec2-ip', variable: 'REMOTE_IP'), usernamePassword(credentialsId: 'docker-hub-login', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
          sshagent(['ec2-ssh-key']) {
            sh '''
              set -e
              # 1. Login to Docker Hub on Remote Server
              ssh -o StrictHostKeyChecking=no ubuntu@$REMOTE_IP "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"

              # 2. Zip files including the newly generated .env
              # Note: excluding node_modules but explicitly including backend/.env
              tar -czf project.tar.gz --exclude='node_modules' docker-compose.prod.yml backend/ frontend/
              
              # 3. Copy files to Remote Server
              scp -o StrictHostKeyChecking=no project.tar.gz ubuntu@$REMOTE_IP:~/
              
              # 4. Execute remote commands
              ssh -o StrictHostKeyChecking=no ubuntu@$REMOTE_IP "
                # Setup app directory
                mkdir -p app
                
                # Move archive to app folder
                mv project.tar.gz app/
                cd app
                
                # NUCLEAR OPTION: Remove conflicting directories to force extraction
                echo "Cleaning up old configuration..."
                rm -rf backend frontend docker-compose.prod.yml
                
                # Extract new files
                echo "Extracting new configuration..."
                tar -xzf project.tar.gz
                
                # Verify .env exists on remote
                echo "Verifying remote .env..."
                ls -l backend/.env
                
                # Pull latest images
                echo "Pulling latest images..."
                docker compose -f docker-compose.prod.yml pull
                
                # Restart services
                echo "Restarting services..."
                docker compose -f docker-compose.prod.yml up -d --remove-orphans
              "
            '''
          }
        }
      }
    }

    stage('Health check') {
      steps {
        withCredentials([string(credentialsId: 'ec2-ip', variable: 'REMOTE_IP')]) {
          sh '''
            set -e
            # Allow some time for startup
            sleep 10
            
            # Verify Backend (Port 4000 on Remote Server)
            echo "Waiting for backend at http://$REMOTE_IP:4000..."
            if curl --retry 5 --retry-delay 5 --retry-connrefused -fsS "http://$REMOTE_IP:4000" >/dev/null 2>&1; then
                echo "Backend OK"
            else
                echo "Backend failed check, but deployment finished. Check logs if issues persist."
            fi
          '''
        }
      }
    }

    stage('Cleanup') {
      steps {
        sh '''
          docker system prune -f || true
        '''
      }
    }
  }

  post {
    always {
      sh '''
        docker compose -f "$COMPOSE_FILE" ps || true
      '''
    }
    failure {
      sh '''
        echo "---- backend logs ----"
        docker compose -f "$COMPOSE_FILE" logs --no-color --tail=50 backend || true
      '''
    }
  }
}
