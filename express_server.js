//////////////////////////////
//// REQUIREMENTS & PORT ////
////////////////////////////

const express = require("express");
const cookieParser = require('cookie-parser');
//const { cookie } = require("express/lib/response"); //do i need this? where did it come from???
const app = express();
const PORT = 8080;

//////////////////////////////
//////// MIDDLEWARE /////////
////////////////////////////
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

//Setting view engine to EJS
app.set("view engine", "ejs");

//Generate random string function
const generateRandomString = function() {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let randomStr = "";
  for (let i = 6; i > 0; i--) {
    randomStr += chars[Math.floor(Math.random() * chars.length)];
  }
  return randomStr;
};

//URL Database
const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca"},
  "9sm5xK": {longURL: "http://www.google.com"}
};

////////////////////////////
//////// ROUTES ///////////
///////////////////////////

//Displays a message that the server is listening when server is running
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});

//Get response as JSON
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Rendering the template vars into main URL page
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
});

//Rendering new URLs
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//Rendering template vars into /urls/:id page
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

//Save new URL to URL Database & redirect to short URL page. Generate URL w/ helper function
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = {
    longURL: longURL
  };
  res.redirect(`/urls/${shortURL}`);
});

//Redirect any reqeust to /u/short URL to its long URL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

//Delete URL when delete button is pressed, then redirect back to /urls page
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

//Edit URL when edit button is pressed, then redirect back to /urls page
app.post("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL].longURL = req.body.newURL;
  res.redirect("/urls");
});

///////////////////////////////////
//////// USER LOG IN & OUT ///////
/////////////////////////////////

//After user logs in, set a username cookie and redirect back to /urls
app.post("/urls/login", (req, res) => {
  const username = req.body.username;
  res.cookie("username", username);
  res.redirect("/urls");
});

//After user logs out, clear username cookie and redirect back to /urls
app.post("/urls/logout", (req, res) => {
  const username = req.body.username;
  res.clearCookie("username", username);
  res.redirect("/urls");
});

///////////////////////////////////
//////// USER REGISTRATION ///////
/////////////////////////////////

//Rendering the user registration page
app.get("/register", (req, res) => {
  res.render("register", {user: null});
});