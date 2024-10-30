/*********************************************************************************
WEB322 – Assignment 03
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Mahin Ibne Alam 
Student ID: 124384231
Date: 29th October 2024
Glitch Web App URL: https://economic-miniature-ferry.glitch.me
GitHub Repository URL: https://github.com/Mahin2312/web322-app
********************************************************************************/ 

const express = require('express');
const app = express();
const path = require('path');
const storeService = require('./store-service');
multer = require("multer");
cloudinary = require('cloudinary').v2;
streamifier = require('streamifier');

cloudinary.config({
    cloud_name: 'dztxskdqx',
    api_key: '332845393462947',
    api_secret: 'G9Zf3CH1guowKInJWcVPZbQXU7I',
    secure: true
});
const upload = multer(); // no { storage: storage } since we are not using disk storage




const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static('public'));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/about.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/about.html'));
});

// Route for published items
app.get('/shop', (req, res) => {
    storeService.getPublishedItems().then((data) => {
        res.json(data);
    }).catch((err) => {
        res.status(500).send("Unable to retrieve published items.");
    });
});

// Route for all items
app.get('/items', (req, res) => {
    storeService.getAllItems().then((data) => {
        res.json(data);
    }).catch((err) => {
        res.status(500).send("Unable to retrieve items.");
    });
});

// Route for categories
app.get('/categories', (req, res) => {
    storeService.getCategories().then((data) => {
        res.json(data);
    }).catch((err) => {
        res.status(500).send("Unable to retrieve categories.");
    });
});

// Catch-all for unmatched routes
app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

storeService.initialize().then(() => {
    app.listen(HTTP_PORT, () => {
        console.log(`Server is running on port ${HTTP_PORT}`);
    });
}).catch((err) => {
    console.log('Unable to start server:', err);
});

app.post('/items/add', upload.single("featureImage"), (req, res) => {
    if(req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream((error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                });

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }

        upload(req).then((uploaded) => {
            processItem(uploaded.url);
        });
    } else {
        processItem("");
    }
    
    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;
        // TODO: Add logic to save the item to your data structure.
    }
});

