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
        // Requires 'docker-hub-login' credentials (Username with password) in Jenkins
        withCredentials([usernamePassword(credentialsId: 'docker-hub-login', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
          sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
        }
      }
    }

    stage('Create Secrets') {
      steps {
        // Simple .env creation without Jenkins credentials for Mongo/JWT
        sh '''
          set -e
          echo "Creating backend/.env..."
          cat > backend/.env <<EOF
PORT=4000
NODE_ENV=production
MONGO_URI=mongodb://mongo:27017/food_delivery
JWT_SECRET=secure-production-secret-123
EOF
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
          docker compose -f "$COMPOSE_FILE" build
          docker compose -f "$COMPOSE_FILE" push
        '''
      }
    }

    /*
    stage('Deploy (Local)') {
      steps {
        sh '''
          set -e
          docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
          docker compose -f "$COMPOSE_FILE" ps
        '''
      }
    }
    */
 
    // Deploy to Remote EC2 via SSH
    // Requires 'ec2-ssh-key' (SSH Username with private key) and 'ec2-ip' (Secret text) in Jenkins
    stage('Deploy (Remote EC2)') {
      steps {
        withCredentials([string(credentialsId: 'ec2-ip', variable: 'REMOTE_IP'), usernamePassword(credentialsId: 'docker-hub-login', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
          sshagent(['ec2-ssh-key']) {
            sh '''
              # 1. Login to Docker Hub on Remote Server
              ssh -o StrictHostKeyChecking=no ubuntu@$REMOTE_IP "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"

              # 2. Zip files to transfer (Excluding node_modules to save bandwidth)
              # We still send the context so compose doesn't complain, but we rely on pulled images.
              tar -czf project.tar.gz --exclude='node_modules' docker-compose.prod.yml backend/ frontend/
              
              # 3. Copy files to Remote Server
              scp -o StrictHostKeyChecking=no project.tar.gz ubuntu@$REMOTE_IP:~/
              
              # 4. Execute remote commands
              ssh -o StrictHostKeyChecking=no ubuntu@$REMOTE_IP "
                # Extract files
                mkdir -p app && mv project.tar.gz app/ && cd app
                tar -xzf project.tar.gz
                
                # Pull latest images from Docker Hub
                docker compose -f docker-compose.prod.yml pull
                
                # Start services (no build)
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
            
            # Verify Backend (Port 4000 on Remote Server)
            echo "Waiting for backend at http://$REMOTE_IP:4000..."
            i=0
            while [ $i -lt 30 ]; do
              if curl -fsS "http://$REMOTE_IP:4000" >/dev/null 2>&1; then
                echo "Backend OK"
                break
              fi
              sleep 2
              i=$((i+1))
              if [ $i -ge 30 ]; then echo "Backend not ready"; exit 1; fi
            done

            # Verify Frontend (Port 80 on Remote Server)
            echo "Waiting for frontend at http://$REMOTE_IP:80..."
            i=0
            while [ $i -lt 30 ]; do
              if curl -fsS "http://$REMOTE_IP:80" >/dev/null 2>&1; then
                echo "Frontend OK"
                break
              fi
              sleep 2
              i=$((i+1))
              if [ $i -ge 30 ]; then echo "Frontend not ready"; exit 1; fi
            done
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
        docker compose -f "$COMPOSE_FILE" logs --no-color --tail=200 backend || true
        echo "---- frontend logs ----"
        docker compose -f "$COMPOSE_FILE" logs --no-color --tail=200 frontend || true
      '''
    }
  }
}
