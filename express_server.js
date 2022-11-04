//////////////////////////////
//// REQUIREMENTS & PORT ////
////////////////////////////

const express = require("express");
const cookieParser = require('cookie-parser');
const bcrypt = require("bcryptjs");
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
  "2LOihj": {
    id: "2LOihj",
    email: "user@example.com",
    password: "123",
  },
  "jS3PuW": {
    id: "jS3PuW",
    email: "user2@example.com",
    password: "abc",
  },
};

//URL Database
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "2LOihj" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "jS3PuW" }
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

//Function the returns the URLs created by the logged-in user if the IDs are a match
const urlsForUser = function(id, urlDatabase) {
  let userURLs = {};
  for (let shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
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
Display an error if the user is not logged in
If the user is logged in, display all the URLs that they have created*/
app.get("/urls", (req, res) => {
  if (!req.cookies["userID"]) {
    return res.status(403).send("Error: Sorry, you must be logged in to see your URLs.");
  } else {
    const id = req.cookies["userID"];
    const user = users[id];
    const userURLs = urlsForUser(id, urlDatabase);
    const templateVars = {
      urls: userURLs,
      user
    };

    res.render("urls_index", templateVars);
  }
});

//Rendering new URLs. If not logged in, redirect to login page
app.get("/urls/new", (req, res) => {
  if (!req.cookies["userID"]) {
    res.redirect("/login");
  } else {
    const id = req.cookies["userID"];
    const user = users[id];
    const templateVars = {
      id: req.params.id,
      user
    };
    res.render("urls_new", templateVars);
  }
});

/*Rendering template vars into /urls/:id page
Display an error if user is not logged in
Display an error if the Short URL ID isn't in the database
Display an error message if the user does not own the URL */
app.get("/urls/:id", (req, res) => {
  const userID = req.cookies["userID"];
  const user = users[userID];
  const userURLs = urlsForUser(userID, urlDatabase);
  if (!userID) {
    return res.status(403).send("Error: Sorry, this page is not accessible. Please login first.");

  } else if (!urlDatabase[req.params.id]) {
    return res.status(404).send("Error: Sorry, this URL does not exist. Try again.");

  } else if (!userURLs[req.params.id]) {
    return res.status(403).send("Error: Sorry, you do not have permission to view this page.");

  } else {
    const templateVars = {
      id: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      user
    };
    res.render("urls_show", templateVars);
  }
});

/*Save new URL to URL Database & redirect to short URL page. Generate URL w/ helper function
/If user is not logged in, display an error message*/
app.post("/urls", (req, res) => {
  if (!req.cookies["userID"]) {
    return res.status(403).send("Error: Sorry, only registered users can create new URLs. Please login or register.");
  } else {
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;
    urlDatabase[shortURL] = {
      longURL: longURL,
      userID: req.cookies["userID"]
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

/*Delete URL when delete button is pressed, then redirect back to /urls page
Display an error if the user does not own the URL*/
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.cookies["userID"];
  if (!userID) {
    return res.status(403).send("Error: Sorry, you are not authorized to delete this URL.");
  } else {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
});

/*Edit URL when edit button is pressed, then redirect back to /urls page
Display an error if the user does not own the URL*/
app.post("/urls/:shortURL/edit", (req, res) => {
  const userID = req.cookies["userID"];
  if (!userID) {
    return res.status(403).send("Error: Sorry, you are not authorized to delete this URL.");
  } else {
    const shortURL = req.params.shortURL;
    urlDatabase[shortURL].longURL = req.body.newURL;
    res.redirect("/urls");
  }
});

///////////////////////////////////
//////// USER LOG IN & OUT ///////
/////////////////////////////////

//Rendering the template vars into the login page
//If the user is logged in already, redirect to urls page
app.get("/login", (req, res) => {
  if (req.cookies["userID"]) {
    res.redirect("/urls");
  } else {
    const id = req.cookies["userID"];
    const user = users[id];
    const templateVars = {
      urls: urlDatabase,
      user
    };
    res.render("login", templateVars);
  }
});

/*After user logs in, set a userID cookie and redirect back to /urls
Display error if email & password are empty or if user email doesn't exist
Only check for for the existing password if the return value of function call is not null/undefined
Display error if email does exist but the password doesn't match the one in the database*/

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashPassword = bcrypt.hashSync(password, 10);

  if (!email || !password) {
    return res.status(401).send("Error: Please enter an email address and a password.");
  }
  const existingUser = getUserByEmail(email);
  if (!existingUser) {
    return res.status(401).send(`Error: A user with the email address ${email} does not exist. Try again.`);
  }
  const existingPass = existingUser.password;
  if (!bcrypt.compareSync(existingPass, hashPassword)) {
    return res.status(401).send("Error: Incorrect password. Try again.");
  }
  res.cookie("userID", existingUser.id);
  res.redirect("/urls");
});

//After user logs out, clear userID cookie and redirect back to /urls
app.post("/logout", (req, res) => {
  const userID = req.body.id;
  res.clearCookie("userID", userID);
  res.redirect("/login");
});

///////////////////////////////////
//////// USER REGISTRATION ///////
/////////////////////////////////

/*Render the templates vars to the user registration page
If logged in, redirect to URLs page*/
app.get("/register", (req, res) => {
  if (req.cookies["userID"]) {
    res.redirect("/urls");
  } else {
    const id = req.cookies["userID"];
    const user = users[id];
    const templateVars = {
      urls: urlDatabase,
      user
    };
    res.render("register", templateVars);
  }
});

/* Save new users to User Database, generate a userID, set cookies & redirect to main urls page
Display error if email & password are empty, or if email is already in user object
Save the hash password with bcyrpt*/
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashPassword = bcrypt.hashSync(password, 10);

  if (!email || !password) {
    return res.status(401).send("Error: Please enter an email address and a password.");
  } else if (getUserByEmail(email)) {
    return res.status(401).send(`Error: A user with the email address ${email} already exists.`);
  }

  users[userID] = {
    id: userID,
    email,
    password: hashPassword
  };

  res.cookie("userID", userID);
  res.redirect("/urls");
});