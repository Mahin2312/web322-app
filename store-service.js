const fs = require('fs');

let items = [];
let categories = [];

module.exports.initialize = function() {
    return new Promise((resolve, reject) => {
        Promise.all([
            new Promise((resolve, reject) => {
                fs.readFile('./data/items.json', 'utf8', (err, data) => {
                    if (err) {
                        reject("Unable to read items file");
                    } else {
                        items = JSON.parse(data);
                        resolve();
                    }
                });
            }),
            new Promise((resolve, reject) => {
                fs.readFile('./data/categories.json', 'utf8', (err, data) => {
                    if (err) {
                        reject("Unable to read categories file");
                    } else {
                        categories = JSON.parse(data);
                        resolve();
                    }
                });
            })
        ])
        .then(() => resolve())
        .catch(err => reject(err));
    });
};


module.exports.getAllItems = function() {
    return new Promise((resolve, reject) => {
        if (items.length === 0) {
            reject("No items found");
        } else {
            resolve(items);
        }
    });
};


module.exports.getCategories = function() {
    return new Promise((resolve, reject) => {
        if (categories.length === 0) {
            reject("No categories found");
        } else {
            resolve(categories);
        }
    });
};
module.exports.getPublishedItems = function() {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published);
        if (publishedItems.length > 0) {
            resolve(publishedItems);
        } else {
            reject("No results returned");
        }
    });
};
