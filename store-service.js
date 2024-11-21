const fs = require("fs");


let items;
let categories;

fs.readFile("./data/items.json", "utf8", (err, jsonString) => {
    if (err) {
        console.log("File read error:", err);
        return;
    }
    // console.log("File data:", jsonString);
});

module.exports.initialize = function () {
    return new Promise((resolve, reject) => {
        fs.readFile("./data/items.json", "utf8", (err, jsonString) => {
            if (err) {
                console.log("File read error:", err);
                reject("Unable to read item file");
                return;
            }
            items = JSON.parse(jsonString);

            // Continue to read categories
            fs.readFile("./data/categories.json", "utf8", (err, jsonString) => {
                if (err) {
                    console.log("File read error:", err);
                    reject("Unable to read category file");
                    return;
                }
                categories = JSON.parse(jsonString);
            });
            resolve();
        });
    });
};

module.exports.getAllItems = function () {
    // console.log("items.length is", items.length);
    return new Promise((resolve, reject) => {
        console.log("RETURNING OBJ OF LENGTH", items.length);
        items.length != 0 ? resolve(items) : reject("Items array is empty!");
    });
};

module.exports.getAllCategories = function () {
    // return categories;
    return new Promise((resolve, reject) => {
        categories.length != 0
            ? resolve(categories)
            : reject("Categories array is empty!");
    });
};

module.exports.getPublishedItems = function () {
    // return items.filter((item) => (item.published = true));
    return new Promise((resolve, reject) => {
        items.length != 0
            ? resolve(items.filter((item) => item.published == true))
            : reject("No published items found!");
    });
};

// new stuff
module.exports.addItem = function (itemData) {
    return new Promise((resolve, reject) => {
        itemData.published = itemData.published === "true";
        itemData.id = items.length + 1 ; // Use a unique ID based on timestamp
        itemData.postDate = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD
        items.push(itemData);
        resolve(itemData);
    });
};

module.exports.getItemsByCategory = function (category) {
    return new Promise((resolve, reject) => {
        items.length != 0
            ? resolve(items.filter((item) => item.category == category))
            : reject("No items with category", category);
    });
};

module.exports.getItemsByMinDate = function (minDateStr) {
    const minDate = new Date(minDateStr);
    let postDateItems = [];

    return new Promise((resolve, reject) => {
        if (items.length) {
            for (item of items) {
                const itemDate = new Date(item.postDate);
                if (itemDate >= minDate) postDateItems.push(item);
            }
            postDateItems.length > 0
                ? resolve(postDateItems)
                : reject("No items with minDate", minDateStr);
        }
        reject("Unknown Error on retrieving items by minDate");
    });
};

module.exports.getItemById = function (itemId) {
    return new Promise((resolve, reject) => {
        const itemMatch = items.find((item) => item.id == itemId);
        itemMatch ? resolve(itemMatch) : reject("No item of id", itemId);
    });
};

//Assignment 4
// In store-service.js
async function getPublishedItemsByCategory(category) {
    try {
      // Assuming items are stored in a database or similar, filter by published status and category
      const items = await db.collection('items').find({
        published: true,
        category: category
      }).toArray();
  
      return items; // Return filtered items
    } catch (error) {
      console.error('Error fetching items by category:', error);
      throw error;
    }
  }
  