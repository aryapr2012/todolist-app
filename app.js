
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin_aryapr:Test123@cluster0.ltmzsgr.mongodb.net/todolistDB");

const itemSchema = {
  name: String
};
const Item = mongoose.model("Item", itemSchema);

const listSchema = {
  name: String,
  items: [itemSchema]
}
const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your ToDoList!"
});
const item2 = new Item({
  name: "Click the + button to add a new item"
});
const item3 = new Item({
  name: "<-- Hit this to delete an item"
});
const defaultItems = [item1, item2, item3];
const items = [];

app.get("/", function (req, res) {
  Item.find()
    .then(function (items) {
      
      if (items.length === 0) {
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Items added default items to the DB successfully");
          })
          .catch(function (err) {
            console.log(err);
          });

        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: items });
      }

    })
    .catch(function (err) {
      console.log(err);
    });
});

app.get("/:customListName", function(req, res){
  let customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName})
    .then(function(list){
      if(!list){
        //Create a new list

        const customListItem = new List({
          name: customListName,
          items: defaultItems
        });
        customListItem.save()
          .then(function(){
            console.log("Custom list saved successfully");
            res.redirect(customListName);
          })
          .catch(function(err){
            console.log(err);
          });

      }
      else{
        //Existing list

        res.render("list", { listTitle: list.name, newListItems: list.items });
      }
    })
    .catch(function(err){
      console.log(err);
    });

});

app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });

  if (listName == "Today") {
    item.save()
      .then(function () {
        console.log("New item saved successfully");
      })
      .catch(function (err) {
        console.log(err);
      });

    res.redirect("/");
  }
  else{
    List.findOne({name: listName})
      .then(function(foundList){
        foundList.items.push(item);
        foundList.save()
          .then(function(){
            console.log("New item save to custom list");
          })
          .catch(function(err){
            console.log(err);
          });
        res.redirect(foundList.name);
      })
      .catch(function(err){
        console.log(err);
      });
    
  }
  
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.list;

  if(listName == "Today"){
    Item.findByIdAndRemove(checkedItemId)
    .then(function(){
      console.log("Item removed successfully from DB");
      res.redirect("/");
    })
    .catch(function(err){
      console.log(err);
    });
  }
  else{
    
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
      .then(function(foundList){
        res.redirect(foundList.name);
      })
      .catch(function(err){
        console.log(err);
      });
  }

  
});



app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Todolist App is listening to the server");
});
