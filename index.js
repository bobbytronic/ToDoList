//Importing node modules

import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
import _ from "lodash";

//Define Express App

const app = express();
const port = 3000;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('public'));


//Define mongoose

//mongoose.connect("mongodb://127.0.0.1:27017/todoListDB");

mongoose.connect("mongodb+srv://admin:l8IOO552ROTjiABM@cluster0.wr5vjl8.mongodb.net/todoListDB")

const itemsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
});

const Item = new mongoose.model("Item", itemsSchema);

//Define mock tasks

const defaultItems = [
    { name: 'Buy Groceries' },
    { name: 'Take out the garbage' },
    { name: 'Take the dog to a walk' },
  ];

const listSchema = {
    name: String,
    items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

//Define Express Routing

app.get('/', async (req, res) => {
    try {
      const foundItems = await Item.find();
      if (foundItems.length === 0) {
        await Item.insertMany(defaultItems);
        res.redirect("/");
      } else {
        res.render('index.ejs', { listTitle: 'Today', newListItems: foundItems });
      }
    } catch (error) {
      console.log(error);
    }
  });

app.get("/:customListName", async (req, res) =>{
  const customListName = _.capitalize(req.params.customListName);

  if(customListName != 'favicon.ico'){
    try {
        const foundList = await List.findOne({name: customListName});
        if(!foundList){
            const list = new List({
                name: customListName,
                items: defaultItems
            });
            await list.save();
            res.redirect("/" + customListName);
        }
        else{
            res.render("index.ejs", {listTitle: foundList.name, newListItems: foundList.items})
        }
        } catch (error) {
            console.log(error);
        }
    }
})

app.post("/", async (req, res) =>{
    const itemName = req.body.newItem;
    var listName = req.body.list;

    const item = new Item({
        name: itemName
    })

    if(listName === "Today"){
        await item.save();
        res.redirect("/");
    }
    else{
        try {
            const foundList = await List.findOne({name: listName})
            foundList.items.push(item);
            await foundList.save();
            res.redirect("/" + listName);
        } catch (error) {
            console.log(error)
        }
    }  
});

app.post("/delete", async (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (checkedItemId && mongoose.Types.ObjectId.isValid(checkedItemId)) {
        if (listName === "Today") {
            try {
                await Item.findByIdAndRemove(checkedItemId);
                res.redirect("/");
            } catch (error) {
                console.log(error);
            }
        } else {
            try {
                const foundList = await List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } });
                res.redirect("/" + listName);
            } catch (error) {
                console.log(error);
            }
        }
    } else {
        // Handle invalid or missing checkedItemId here
        console.log("Invalid or missing checkedItemId:", checkedItemId);
    }
});

app.listen(port, function(){
    console.log(`Server started at localhost:${port}`);
});