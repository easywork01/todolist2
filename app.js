//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser: true});

const itemsSchema = {
  name : String
}
const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({
  name:"Hit the + button to add new item."
});
const item2 = new Item({
  name:"<-- Hit checkbox to delete an item"
});

const defaultItems = [item1, item2];

// Item.insertMany(defaultItems, function(err){
//   if(err){
//     console.log(err);
//   }else{
//     console.log("successfully addded items to DB");
//   }
// });
const listSchema = {
  name: String,
  items : [itemsSchema] 
}
const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find().then(function(foundItems){

    if(foundItems.length === 0){
      Item.insertMany(defaultItems)
        .then(function () {
          console.log("Successfully saved defult items to DB");
        })
        .catch(function (err) {
          console.log(err);
        });
        res.redirect('/');
    }else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
  
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName ==="Today"){
    item.save();
    res.redirect("/");
  }else{
        List.findOne({ name: listName })
      .then(foundList => {
        foundList.items.push(item);
        return foundList.save();
      })
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch(err => {
        console.error(err);
      });

  }
  

  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }
});

app.post("/delete",function(req,res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName
    //write a funtion that find by id and remove this from list. list title === today delete item and res.redirect('/')
    //else we need to access that custom list and delete that item from items array this is a tricky part where we use mongoose and javaScript
    if(listName === "Today"){
      Item.findByIdAndRemove(checkedItemId).exec();
    console.log("Sucesss")
    res.redirect('/');
    }else{
      List.findOneAndUpdate(
        {name: listName}, 
        {$pull: {items: {_id : checkedItemId}}}
        )
        .then(()=>{
          res.redirect("/"+listName);
        })
        .catch(err =>{
          console.error(err);
        });
    }
    
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(foundList => {
      if (!foundList) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        return list.save();
      } else {
        //return old list
        return foundList;
      }
    })
    .then(list => {
      //updating tile of list
      res.render("list", { listTitle: list.name, newListItems: list.items });
    })
    .catch(err => {
      //if error is abserver
      console.error(err);
    });
});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3005, function() {
  console.log("Server started on port 3005");
});
