FROM jenkins/jenkins:lts-jdk17

USER root

# Install Docker CLI
RUN apt-get update && \
    apt-get install -y ca-certificates curl gnupg && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
    $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce-cli

# Add jenkins user to docker group (optional, but good practice if group exists)
# Note: The group id of docker on host needs to match group id inside container for socket access without sudo,
# but usually mounting socket and running as root or setting permissions on host is easier for dev.
# We will stick to running as jenkins user but we might need to adjust socket permissions on host or run as root if that fails.
# For now, let's keep it simple and just install the CLI.

USER jenkins
