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

## Part 1: Run Jenkins Locally (Docker)

Since you want to run Jenkins on your own computer but deploy to the EC2 server, we will run Jenkins in a Docker container locally.

1.  **Open your Terminal/PowerShell** on your local machine.
2.  **Run Jenkins** with the "SSH Agent" plugin support:
    ```bash
    docker run -d -p 8080:8080 -p 50000:50000 --name jenkins-local --restart=on-failure -v jenkins_home:/var/jenkins_home jenkins/jenkins:lts-jdk17
    ```
3.  **Unlock Jenkins**:
    ```bash
    docker exec jenkins-local cat /var/jenkins_home/secrets/initialAdminPassword
    ```
    *Copy this password and go to `http://localhost:8080` to finish setup.*

4.  **Install Plugins**:
    -   Select "Install Suggested Plugins".
    -   **Important**: Go to Manage Jenkins -> Plugins -> Available. Search for and install **"SSH Agent"** plugin.

---

## Part 2: Connect Jenkins to GitHub (Local)

1.  Create a **New Item** -> **Pipeline** -> Name it "FoodDelivery".
2.  **Pipeline Definition**: "Pipeline script from SCM".
3.  **SCM**: Git.
4.  **Repository URL**: `https://github.com/JanithHisara/Food-delivery-system`.
5.  **Branch**: `*/main`.

*Note: Since Jenkins is running locally, GitHub cannot send "Webhooks" to you unless you use a tool like ngrok. For now, you can just click "Build Now" manually when you push code.*

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

#### B. Secrets (Removed)
*Mongo URI and JWT Secret are now handled automatically.*


#### C. EC2 SSH Key (For Remote Deployment)
- **Kind**: SSH Username with private key
- **Scope**: Global
- **ID**: `ec2-ssh-key`
- **Username**: `ubuntu`
- **Private Key**: Paste content of your `deployer-key.pem`.

#### D. EC2 IP Address
- **Kind**: Secret text
- **Scope**: Global
- **Secret**: The Public IP of your EC2 instance (e.g., `3.219.216.177`)
- **ID**: `ec2-ip`
- **Description**: Public IP of EC2

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
