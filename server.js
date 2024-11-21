/*********************************************************************************
WEB322 – Assignment 04
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Mahin Ibne Alam 
Student ID: 124384231
Date: 20th November 2024
Glitch Web App URL: https://rainy-immense-stream.glitch.me
GitHub Repository URL: https://github.com/Mahin2312/web322-app
********************************************************************************/ 

const express = require("express");
const multer = require("multer");
const { engine } = require("express-handlebars");
const handlebars = require("handlebars");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

const path = require("path");
const storeService = require("./store-service.js");
const itemData = require("./store-service");
const app = express();
const upload = multer();

const HTTP_PORT = process.env.PORT || 8080;

cloudinary.config({
	cloud_name: "dztxskdqx",
	api_key: "332845393462947",
	api_secret: "G9Zf3CH1guowKInJWcVPZbQXU7I",
	secure: true,
});

app.use(function (req, res, next) {
	let route = req.path.substring(1);
	app.locals.activeRoute =
	  "/" + (isNaN(route.split("/")[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
	app.locals.viewingCategory = req.query.category;
	next();
});

app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public"));

app.engine(
	".hbs",
	engine({
	  extname: ".hbs",
	  defaultLayout: "main",
	  helpers: {
		// SafeHTML helper
		safeHTML: function (htmlString) {
		  return new handlebars.SafeString(htmlString);
		},
  
		// navLink helper
		navLink: function (url, options) {
		  return (
			'<li class="nav-item"><a ' +
			(url == app.locals.activeRoute
			  ? 'class="nav-link active" '
			  : 'class="nav-link" ') +
			'href="' +
			url +
			'">' +
			options.fn(this) +
			"</a></li>"
		  );
		},
  
		// Equal helper
		equal: function (lvalue, rvalue, options) {
		  if (arguments.length < 3)
			throw new Error("Handlebars Helper equal needs 2 parameters");
		  return lvalue != rvalue
			? options.inverse(this)
			: options.fn(this);
		},
	  },
	})
  );
  
app.set("view engine", ".hbs");

app.get("/", (req, res) => {
	res.redirect("/shop");
  });
  

app.get("/about", (req, res) => {
    res.render("about");
});

app.get("/items/add", (req, res) => {
    res.render("addPost");
});

app.get("/shop", async (req, res) => {
	// Declare an object to store properties for the view
	let viewData = {};
  
	try {
	  // declare empty array to hold "item" objects
	  let items = [];
  
	  // if there's a "category" query, filter the returned items by category
	  if (req.query.category) {
		// Obtain the published "item" by category
		items = await itemData.getPublishedItemsByCategory(req.query.category);
	  } else {
		// Obtain the published "items"
		items = await itemData.getPublishedItems();
	  }
  
	  // sort the published items by itemDate
	  items.sort((a, b) => new Date(b.itemDate) - new Date(a.itemDate));
  
	  // get the latest item from the front of the list (element 0)
	  let item = items[0];
  
	  // store the "items" and "item" data in the viewData object (to be passed to the view)
	  viewData.items = items;
	  viewData.item = item;
	} catch (err) {
	  viewData.message = "no results";
	}
  
	try {
	  // Obtain the full list of "categories"
	  let categories = await itemData.getCategories();
  
	  // store the "categories" data in the viewData object (to be passed to the view)
	  viewData.categories = categories;
	} catch (err) {
	  viewData.categoriesMessage = "no results";
	}
  
	// render the "shop" view with all of the data (viewData)
	res.render("shop", { data: viewData });
  });

app.get("/items", (req, res) => {
	const category = req.query.category;
	const minDate = req.query.minDate;

	let itemPromise;

	if (category) {
		itemPromise = storeService.getItemsByCategory(category);
	} else if (minDate) {
		itemPromise = storeService.getItemsByMinDate(minDate);
	} else {
		itemPromise = storeService.getAllItems();
	}

	itemPromise
		.then((items) => {
			// Render the items view with items data
			res.render("items", { items: items });
		})
		.catch(() => {
			// Render the items view with a message if there's an error or no items
			res.render("items", { message: "no results" });
		});
});




app.get("/items/:id", (req, res) => {
	const itemId = req.params.id;
	storeService.getItemById(itemId)
		.then((item) => {
			res.send(JSON.stringify(item));
		})
		.catch((err) => {
			console.log("Error while getting item by id:", itemId);
		});
});
app.get('/shop/:id', async (req, res) => {

	// Declare an object to store properties for the view
	let viewData = {};
  
	try{
  
		// declare empty array to hold "item" objects
		let items = [];
  
		// if there's a "category" query, filter the returned items by category
		if(req.query.category){
			// Obtain the published "items" by category
			items = await itemData.getPublishedItemsByCategory(req.query.category);
		}else{
			// Obtain the published "items"
			items = await itemData.getPublishedItems();
		}
  
		// sort the published items by itemDate
		items.sort((a,b) => new Date(b.itemDate) - new Date(a.itemDate));
  
		// store the "items" and "item" data in the viewData object (to be passed to the view)
		viewData.items = items;
  
	}catch(err){
		viewData.message = "no results";
	}
  
	try{
		// Obtain the item by "id"
		viewData.item = await itemData.getItemById(req.params.id);
	}catch(err){
		viewData.message = "no results"; 
	}
  
	try{
		// Obtain the full list of "categories"
		let categories = await itemData.getCategories();
  
		// store the "categories" data in the viewData object (to be passed to the view)
		viewData.categories = categories;
	}catch(err){
		viewData.categoriesMessage = "no results"
	}
  
	// render the "shop" view with all of the data (viewData)
	res.render("shop", {data: viewData})
  });

app.get('/categories', (req, res) => {
    storeService.getAllCategories()
        .then((data) => {
            if (data.length > 0) {
                res.render('categories', { categories: data });
            } else {
                res.render('categories', { message: 'no results' });
            }
        })
        .catch((err) => {
            console.error(err);
            res.render('categories', { message: 'no results' });
        });
});


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


app.use((req, res, next) => {
	res.status(404).send("404 - Page Not Found");
});

storeService.initialize()
	.then(() => {
		app.listen(HTTP_PORT, () => {
			console.log(`Express http server listening on ${HTTP_PORT}`);
		});
	})
	.catch((err) => {
		console.log("ERROR ON SERVER BOOT:", err);
	});

	app.use((req, res) => {
		res.status(404).render("404");
	  });
	  