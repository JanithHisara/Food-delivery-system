variable "region" {
  description = "AWS Region to deploy to"
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 Instance Type"
  default     = "t3.small"
}

variable "key_name" {
  description = "Name of the SSH key pair to use"
  default     = "deployer-key" 
}
