//////////////////////////////
//// REQUIREMENTS & PORT ////
////////////////////////////

const express = require("express");
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const app = express();
const PORT = 8080;

//////////////////////////////
//////// MIDDLEWARE /////////
////////////////////////////

app.use(express.json());
app.use(cookieParser());
app.use(cookieSession({
  name: "session",
  keys: "43337c74-80d2-4dbb-9d64-d9088db11050"
}));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

////////////////////////////
//////// DATABASES ////////
//////////////////////////

//Users Database
const users = {
  userRandomID: {
    id: "Rxu4p7",
    email: "user@example.com",
    password: "123",
  },
  user2RandomID: {
    id: "6M0cIQ",
    email: "user2@example.com",
    password: "abc",
  },
};

//URL Database
const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "Rxu4p7"},
  "9sm5xK": {longURL: "http://www.google.com", userID: "Rxu4p7"}
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

/*Rendering the template vars into main URL page
If user isn't logged in, display an error message...NOT IMPLEMENTED YET, need help*/
app.get("/urls", (req, res) => {

  const id = req.session["user_ID"];
  const user = users[id];
  const templateVars = {
    urls: urlDatabase,
    user
  };
  res.render("urls_index", templateVars);

});

//Rendering new URLs. If not logged in, redirect to login page
app.get("/urls/new", (req, res) => {
  if (!req.session["user_ID"]) {
    res.redirect("/login");
  } else {
    const id = req.session["user_ID"];
    const user = users[id];
    const templateVars = {
      id: req.params.id,
      user
    };
    res.render("urls_new", templateVars);
  }
});

/*Rendering template vars into /urls/:id page
If the Short URL ID isn't in the database, display an error*/
app.get("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id]) {
    const id = req.session["user_ID"];
    const user = users[id];
    const templateVars = {
      id: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      user
    };
    res.render("urls_show", templateVars);
  } else {
    res.status(400).send("Error: Sorry, this URL does not exist. Try again.");
  }
});

/*Save new URL to URL Database & redirect to short URL page. Generate URL w/ helper function
/If user is not logged in, display an error message*/
app.post("/urls", (req, res) => {
  if (!req.session["user_ID"]) {
    res.status(400).send("Error: Sorry, only registered users can create new URLs. Please login or register.");
  } else {
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;
    const userID = req.session["user_ID"];
    urlDatabase[shortURL] = {
      longURL,
      userID,
    };
    res.redirect(`/urls/${shortURL}`);
  }
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
//If the user is logged in already, redirect to urls page
app.get("/login", (req, res) => {
  if (req.session["user_ID"]) {
    res.redirect("/urls");
  } else {
    const id = req.session["user_ID"];
    const user = users[id];
    const templateVars = {
      urls: urlDatabase,
      user
    };
    res.render("login", templateVars);
  }
});

/*After user logs in, set a userID cookie and redirect back to /urls
Return status code 400 if email & password are empty or if user email doesn't exist
Only check for for the existing password if the return value of function call is not null/undefined
Return status code 400 if email does exist but the password doesn't match the one in the database*/

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return res.status(400).send("Error: Please enter an email address and a password.");
  }
  const existingUser = getUserByEmail(email);
  if (!existingUser) {
    return res.status(400).send(`Error: A user with the email address ${email} does not exist. Try again.`);
  }
  const existingPass = existingUser.password;
  if (password !== existingPass) {
    return res.status(400).send("Error: Incorrect password. Try again.");
  }
  res.cookie("user_ID", existingUser.id);
  res.redirect("/urls");
});

//After user logs out, clear userID cookie and redirect back to /urls
app.post("/logout", (req, res) => {
  const userID = req.body.id;
  res.clearCookie("user_ID", userID);
  res.redirect("/login");
});

///////////////////////////////////
//////// USER REGISTRATION ///////
/////////////////////////////////

//Render the templates vars to the user registration page
app.get("/register", (req, res) => {
  if (req.session["user_ID"]) {
    res.redirect("/urls");
  } else {
    const id = req.session["user_ID"];
    const user = users[id];
    const templateVars = {
      urls: urlDatabase,
      user
    };
    res.render("register", templateVars);
  }
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

  res.cookie("user_ID", userID);
  res.redirect("/urls");
});