# Require
- Install Nodejs version from 8.x
- Install mongodb
- Install PM2 (production) or Nodemon(development) to manage project
- For online database, you can create your own Database, after creating your database replace connect string in .env file with your own mongo database ('MONGODB_URL'), or use the one that i've already registered in .env
- [We 'NO LONGER NEED' Cloudinary Service and get its ('CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET')] INSTEAD USE S3.
- Register S3 to get its 'accessKeyId', 'secretAccessKey' and 'bucket' (name) and paste into .env
- Configure Bucket Policy and Cors Configuration as example in 'bucketPolicy.json' and 'corsConfiguration.xml'
# How to use
- After copying this folder
- Go into this folder and open command line
- type 'npm install' to install all the node_modules package it need
- type 'sudo npm install --global pm2' or 'sudo npm install --global nodemon'
- You can redefined both 'JWT_SECRET' in .env
# Script
- By default it will run on port 8000
- Type 'npm run dev' to operate this project in development mode (Nodemon), or you can:
- Use PM2 to run in manage task: 
- Type 'pm2 start app.js --name Chat-Whisper' if you want to run in 'fork' mode
- Type 'pm2 start app.js --name Chat-Whisper -i 0' if you want to run in 'cluster' mode (use as much as CPU Threads to create children).
# Database
- Already configured in BE-HR-Manager