//Setting up express & port
const express = require("express");
const app = express();
const PORT = 8080;

//Setting up middleware
app.use(express.json());
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
  "b2xVn2": {id:"b2xVn2", longURL: "http://www.lighthouselabs.ca"},
  "9sm5xK": {id: "9sm5xK", longURL: "http://www.google.com"}
};

//Displays a message that the server is listening when server is running
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});

//Returning JSONs
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//Rendering the template vars into main URL page
app.get("/urls", (req, res) => {
  const templateVars = {urls: urlDatabase};
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
    longURL: urlDatabase[req.params.id].longURL};
  res.render("urls_show", templateVars);
});

//Save new URL to URL Database & redirect to short URL page. Generate URL w/ helper function
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = {
    id: shortURL,
    longURL: longURL
  };
  console.log("Full request body:", req.body); // Log the POST request body to the console
  res.redirect(`/urls/${shortURL}`);
});

//Redirect any reqeust to /u/short URL to its long URL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  console.log("URL Database", urlDatabase);
  console.log("Long URL", longURL);
  res.redirect(longURL);
});
