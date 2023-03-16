//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const _= require("lodash");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/myapp");


const itemsSchema ={
  name:String
};

const Item = mongoose.model("Item",itemsSchema);

const item1 = new Item({
  name:"Welcome to your ToDoList"
})

const item2 = new Item({
  name:"Hit the + button to add a new item"
})

const item3 = new Item({
  name:"<-- Hit this to delete the item"
})

const defaultItems = [item1,item2,item3];

const listSchema = {
  name:String,
  items: [itemsSchema]
};

const List = mongoose.model("List",listSchema);

async function inserts() {
  try{
    await Item.insertMany(defaultItems);
    await List.deleteMany({name:"Favicon.ico"});
    console.log("Default items inserted succesfully");
  }
  catch(err){
    console.log("Error: "+err);
  }
}



app.get("/", function(req, res) {

  async function add()
  {
    try{
      const results= await Item.find();
      //The if condition checks results array is empty then call inserts() fucntion or else just render the array in list.ejs
      if(results.length==0){
        inserts();
        await List.deleteMany({name:"Favicon.ico"});
        res.redirect("/"); //This is required to render the array results in list.ejs
      }
      else{
        await List.deleteMany({name:"Favicon.ico"});
        res.render("list", {listTitle: "Today", newListItems: results});
      }
    }
    catch(err){
      console.log("Error"+err);
    }
  }

  add();
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name:itemName
  });
//Checking if the current list is "Today" or custom and accordingly pusing the item in that particular list
if(listName=="Today"){
  item.save();
  List.deleteMany({name:"Favicon.ico"});
  res.redirect("/");
}
else{
  async function pushNew() {
    const found = await List.findOne({name:listName});
    found.items.push(item);
    found.save();
    res.redirect("/"+listName);
    await List.deleteMany({name:"Favicon.ico"});
  };
  pushNew();
}


});

app.post("/delete",function (req,res) {
  const checkedItemId = req.body.checkbox;
 const listName = req.body.listName;
  async function deletebyid(){
    try{
      if(listName=== "Today"){
        await Item.findByIdAndRemove(checkedItemId);
         console.log("ID of the Item deleted was "+checkedItemId);
         res.redirect("/");
          await List.deleteMany({name:"Favicon.ico"});
      }
      else{
        try{
          await List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}});
          res.redirect("/"+listName);
          await List.deleteMany({name:"Favicon.ico"});
        }
        catch(err){
          console.log("ERROR:"+err);
        }

         }
      }
      catch(err){
        console.log("ERROR"+err);
      }
  }

  deletebyid();

})

//Custom list creation dynamically
app.get("/:customListName", function(req,res){
   const customListName = _.capitalize([req.params.customListName]);

//Checking if the page already exist or not, if not then create that list
   async function check() {
    const foundList= await List.findOne({name:customListName});

     if(!foundList){
       //Create a new list
       const list = new List({name: customListName,items: defaultItems});
       list.save();
       res.redirect("/"+customListName);
        await List.deleteMany({name:"Favicon.ico"});
     }
     else
     {
       //Show existing list
       res.render("list",{listTitle:foundList.name,newListItems:foundList.items})
        await List.deleteMany({name:"Favicon.ico"});
     }
   }
   check();
});






app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
