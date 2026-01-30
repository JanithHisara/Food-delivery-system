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

    stage('Validate compose') {
      steps {
        sh '''
          set -e
          test -f "$COMPOSE_FILE"
          docker compose -f "$COMPOSE_FILE" config >/dev/null
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
        // Requires 'mongo-uri' and 'jwt-secret' (Secret text) in Jenkins
        withCredentials([string(credentialsId: 'mongo-uri', variable: 'MONGO_URI_VAL'), string(credentialsId: 'jwt-secret', variable: 'JWT_SECRET_VAL')]) {
          sh '''
            set -e
            echo "Creating backend/.env from Jenkins secrets..."
            cat > backend/.env <<EOF
PORT=4000
NODE_ENV=production
MONGO_URI=$MONGO_URI_VAL
JWT_SECRET=$JWT_SECRET_VAL
EOF
          '''
        }
      }
    }

    stage('Build') {
      steps {
        sh '''
          set -e
          docker compose -f "$COMPOSE_FILE" build
        '''
      }
    }

    stage('Deploy (Local)') {
      steps {
        sh '''
          set -e
          docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
          docker compose -f "$COMPOSE_FILE" ps
        '''
      }
    }

    /* 
    // Example: Deploy to Remote EC2 via SSH
    // Requires 'ec2-ssh-key' (SSH Username with private key) in Jenkins
    stage('Deploy (Remote EC2)') {
      steps {
        sshagent(['ec2-ssh-key']) {
          sh '''
            # Zip files to transfer
            tar -czf project.tar.gz docker-compose.prod.yml backend/ frontend/ nginx.conf
            
            # Copy files
            scp -o StrictHostKeyChecking=no project.tar.gz ubuntu@<EC2_IP>:~/app/
            
            # Execute remote commands
            ssh -o StrictHostKeyChecking=no ubuntu@<EC2_IP> "
              cd ~/app
              tar -xzf project.tar.gz
              # Create .env on remote server or pass vars...
              docker compose -f docker-compose.prod.yml up -d --build
            "
          '''
        }
      }
    }
    */

    stage('Health check') {
      steps {
        sh '''
          set -e

          echo "Waiting for backend..."
          for i in {1..30}; do
            if curl -fsS "$BACKEND_URL" >/dev/null 2>&1; then
              echo "Backend OK"
              break
            fi
            sleep 2
            [ "$i" -eq 30 ] && echo "Backend not ready" && exit 1
          done

          echo "Waiting for frontend..."
          for i in {1..30}; do
            if curl -fsS "$FRONTEND_URL" >/dev/null 2>&1; then
              echo "Frontend OK"
              break
            fi
            sleep 2
            [ "$i" -eq 30 ] && echo "Frontend not ready" && exit 1
          done
        '''
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
