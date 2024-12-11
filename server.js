/*********************************************************************************
WEB322 – Assignment 06
I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: Mahin Ibne Alam 
Student ID: 124384231
Date: 6th December 2024
Glitch Web App URL: https://rainy-immense-stream.glitch.me
GitHub Repository URL: https://github.com/Mahin2312/web322-app
********************************************************************************/ 

const express = require("express");
const multer = require("multer");
const { engine } = require("express-handlebars");
const handlebars = require("handlebars");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const authData = require("./auth-service");
const clientSessions = require("client-sessions");


const path = require("path");
const storeService = require("./store-service.js");
const itemData = require("./store-service");
const app = express();
const upload = multer();
app.use(express.urlencoded({ extended: true })); 

const HTTP_PORT = process.env.PORT || 8080;

cloudinary.config({
	cloud_name: "dztxskdqx",
	api_key: "332845393462947",
	api_secret: "G9Zf3CH1guowKInJWcVPZbQXU7I",
	secure: true,
});
// Configure clientSessions middleware here
app.use(clientSessions({
    cookieName: "session", // Cookie name (e.g., session)
    secret: "mySecretKey12345", // A random string for signing the cookie
    duration: 24 * 60 * 60 * 1000, // Duration of the session in milliseconds (1 day)
    activeDuration: 1000 * 60 * 5 // Extend session by 5 minutes if active
}));
app.use(function (req, res, next) {
    res.locals.session = req.session;
    next();
});
function ensureLogin(req, res, next) {
	if (!req.session.user) {
	  res.redirect('/login');
	} else {
	  next();
	}
  }
//new routes
// GET /login
app.get("/login", (req, res) => {
    res.render("login");
});

// GET /register
app.get("/register", (req, res) => {
    res.render("register");
});

// POST /register
app.post("/register", (req, res) => {
    authData.registerUser(req.body)
        .then(() => {
            res.render("register", { successMessage: "User created" });
        })
        .catch((err) => {
            res.render("register", { errorMessage: err, userName: req.body.userName });
        });
});

// POST /login
app.post("/login", (req, res) => {
    req.body.userAgent = req.get('User-Agent'); // Set the user-agent
    authData.checkUser(req.body)
        .then((user) => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            };
            res.redirect("/items");
        })
        .catch((err) => {
            res.render("login", { errorMessage: err, userName: req.body.userName });
        });
});

// GET /logout
app.get("/logout", (req, res) => {
    req.session.reset(); // Reset the session
    res.redirect("/");
});

// GET /userHistory (Protected by ensureLogin)
app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory");
});
//new routes added

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
		// formatDate helper
		formatDate: function (dateObj) {
			let year = dateObj.getFullYear();
			let month = (dateObj.getMonth() + 1).toString();
			let day = dateObj.getDate().toString();
			return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
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


// Route for displaying the "Add Post" page
app.get("/items/add", ensureLogin,(req, res) => {
    // Call to get all categories
    storeService.getAllCategories()
        .then((categories) => {
			res.render("addPost", { categories: categories });
        })
        .catch((err) => {
            // If there's an error, render the page with an empty array for categories
            console.error("Error fetching categories:", err);
            res.render("addPost", { categories: [] });
        });
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
//
app.get("/items",ensureLogin, (req, res) => {
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
		if (items.length > 0) {
		  res.render("items", { items });
		} else {
		  res.render("items", { message: "no results" });
		}
	  })
	  .catch(() => {
		res.render("items", { message: "no results" });
	  });
  });
  
 
  app.get('/categories',ensureLogin, (req, res) => {
    storeService.getAllCategories()
        .then((categories) => {
            // Pass the categories data to the view
            res.render('categories', { categories: categories });
        })
        .catch((err) => {
            res.render('categories', { message: "Error retrieving categories: " + err });
        });
});

//
// GET: Render Add Category Form
app.get("/categories/add",ensureLogin, (req, res) => {
    res.render("addCategory"); 
});

// POST: Handle Add Category Form Submission
app.post("/categories/add",ensureLogin, (req, res) => {
    storeService.addCategory(req.body)
        .then(() => {
            res.redirect("/categories"); // Redirect to /categories on success
        })
        .catch((err) => {
            res.status(500).send("Unable to Add Category: " + err);
        });
});

// GET: Delete Category by ID
app.get("/categories/delete/:id",ensureLogin, (req, res) => {
    storeService.deleteCategoryById(req.params.id)
        .then(() => {
            res.redirect("/categories"); // Redirect to /categories on success
        })
        .catch((err) => {
            res.status(500).send("Unable to Remove Category / Category not found: " + err);
        });
});
app.post("/items/add",ensureLogin, upload.single("featureImage"), (req, res) => {
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
// GET: Delete Item by ID
app.get("/Items/delete/:id",ensureLogin, (req, res) => {
    const itemId = req.params.id;

    storeService.deletePostById(itemId)
        .then(() => {
            // If the deletion is successful, redirect back to the /items view
            res.redirect("/items");
        })
        .catch((err) => {
            // If there's an error, send a 500 status with an error message
            res.status(500).send("Unable to Remove Post / Post not found");
        });
});



app.get("/items/:id",ensureLogin, (req, res) => {
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

app.use((req, res, next) => {
	res.status(404).send("404 - Page Not Found");
});

storeService.initialize()
.then(authData.initialize)
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
	  