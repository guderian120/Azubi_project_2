#!/bin/bash
BASTION_HOST="34.244.3.44"
JENKINS_HOST="10.0.2.90"
JENKINS_PORT="8080"
KEY_PATH="~/Downloads/Jenkins_bastion_host.pem"
BASTION_USER="ubuntu"

echo "Setting up SSH tunnel to Jenkins..."
echo "Local access: http://localhost:${JENKINS_PORT}"

ssh -i "${KEY_PATH}" \
    -L ${JENKINS_PORT}:${JENKINS_HOST}:${JENKINS_PORT} \
    -N \
    ${BASTION_USER}@${BASTION_HOST}