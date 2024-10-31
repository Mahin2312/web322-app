/*********************************************************************************
WEB322 – Assignment 03
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Mahin Ibne Alam 
Student ID: 124384231
Date: 31st October 2024
Glitch Web App URL: https://rainy-immense-stream.glitch.me
GitHub Repository URL: https://github.com/Mahin2312/web322-app
********************************************************************************/ 

const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

const path = require("path");
const storeService = require("./store-service.js");
const app = express();
const upload = multer();

const HTTP_PORT = process.env.PORT || 8080;

// Cloudinary config
cloudinary.config({
	cloud_name: "dztxskdqx",
	api_key: "332845393462947",
	api_secret: "G9Zf3CH1guowKInJWcVPZbQXU7I",
	secure: true,
});

// Middleware
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public"));

// ROUTES

// Default Redirect
app.get("/", (req, res) => {
	// res.sendFile(path.join(__dirname, "/views/about.html"));
	res.redirect("/about");
});

// About page
app.get("/about", (req, res) => {
	res.sendFile(path.join(__dirname, "/views/about.html"));
});

// Add Items page
app.get("/items/add", (req, res) => {
	res.sendFile(path.join(__dirname, "/views/addItem.html"));
});

// Additional Routes
app.get("/shop", (req, res) => {
	// res.send(JSON.stringify(storeService.getPublishedItems()));
	storeService
		.getPublishedItems()
		.then((items) => {
			res.send(JSON.stringify(items));
		})
		.catch((err) => {
			console.log("Error:", err);
		});
});

app.get("/items", (req, res) => {
	const category = req.query.category;
	const minDate = req.query.minDate;

	if (category) {
		storeService
			.getItemsByCategory(category)
			.then((items) => {
				res.send(JSON.stringify(items));
			})
			.catch((err) => {
				console.log("Error retrieving items by category:", category);
			});
	} else if (minDate) {
		storeService
			.getItemsByMinDate(minDate)
			.then((items) => {
				res.send(JSON.stringify(items));
			})
			.catch((err) => {
				console.log("Error retrieving items by post date:", minDate);
			});
	} else {
		// res.send(JSON.stringify(storeService.getAllItems()));
		storeService
			.getAllItems()
			.then((items) => {
				// console.log(items);
				res.send(JSON.stringify(items));
			})
			.catch((err) => {
				console.log("Error:", err);
			});
	}
});

app.get("/items/:id", (req, res) => {
	const itemId = req.params.id;
	storeService
		.getItemById(itemId)
		.then((item) => {
			res.send(JSON.stringify(item));
		})
		.catch((err) => {
			console.log("Error while getting item by id:", itemId);
			console.log("Info:", err);
		});
});

app.get("/categories", (req, res) => {
	// res.send(JSON.stringify(storeService.getAllCategories()));
	storeService
		.getAllCategories()
		.then((categories) => {
			// console.log(categories);
			res.send(JSON.stringify(categories));
		})
		.catch((err) => {
			console.log("Error:", err);
		});
});

// Post paths
app.post("/items/add", upload.single("featureImage"), (req, res) => {
	if (req.file) {
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

		// TODO: Process the req.body and add it as a new Item before redirecting to /items
		storeService
			.addItem(req.body)
			.then(() => {
				res.redirect("/items");
			})
			.catch(() => {
				// error msg
				console.log("Error:", err);
				res.status(500);
			});
	}
});

// Unknown path
app.use((req, res, next) => {
	res.status(404).send("404 - Page Not Found");
});

storeService
	.initialize()
	.then(() => {
		app.listen(HTTP_PORT, () => {
			console.log(`Express http server listening on ${HTTP_PORT}`);
		});
	})
	.catch((err) => {
		console.log("ERROR ON SERVER BOOT:", err);
	});
