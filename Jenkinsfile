pipeline {
  agent any
  options { timestamps() }

  environment {
    COMPOSE_FILE = "docker-compose.yml"
    BACKEND_URL  = "http://localhost:4000"
    FRONTEND_URL = "http://localhost:5173"
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

    stage('Ensure backend .env exists') {
      steps {
        sh '''
          set -e
          if [ ! -f backend/.env ]; then
            echo "Creating backend/.env (dev defaults)..."
            cat > backend/.env <<EOF
PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://mongo:27017/food_delivery
JWT_SECRET=change-this
EOF
          fi
        '''
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

    stage('Deploy') {
      steps {
        sh '''
          set -e
          docker compose -f "$COMPOSE_FILE" up -d
          docker compose -f "$COMPOSE_FILE" ps
        '''
      }
    }

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
