/*********************************************************************************
WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Rashna Nova
Student ID: 119726206
Date: 30th October 2024
Glitch Web App URL: https://tree-eager-lead.glitch.me/
GitHub Repository URL: https://github.com/RashnaNova20/web322-app
********************************************************************************/


const express = require('express');
const path = require('path');
const bodyParser = require('body-parser'); // For parsing application/x-www-form-urlencoded
const storeService = require('./store-service.js'); // Ensure this path is correct
const multer = require("multer");
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = 8080;

// Cloudinary configuration
cloudinary.config({
    cloud_name: 'dzvxktskq', // Replace with your Cloud Name
    api_key: '722172669185738', // Replace with your API Key
    api_secret: 'xeZJV6lxQi7gli6c0P5ZhubeZZg', // Replace with your API Secret
    secure: true
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true })); // For form submissions
app.use(express.json()); // For parsing application/json
app.use(express.static('public')); // Serve static files (like CSS)

// Redirect root to /about
app.get('/', (req, res) => {
    res.redirect('/about');
});

// Serve the about page
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

// Define the /shop route
app.get('/shop', (req, res) => {
    storeService.getPublishedItems()
        .then((data) => {
            res.json(data); // Return the data as JSON
        })
        .catch((err) => {
            res.status(500).json({ message: err }); // Return error message
        });
});

// Define the /categories route
app.get('/categories', (req, res) => {
    storeService.getCategories()
        .then((data) => {
            res.json(data); // Return the categories as JSON
        })
        .catch((err) => {
            res.status(500).json({ message: err }); // Return error message
        });
});

// Define the /shop/category/:id route
app.get('/shop/category/:id', (req, res) => {
    const categoryId = parseInt(req.params.id, 10);
    storeService.getItemsByCategory(categoryId)
        .then((data) => {
            res.json(data); // Return items for the category as JSON
        })
        .catch((err) => {
            res.status(500).json({ message: err }); // Return error message
        });
});

// Define the /items route to get all items
app.get('/items', (req, res) => {
    storeService.getAllItems()
        .then((data) => {
            res.json(data); // Return items as JSON
        })
        .catch((err) => {
            res.status(500).send("Unable to retrieve items.");
        });
});
app.get('/items', (req, res) => {
    if (req.query.category) {
        storeService.getItemsByCategory(req.query.category)
            .then((items) => res.json(items))
            .catch((err) => res.status(500).send("Unable to get items by category"));
    } else if (req.query.minDate) {
        storeService.getItemsByMinDate(req.query.minDate)
            .then((items) => res.json(items))
            .catch((err) => res.status(500).send("Unable to get items by minimum date"));
    } else {
        storeService.getAllItems()
            .then((items) => res.json(items))
            .catch((err) => res.status(500).send("Unable to get all items"));
    }
  });
  app.get('/item/:value', (req, res) => {
    const itemId = req.params.value;
    
    storeService.getItemById(itemId)
        .then((item) => res.json(item))
        .catch((err) => res.status(500).send("Item not found"));
  });


app.get('/items/add', (req, res) => {
    res.sendFile(path.join(__dirname,'/views/addItem.html'));
});

// Configure multer for file uploads
const upload = multer(); // no { storage: storage } since we are not using disk storage

// Handle POST request to add a new item
app.post('/items/add', upload.single("featureImage"), (req, res) => {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            return result;
        }

        upload(req).then((uploaded) => {
            processItem(uploaded.url);
        }).catch(err => {
            console.error("Upload Error: ", err);
            res.status(500).send("Failed to upload image.");
        });
    } else {
        processItem(""); // Handle case where no file is uploaded
    }

    function processItem(imageUrl) {
        const { itemName, itemDescription, itemPrice } = req.body;

        // Validate incoming data
        if (!itemName || !itemDescription || !itemPrice) {
            return res.status(400).send('All fields are required!');
        }

    

        // Create a new item object
        const newItem = {
            name: itemName,
            description: itemDescription,
            price: parseFloat(itemPrice),
            image: imageUrl // Use the uploaded image URL
        };

        // Use the storeService to add the new item
        storeService.addItem(newItem)
            .then(() => {
                res.redirect('/items'); // Redirect after successful addition
            })
            .catch((err) => {
                res.status(500).send("Unable to add item.");
            });
    }
});

// Handle 404 for unmatched routes
app.use((req, res) => {
    res.status(404).send('Page Not Found');
});

// Initialize the data
storeService.initialize()
    .then(() => {
        // Start the server
        app.listen(PORT, () => {
            console.log(`Express http server listening on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error("Failed to initialize data:", err);
    });