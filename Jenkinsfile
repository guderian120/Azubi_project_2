pipeline {
    agent any
    environment {
        DOCKER_BUILDKIT = '1'
        DOCKER_HUB_REPO = 'realamponsah/azubi_project_2'
    }
    stages {
        stage('Checkout and Detect Changes') {
            agent any
            steps {
                script {
                    // Checkout with full history for proper diffing
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: '*/main']],
                        extensions: [[$class: 'CloneOption', depth: 0, noTags: false, shallow: false]],
                        userRemoteConfigs: [[url: env.GIT_URL]]
                    ])
                    
                    // Detect changes in front-end and back-end directories
                    def changedFiles = []
                    def buildFrontend = false
                    def buildBackend = false
                    
                    // Get changed files based on event type
                    if (env.CHANGE_ID) { // Pull Request
                        def baseCommit = sh(script: 'git merge-base origin/main HEAD', returnStdout: true).trim()
                        changedFiles = sh(script: "git diff --name-only ${baseCommit} HEAD", returnStdout: true).trim().split('\n')
                    } else { // Push
                        def previousCommit = sh(script: 'git rev-parse HEAD~1', returnStdout: true).trim()
                        changedFiles = sh(script: "git diff --name-only ${previousCommit} HEAD", returnStdout: true).trim().split('\n')
                    }
                    
                    echo "Changed files: ${changedFiles.join(', ')}"
                    
                    // Check for frontend changes
                    buildFrontend = changedFiles.any { it.startsWith('front-end/') }
                    
                    // Check for backend changes
                    buildBackend = changedFiles.any { it.startsWith('back-end/') }
                    
                    echo "Build frontend: ${buildFrontend}"
                    echo "Build backend: ${buildBackend}"
                    
                    // Set environment variables for downstream stages
                    env.BUILD_FRONTEND = buildFrontend.toString()
                    env.BUILD_BACKEND = buildBackend.toString()
                }
            }
        }
        
        stage('Build and Push Docker Images') {
            agent any
            when {
                expression { 
                    return env.BUILD_FRONTEND == 'true' || env.BUILD_BACKEND == 'true' 
                }
            }
            stages {
                stage('Build Frontend') {
                    when {
                        expression { return env.BUILD_FRONTEND == 'true' }
                    }
                    steps {
                        script {
                            buildAndPushDockerImage('frontend', 'front-end', 'front-end/Dockerfile')
                        }
                    }
                }
                
                stage('Build Backend') {
                    when {
                        expression { return env.BUILD_BACKEND == 'true' }
                    }
                    steps {
                        script {
                            buildAndPushDockerImage('backend', 'back-end', 'back-end/Dockerfile')
                        }
                    }
                }
            }
        }
    }
}

def buildAndPushDockerImage(component, directory, dockerfile) {
    echo "Building ${component} from ${directory}"
    
    // Set up Docker Buildx (if available)
    sh 'docker buildx version || echo "Buildx not available, using regular docker build"'
    
    // Login to Docker Hub
    withCredentials([usernamePassword(
        credentialsId: 'docker-hub-credentials',
        usernameVariable: 'DOCKER_USERNAME',
        passwordVariable: 'DOCKER_PASSWORD'
    )]) {
        sh """
            echo \"${DOCKER_PASSWORD}\" | docker login -u \"${DOCKER_USERNAME}\" --password-stdin
        """
    }
    
    // Determine tag based on event type
    def tag
    if (env.CHANGE_ID) {
        tag = "pr-${env.CHANGE_ID}"
    } else {
        tag = env.GIT_COMMIT
    }
    
    echo "Building with tag: ${tag}"
    
    // Build the Docker image
    sh """
        cd ${directory}
        docker build -t ${env.DOCKER_HUB_REPO}-${component}:${tag} -f ${dockerfile} .
    """
    
    // Push the Docker image
    sh """
        docker push ${env.DOCKER_HUB_REPO}-${component}:${tag}
    """
    
    // For push events (not PRs), also tag as latest
    if (!env.CHANGE_ID) {
        sh """
            docker tag ${env.DOCKER_HUB_REPO}-${component}:${tag} ${env.DOCKER_HUB_REPO}-${component}:latest
            docker push ${env.DOCKER_HUB_REPO}-${component}:latest
        """
    }
}