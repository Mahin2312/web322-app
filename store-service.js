const Sequelize = require("sequelize");

// Setup Sequelize with PostgreSQL connection
const sequelize = new Sequelize("SenecaDB", "SenecaDB_owner", "PKseAY50aIWm", {
    host: "ep-frosty-hill-a5jcpw0l-pooler.us-east-2.aws.neon.tech",
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false },
    },
    query: { raw: true },
});

// Define the "Category" model
const Category = sequelize.define('Category', {
    category: Sequelize.STRING,
});

// Define the "Item" model
const Item = sequelize.define('Item', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
    price: Sequelize.DOUBLE,
});

// Define the relationship: An Item belongs to a Category
Item.belongsTo(Category, { foreignKey: 'category' });

// Initialize Sequelize connection and sync models with DB
function initialize() {
    return new Promise((resolve, reject) => {
        sequelize.sync()
            .then(() => resolve("Database synced successfully"))
            .catch((err) => reject("Unable to sync the database: " + err.message));
    });
}

// Get all items
function getAllItems() {
    return new Promise((resolve, reject) => {
        Item.findAll()
            .then((items) => {
                if (items.length === 0) {
                    reject("No results returned");
                } else {
                    resolve(items);
                }
            })
            .catch((err) => reject("Error retrieving items: " + err.message));
    });
}

// Get items by category
function getItemsByCategory(categoryId) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: { category: categoryId }
        })
            .then((items) => {
                if (items.length === 0) {
                    reject("No results returned");
                } else {
                    resolve(items);
                }
            })
            .catch((err) => reject("Error retrieving items by category: " + err.message));
    });
}

// Get items by minimum post date
function getItemsByMinDate(minDateStr) {
    const { gte } = Sequelize.Op;
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                postDate: {
                    [gte]: new Date(minDateStr)
                }
            }
        })
            .then((items) => {
                if (items.length === 0) {
                    reject("No results returned");
                } else {
                    resolve(items);
                }
            })
            .catch((err) => reject("Error retrieving items by date: " + err.message));
    });
}

// Get item by id
function getItemById(itemId) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: { id: itemId }
        })
            .then((data) => {
                if (data.length === 0) {
                    reject("No results returned");
                } else {
                    resolve(data[0]); // Return only the first result (item)
                }
            })
            .catch((err) => reject("Error retrieving item by ID: " + err.message));
    });
}

// Add a new item
function addItem(itemData) {
    return new Promise((resolve, reject) => {
        // Ensure that published is set to true or false
        itemData.published = itemData.published ? true : false;

        // Replace blank fields with null
        for (let key in itemData) {
            if (itemData[key] === "") {
                itemData[key] = null;
            }
        }

        // Set postDate to current date
        itemData.postDate = new Date();

        Item.create(itemData)
            .then(() => resolve("Item created successfully"))
            .catch((err) => reject("Unable to create item: " + err.message));
    });
}

// Get all published items
function getPublishedItems() {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: { published: true }
        })
            .then((items) => {
                if (items.length === 0) {
                    reject("No results returned");
                } else {
                    resolve(items);
                }
            })
            .catch((err) => reject("Error retrieving published items: " + err.message));
    });
}

// Get published items by category
function getPublishedItemsByCategory(categoryId) {
    return new Promise((resolve, reject) => {
        Item.findAll({
            where: {
                published: true,
                category: categoryId
            }
        })
            .then((items) => {
                if (items.length === 0) {
                    reject("No results returned");
                } else {
                    resolve(items);
                }
            })
            .catch((err) => reject("Error retrieving published items by category: " + err.message));
    });
}

// Get all categories
function getAllCategories() {
    return new Promise((resolve, reject) => {
        Category.findAll()
            .then((categories) => {
                if (categories.length === 0) {
                    reject("No results returned");
                } else {
                    resolve(categories);
                }
            })
            .catch((err) => reject("Error retrieving categories: " + err.message));
    });
}

// Add a new category
function addCategory(categoryData) {
    return new Promise((resolve, reject) => {
        // Replace blank fields with null
        for (let key in categoryData) {
            if (categoryData[key] === "") {
                categoryData[key] = null;
            }
        }

        Category.create(categoryData)
            .then(() => resolve("Category created successfully"))
            .catch((err) => reject("Unable to create category: " + err.message));
    });
}

// Delete a category by ID
function deleteCategoryById(id) {
    return new Promise((resolve, reject) => {
        Category.destroy({
            where: { id: id }
        })
            .then((rowsDeleted) => {
                if (rowsDeleted > 0) {
                    resolve("Category deleted successfully");
                } else {
                    reject("No category found with the specified ID");
                }
            })
            .catch((err) => reject("Unable to delete category: " + err.message));
    });
}


// Delete an item by ID
function deletePostById(id) {
    return new Promise((resolve, reject) => {
        Item.destroy({
            where: { id: id }
        })
            .then((rowsDeleted) => {
                if (rowsDeleted > 0) {
                    resolve("Item deleted successfully");
                } else {
                    reject("No item found with the specified ID");
                }
            })
            .catch((err) => reject("Unable to delete item: " + err.message));
    });
}

module.exports = {
    initialize,
    getAllItems,
    getItemsByCategory,
    getItemsByMinDate,
    getItemById,
    addItem,
    getPublishedItems,
    getPublishedItemsByCategory,
    getAllCategories,
    addCategory,           // Newly added function
    deleteCategoryById,    // Newly added function
    deletePostById         // Newly added function
};

