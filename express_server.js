//////////////////////////////
//// REQUIREMENTS & PORT ////
////////////////////////////

const express = require("express");
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;
const { getUserByEmail, urlsForUser, generateRandomString } = require("./helpers");

//////////////////////////////
//////// MIDDLEWARE /////////
////////////////////////////

app.use(express.json());
app.use(cookieSession({
  name: "session",
  keys: ["bc7b77a4-a1fd-4844-a820-55ea304de51b", "d2bd3ccd-2038-477f-a7b2-6cf56849046b"],
  maxAge: 24 * 60 * 60 * 1000 // Cookie expires in 24 hours
}));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

////////////////////////////
//////// DATABASES ////////
//////////////////////////

//Users Database
const users = {};

//URL Database
const urlDatabase = {};

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
  if (!req.session["userID"]) {
    return res.status(403).send("Error: Sorry, you must be logged in to see your URLs.");
  } else {
    const id = req.session["userID"];
    const user = users[id];
    const userURLs = urlsForUser(id, urlDatabase);
    const templateVars = {
      urls: userURLs,
      user
    };

    res.render("urls_index", templateVars);
  }
});

/*Routes for "/": If user is logged in, redirect to /urls
If user is not logged in, redireft to /login*/
app.get("/", (req, res) => {
  if (!req.session["userID"]) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

//Rendering new URLs. If not logged in, redirect to login page
app.get("/urls/new", (req, res) => {
  if (!req.session["userID"]) {
    res.redirect("/login");
  } else {
    const id = req.session["userID"];
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
  const userID = req.session["userID"];
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
  if (!req.session["userID"]) {
    return res.status(403).send("Error: Sorry, only registered users can create new URLs. Please login or register.");
  } else {
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;
    urlDatabase[shortURL] = {
      longURL: longURL,
      userID: req.session["userID"]
    };
    res.redirect(`/urls/${shortURL}`);
  }
});

//Redirect any reqeust to /u/short URL to its long URL
//Display an error if the short URL does not exist
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL]) {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else {
    return res.status(404).send("Error: Sorry, this URL does not exist. Try again.");
  }
});

//////////////////////////////////////////
//////// EDITING & DELETING URLS ////////
////////////////////////////////////////

/*Delete URL when delete button is pressed, then redirect back to /urls page
Display an error if the user does not own the URL*/
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session["userID"];
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
  const userID = req.session["userID"];
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
  if (req.session["userID"]) {
    res.redirect("/urls");
  } else {
    const id = req.session["userID"];
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

  if (!email || !password) {
    return res.status(401).send("Error: Please enter an email address and a password.");
  }
  const existingUser = getUserByEmail(email, users);
  if (!existingUser) {
    return res.status(401).send(`Error: A user with the email address ${email} does not exist. Try again.`);
  }
  const existingPass = existingUser.password;
  if (!bcrypt.compareSync(password, existingPass)) {
    return res.status(401).send("Error: Incorrect password. Try again.");
  }
  req.session.userID = existingUser.id;
  res.redirect("/urls");
});

//After user logs out, clear userID cookie and redirect back to /urls
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

///////////////////////////////////
//////// USER REGISTRATION ///////
/////////////////////////////////

/*Render the templates vars to the user registration page
If logged in, redirect to URLs page*/
app.get("/register", (req, res) => {
  if (req.session["userID"]) {
    res.redirect("/urls");
  } else {
    const id = req.session["userID"];
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
  const existingUser = getUserByEmail(email, users);


  if (!email || !password) {
    return res.status(401).send("Error: Please enter an email address and a password.");
  } else if (existingUser) {
    return res.status(401).send(`Error: A user with the email address ${email} already exists.`);
  }

  users[userID] = {
    id: userID,
    email,
    password: hashPassword
  };

  req.session.userID = userID;
  res.redirect("/urls");
});