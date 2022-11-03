//////////////////////////////
//// REQUIREMENTS & PORT ////
////////////////////////////

const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

//////////////////////////////
//////// MIDDLEWARE /////////
////////////////////////////

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

////////////////////////////
//////// DATABASES ////////
//////////////////////////

//Users Database
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

//URL Database
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca"},
  "9sm5xK": { longURL: "http://www.google.com"}
};

///////////////////////////////////
//////// HELPER FUNCTIONS ////////
/////////////////////////////////

//Generate random 6-character string function
const generateRandomString = function() {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let randomStr = "";
  for (let i = 6; i > 0; i--) {
    randomStr += chars[Math.floor(Math.random() * chars.length)];
  }
  return randomStr;
};

//Get user by email function: If email is found, return user object. If not, return null
const getUserByEmail = function(email) {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return null;
};

/////////////////////////////////////////////////////
//////// MAIN URLS PAGE & CREATING NEW URLS ////////
///////////////////////////////////////////////////

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
  const id = req.cookies["userID"];
  const user = users[id];
  const templateVars = {
    urls: urlDatabase,
    user
  };
  res.render("urls_index", templateVars);
});

//Rendering new URLs
app.get("/urls/new", (req, res) => {
  const id = req.cookies["userID"];
  const user = users[id];
  const templateVars = {
    id: req.params.id,
    user
  };
  res.render("urls_new", templateVars);
});

//Rendering template vars into /urls/:id page
app.get("/urls/:id", (req, res) => {
  const id = req.cookies["userID"];
  const user = users[id];
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user
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

//////////////////////////////////////////
//////// EDITING & DELETING URLS ////////
////////////////////////////////////////

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

//Rendering the template vars into the login page
app.get("/login", (req, res) => {
  const id = req.cookies["userID"];
  const user = users[id];
  const templateVars = {
    urls: urlDatabase,
    user
  };
  res.render("login", templateVars);
});

//After user logs in, set a username cookie and redirect back to /urls
app.post("/urls/login", (req, res) => {
  const userID = req.body.id;
  res.cookie("userID", userID);
  res.redirect("/urls");
});

//After user logs out, clear username cookie and redirect back to /urls
app.post("/urls/logout", (req, res) => {
  const userID = req.body.id;
  res.clearCookie("userID", userID);
  res.redirect("/urls");
});

///////////////////////////////////
//////// USER REGISTRATION ///////
/////////////////////////////////

//Render the user registration page
app.get("/register", (req, res) => {
  res.render("register", { user: null });
});

/* Save new users to User Database, generate a userID, set cookies & redirect to main urls page
Handle errors: status code 400 if email & password are empty, or if email is already in user object */
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.status(400).send("Error: Please enter an email address and a password.");
  } else if (getUserByEmail(email)) {
    res.status(400).send(`Error: A user with the email address ${email} already exists.`);
  }

  users[userID] = {
    id: userID,
    email,
    password
  };

  res.cookie("userID", userID);
  res.redirect("/urls");
});