const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcryptjs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "aJ48lW"
  }
}

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

const alphanumeric = '123456ABCDEFGabcdefg';
function generateRandomString(times) {
  let result = '';
  const alphanumericLength = alphanumeric.length;
  for (let i = 0; i < times; i++) {
    result += alphanumeric.charAt(Math.floor(Math.random() * alphanumericLength));
  }
  return result;
};

const emailLookup = function (email) {
  for (const key in users) {
    if (users[key].email === email) {
      return users[key];
    }
  }
  return false;
};

const urlsForUser = function (id) {
  let filtered = {};
  for (let key of Object.keys(urlDatabase)) {
    console.log(urlDatabase[key]);
    if (urlDatabase[key].userID === id) {
      filtered[key] = urlDatabase[key];
    }
  }
  return filtered;
};

app.get("/urls/new", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id] || {};
  const loginId = { user: user };
  res.render("urls_new", loginId);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortUrl = req.params.shortURL;
  if (!urlDatabase.hasOwnProperty(shortUrl)) {
    return res.send("wrong shortURL");
  }
  const user_id = req.cookies["user_id"];
  const user = users[user_id] || {};
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: user };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortUrl = req.params.shortURL;
  if (!urlDatabase.hasOwnProperty(shortUrl)) {
    return res.send("wrong shortURL");
  }
  const longUrl = urlDatabase[shortUrl].longURL;
  res.redirect(longUrl);
});

app.get("/urls/:id", (req, res) => {
  const filteredUrls = urlsForUser(req.params.id);
  if (!req.cookies["user_id"] || filteredUrls === {}) {
    return res.send("Users only");
  }
  res.render("urls_show");
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id] || {};
  const filteredUrls = urlsForUser(user_id);
  const templateVars = { urls: filteredUrls, user: user };
  if (!user_id) {
    return res.send("Login please");
  }
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.get("/login", (req, res) => {
  res.render("urls_login")
});

app.post("/urls", (req, res) => {
  const { longURL } = req.body;
  const shortUrl = generateRandomString(6);
  urlDatabase[shortUrl] = { longURL: longURL, userID: req.cookies["user_id"] }
  console.log(longURL);
  res.status(200);
  res.redirect(`/urls/${shortUrl}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL]) {
    if (urlDatabase[shortURL].userID !== req.cookies["user_id"]) {
      return res.send("Try yours");
    }
  }
  if (!req.cookies["user_id"]) {
    return res.send("Login first")
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  const newURL = { longURL: longURL, userID: req.cookies["user_id"] };
  if (urlDatabase[shortURL]) {
    if (urlDatabase[shortURL].userID !== req.cookies["user_id"]) {
      return res.send("Try yours");
    }
  }
  urlDatabase[shortURL] = newURL;
  if (!req.cookies["user_id"]) {
    return res.send("Login first")
  }
  res.redirect("/urls");
});

// app.post("/login", (req, res) => {
//   res.cookie('username', req.body.username);
//   res.redirect("/urls");
// });

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {

  const { email, password } = req.body;
  if (email === "" || password === "") {
    return res.status(400).send({ message: "email or password is invalid" });
  };

  let emailAlreadyExist = emailLookup(email);
  if (emailAlreadyExist) {
    return res.status(400).send({ message: "email in use" });
  }

  const randomId = generateRandomString(6);
  const hashedPassword = bcrypt.hashSync(password, 10);

  users[randomId] = {
    id: randomId,
    email: email,
    password: hashedPassword
  };
  res.cookie("user_id", randomId);
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  let currentUser = emailLookup(email);
  if (!currentUser) {
    return res.status(403).send("e-mail cannot be found");
  }

  // const passwordMatch = currentUser.password === password;
  const passwordMatch = bcrypt.compareSync(password, currentUser.password);
  if (!passwordMatch) {
    return res.status(403).send("Invaild credential")
  }

  res.cookie("user_id", currentUser.id)
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

