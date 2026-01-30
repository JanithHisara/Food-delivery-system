# CI/CD Pipeline & Website Connection Instructions

This guide explains how to set up your server, configure Jenkins, and connect your domain name to your deployed application.

## Prerequisites

- A Virtual Private Server (VPS) - e.g., AWS EC2, DigitalOcean Droplet, Linode.
- A Domain Name (purchased from GoDaddy, Namecheap, etc.).
- GitHub Repository with this code.

---

## Part 0: Provision Infrastructure (Optional)

If you don't have a VPS yet, you can use the included Terraform scripts to create one on AWS.

1.  **Install Terraform** and **AWS CLI**.
2.  Configure AWS CLI: `aws configure` (entering your Access Key and Secret Key).
3.  Create an SSH Key Pair in AWS Console named `deployer-key` (or update `terraform/variables.tf`).
4.  Run the script:
    ```bash
    cd terraform
    terraform init
    terraform apply
    ```
5.  Type `yes` to confirm.
6.  It will output your **Public IP**. Use this IP for the next steps!

---

## Part 1: Server Setup (One-time)

SSH into your VPS (`ssh -i key.pem ubuntu@<YOUR_Public_IP>`) and run the following commands to install Docker and Jenkins.

*Note: If you used the Terraform script, Docker is ALREADY INSTALLED thanks to the user_data script! You only need to check it and install Jenkins.*

### 1. Install Docker & Docker Compose
*(Skip this if you used Terraform)*
```bash
# Update packages
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository to Apt sources
echo \
  "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  \"$(. /etc/os-release && echo "$VERSION_CODENAME")\" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Allow current user to run docker commands (so you don't need sudo)
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Install Jenkins
You can either install Jenkins on the host or run it as a Docker container. Running it on the host is often simpler for accessing the host's Docker socket.

```bash
# Install Java (Jenkins dependency)
sudo apt-get install -y fontconfig openjdk-17-jre

# Install Jenkins
sudo wget -O /usr/share/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc]" \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt-get update
sudo apt-get install -y jenkins

# Start Jenkins
sudo systemctl enable jenkins
sudo systemctl start jenkins

# Give Jenkins user permission to use Docker
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### 3. Unlock Jenkins
1. Open your browser and go to `http://<YOUR_SERVER_IP>:8080`.
2. Get the initial password:
   ```bash
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   ```
3. Install "Suggested Plugins".
4. Create your Admin user.

---

## Part 2: Connect Jenkins to GitHub

### 1. Create a Pipeline Job
1. In Jenkins Dashboard -> **New Item**.
2. Enter a name (e.g., "FoodDelivery App") and select **Pipeline**. Click OK.
3. Scroll to **Pipeline** section.
4. Definition: **Pipeline script from SCM**.
5. SCM: **Git**.
6. Repository URL: `https://github.com/YourUsername/YourRepo.git`.
7. Branch Specifier: `*/main`.
8. Script Path: `Jenkinsfile`.
9. Click **Save**.

### 2. Configure Webhook (Auto-deploy on push)
1. Go to your GitHub Repository -> **Settings** -> **Webhooks** -> **Add webhook**.
2. Payload URL: `http://<YOUR_SERVER_IP>:8080/github-webhook/` (Don't forget the trailing slash!).
3. Content type: `application/json`.
4. Which events?: **Just the push event**.
5. Click **Add webhook**.

### 3. Configure Credentials (Essential for Security)

You must add these credentials in Jenkins for the pipeline to work.

**Go to:** Jenkins Dashboard -> **Manage Jenkins** -> **Credentials** -> **System** -> **Global credentials (unrestricted)** -> **+ Add Credentials**.

#### A. Docker Hub Login (Required)
- **Kind**: Username with password
- **Scope**: Global
- **Username**: Your Docker Hub username
- **Password**: Your Docker Hub password (or Access Token)
- **ID**: `docker-hub-login`
- **Description**: Docker Hub Credentials

#### B. Secrets (Mongo URI & JWT)
- **Kind**: Secret text
- **Scope**: Global
- **Secret**: `mongodb://mongo:27017/food_delivery` (or your Atlas URI)
- **ID**: `mongo-uri`
- **Description**: Production Mongo URI
---
- **Kind**: Secret text
- **Scope**: Global
- **Secret**: `your-super-secure-secret-key-12345`
- **ID**: `jwt-secret`
- **Description**: JWT Secret Key

#### C. EC2 SSH Key (Optional - for Remote Deployment)
If you want to deploy to a *different* server than where Jenkins is running:
- **Kind**: SSH Username with private key
- **Scope**: Global
- **ID**: `ec2-ssh-key`
- **Username**: `ubuntu` (or `ec2-user` depending on OS)
- **Private Key**: Select "Enter directly" and paste your `.pem` key content.

---

## Part 3: Connect Your Website (Domain)

Now that your app is deployed on port 80 (HTTP), you need to point your domain to the server.

### 1. Configure DNS (Domain Registrar)
Go to where you bought your domain (Godaddy, Namecheap, etc.) and find "DNS Management".

Add an **A Record**:
- **Type**: A
- **Name/Host**: @ (or `www` if you prefer connection at www.example.com)
- **Value/Points to**: `<YOUR_SERVER_IP>` (e.g., 123.45.67.89)
- **TTL**: Lowest possible (e.g., 60 seconds or Automatic)

*Wait a few minutes (up to 24h) for DNS propagation.*

### 2. Update Environment Variables (Optional but Recommended)
In your `Jenkinsfile`, you might want to switch credentials to use Jenkins Secrets instead of hardcoding them.

*Note: This step is now covered in "Configure Credentials" above.*

---

## Troubleshooting

**Viewing Logs**:
```bash
# View backend logs
docker compose -f docker-compose.prod.yml logs -f backend

# View frontend logs (Nginx)
docker compose -f docker-compose.prod.yml logs -f frontend
```

**Restarting Manually**:
```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```
