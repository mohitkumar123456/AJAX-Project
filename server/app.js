require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const auth = require("./middleware/auth");
const User = require("./model/user");
const Store = require("./model/store")
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')
const cors = require('cors')
const session = require('express-session')
const path = require("path");
const app = express();

app.use(express.json());
// Setting path for public directory 
const static_path = path.join(__dirname, "public");
app.use(express.static(static_path));
app.use(express.urlencoded({ extended: true }));
app.use(session({secret: "Shh, its a secret!"}));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://localhost:4002"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


// Logic goes here
// ...

app.post("/register", async (req, res) => {

    // Our register logic starts here
    try {
      // Get user input
      const { first_name, last_name, email, password } = req.body;
      // Validate user input
      if (!(email && password && first_name && last_name)) {
        res.status(400).send("All input is required");
      }
  
      // check if user already exist
      // Validate if user exist in our database
      const oldUser = await User.findOne({ email });
  
      if (oldUser) {
        return res.status(409).json({message:"User Already Exist. Please Login"});
      }
  
      //Encrypt user password
      encryptedPassword = await bcrypt.hash(password, 10);
  
      // Create user in our database
      const user = await User.create({
        first_name,
        last_name,
        email: email.toLowerCase(), // sanitize: convert email to lowercase
        password: encryptedPassword,
      });
  
      // Create token
      const token = jwt.sign(
        { user_id: user._id, email },
        process.env.TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );
      // save user token
      user.token = token;
  
      // return new user
      res.status(201).json(user);
    } catch (err) {
      console.log(err);
    }
    // Our register logic ends here
  });
  
  // ...

  // ...

app.post("/login",cors(),async (req, res) => {

    // Our login logic starts here
    try {
      // Get user input
      const { email, password } = req.body;
      // Validate user input
      if (!(email && password)) {
        res.status(403).json({"message":"All input is required"});
      }
      else{
        // Validate if user exist in our database
        const user = await User.findOne({ email });
    
        if (user && (await bcrypt.compare(password, user.password))) {
            // Create token
            const token = jwt.sign(
            { user_id: user._id, email },
            process.env.TOKEN_KEY,
            {
                expiresIn: "2h",
            }
            );
    
            // save user token
            user.token = token;
            req.session.token = token;
            // user
            res.status(200).json(user);
        }
        else{
            res.status(401).json({"message":"Invalid user"});
        }
      }
      
      
    } catch (err) {
      console.log(err);
    }
    // Our register logic ends here
  });
  
  // ...
  

app.get("/cart", auth, (req, res) => {
  res.sendFile(__dirname+'/public/cart.html')

});
app.get("/", (req, res) => {
  res.sendFile(__dirname+'/public/login.html')

});
app.post('/logout', async function (req, res, next) {
  req.session.token = '';
  req.session.destroy();
  req.session = null;
  res.send("");
});


//session for the shopping cart
app.post("/totalitems",auth,(req,res)=>{

    req.session.totalitem=0
    res.status(200).json({"totalitems":req.session.totalitem});
})

app.post("/storeitem",auth,async (req, res)=>{
  const { item_src, item_name, item_price } = req.body;
  const store = await Store.create({
    item_src,
    item_name,
    item_price
  });

  req.session.totalitem++
  res.status(200).json({"totalitems":req.session.totalitem});
})

app.get("/showitem",auth,async (req, res)=>{
  const { item_src, item_name, item_price } = req.body;
  let store = await Store.find();
  store.totalitem = req.session.totalitem
  res.status(200).json({"data":store});
})


module.exports = app;