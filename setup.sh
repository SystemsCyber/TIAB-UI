#!/bin/bash
# Update 0.1v

# Define paths
FLASK_APP_DIR="flask-app"
REACT_APP_DIR="react-ui-app"
CONFIG_FILE="$REACT_APP_DIR/src/conf/constants.js"

# Define Flask environment variables
FLASK_PORT=5000

# Get the host machine IP address
HOST_IP=$(hostname -I | awk '{print $1}')  # This gets the first network IP (IPv4)

# Function to install dependencies
install_dependencies() {
    echo "Installing necessary packages..."

    # Install necessary system packages
    sudo apt-get update
    sudo apt-get install -y python3 python3-venv python3-pip curl npm

    # Flask App setup
    echo "Setting up Flask app..."
    cd $FLASK_APP_DIR
    python3 -m venv venv  # Create a virtual environment
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
    cd ..

    # React App setup
    echo "Setting up React app..."
    cd $REACT_APP_DIR
    npm install  # Install npm dependencies
    cd ..

    echo "Dependencies installed successfully."
}

# Function to set the API_BASE_URL in React config.js
configure_react_app() {
    echo "Configuring React app..."

    # Replace the API_BASE_URL with the host's IP address
    sed -i "s|http://.*:5000|http://$HOST_IP:$FLASK_PORT|g" $CONFIG_FILE

    echo "React app configuration updated with HOST IP: $HOST_IP"
}

# Function to start the applications
start_apps() {
    echo "Starting Flask app..."

    # Start Flask app
    cd $FLASK_APP_DIR
    source venv/bin/activate
    FLASK_APP=app.py flask run --host=0.0.0.0 --port=$FLASK_PORT &
    FLASK_PID=$!
    echo "Flask PID-> $FLASK_PID" 
    echo $FLASK_PID > flask_app.pid
    # Check if Flask started successfully
    if ps -p $FLASK_PID > /dev/null
    then
        echo "Flask app started successfully with PID $FLASK_PID"
        echo $FLASK_PID > flask_app.pid
    else
        echo "Failed to start Flask app."
    fi
    deactivate
    cd ..

    echo "Starting React app..."

    # Start React app
    cd $REACT_APP_DIR
    npm start &
    REACT_PID=$!
    echo $REACT_PID > react_app.pid
    cd ..

    echo "Flask and React apps started."
}

# Function to stop the applications
stop_apps() {
    echo "Stopping Flask app..."
    cd $FLASK_APP_DIR
    if [ -f flask_app.pid ]; then
        FLASK_PID=$(cat flask_app.pid)
        kill -9 $FLASK_PID
        rm flask_app.pid
        echo "Flask app stopped."
    else
        echo "Flask app is not running."
    fi
    cd ..
    cd $REACT_APP_DIR
    echo "Stopping React app..."
    if [ -f react_app.pid ]; then
        REACT_PID=$(cat react_app.pid)
        kill -9 $REACT_PID
        rm react_app.pid
        echo "React app stopped."
    else
        echo "React app is not running."
    fi
    cd ..
}

# Function to check the status of the applications
check_status() {
    echo "Checking Flask app status..."
    cd $FLASK_APP_DIR

    if [ -f flask_app.pid ]; then
        FLASK_PID=$(cat flask_app.pid)
        if ps -p $FLASK_PID > /dev/null; then
            echo "Flask app is running (PID: $FLASK_PID)."
        else
            echo "Flask app is not running."
        fi
    else
        echo "Flask app is not running."
    fi
    cd ..
    echo "Checking React app status..."
    cd $REACT_APP_DIR
    if [ -f react_app.pid ]; then
        REACT_PID=$(cat react_app.pid)
        if ps -p $REACT_PID > /dev/null; then
            echo "React app is running (PID: $REACT_PID)."
        else
            echo "React app is not running."
        fi
    else
        echo "React app is not running."
    fi
    cd ..
}

# Function to update the code from the repository
update_code() {
    echo "Updating Flask app..."

    # Pull the latest changes for Flask app
    cd $FLASK_APP_DIR
    git pull origin master  # Assumes the default branch is master
    source venv/bin/activate
    pip install -r requirements.txt  # Reinstall any updated dependencies
    deactivate
    cd ..

    echo "Updating React app..."

    # Pull the latest changes for React app
    cd $REACT_APP_DIR
    git pull origin master  # Assumes the default branch is master
    npm install  # Reinstall any updated dependencies
    cd ..

    echo "Updating configuration..."
    configure_react_app  # Update the React config with the new host IP

    echo "Code updated successfully."
}

# Main script logic
case "$1" in
    install)
        install_dependencies
        configure_react_app
        ;;
    start)
        start_apps
        ;;
    stop)
        stop_apps
        ;;
    status)
        check_status
        ;;
    update)
        stop_apps  # Stop the apps before updating
        update_code
        start_apps  # Restart the apps after updating
        ;;
    *)
        echo "Usage: $0 {install|start|stop|status|update}"
        exit 1
        ;;
esac