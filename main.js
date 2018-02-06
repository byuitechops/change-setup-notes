/*eslint-env node, es6*/
/*eslint no-unused-vars:1*/
/*eslint no-console:0, semi: 2*/

/* The module finds the Setup Notes in modules, renames it, and deletes it from modules.
   The renamed vertion stays in Pages. */

const canvas = require('canvas-wrapper'),
    asyncLib = require('async');

module.exports = (course, stepCallback) => {
    var cID = course.info.canvasOU;
    var mID, iID;

    // #1 -- get Instructor Resources module 
    function getModule(getModuleCB) {
        canvas.get(`/api/v1/courses/${course.info.canvasOU}/modules`, function (err, modules) {
            if (err) {
                course.error(new Error('error while getting the modules'));
                getModuleCB(err);
                return;
            }
            var my_modules = '';
            // this will return the array of objects, but we only expect just one module in it -->
            my_modules = modules.filter(module => module.name === 'Instructor Resources');
            if (my_modules === '') {
                course.message('No Instructor Resources found in the course');
                stepCallback(null, course);
            } else {
                course.message('Retrieved the Instructor Resorces module');
                // --> so I just return the first element which is my module
                getModuleCB(null, my_modules[0]);
            }
        });
    }

    // #2 -- get item information  
    function getItem(module, getItemCB) {
        // this just gets the module ID, the item ID, and the item title
        canvas.get(`/api/v1/courses/${course.info.canvasOU}/modules/${module.id}/items`, function (err, moduleItems) {
            if (err) {
                course.error(new Error('error while getting the items'));
                getItemCB(err);
                return;
            }
            moduleItems.forEach(function (item) {
                if (item.title === 'Setup Notes for Development Team') {
                    mID = item.module_id;
                    iID = item.id;
                }
            });
            course.message('Got the item information');
            getItemCB(null, module);
        });
    }

    // #3 -- update the item title
    function updateItem(module, updateItemCB) {
        var urlOut = `/api/v1/courses/${cID}/modules/${mID}/items/${iID}`;
        var new_title = '-Setup Notes & Course Settings';
        canvas.put(urlOut, {
            'module_item[title]': new_title
        }, function (err) {
            if (err) {
                course.error(new Error('error while updating the item title'));
                updateItemCB(err);
                return;
            }
            course.message('Updated the item and the page names');
            updateItemCB(null, module);
        });
    }

    // #4 -- deleter the item from the modules
    function deleteItem(module, deleteItemCB) {
        var itemToDelete = `/api/v1/courses/${cID}/modules/${mID}/items/${iID}`;
        canvas.delete(itemToDelete, function (err) {
            if (err) {
                course.error(new Error('error while updating the item title'));
                deleteItemCB(err);
                return;
            }
            course.message('The item has been deleted from the modules');
            deleteItemCB(null, module);
        });
    }

    asyncLib.waterfall([
        getModule,
        getItem,
        updateItem,
        deleteItem
    ],
        function () {
            stepCallback(null, course);
        });
};
