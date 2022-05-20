const express = require("express");
const { generateRandomString, emailLookup, urlsForUser } = require("../helpers");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcryptjs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['I do not like potatoes', 'I hate salmon sashimi']
}));
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

app.get("/urls/new", (req, res) => {
  const user_id = req.session.user_id;
  const user = users[user_id] || {};
  const loginId = { user: user };
  res.render("urls_new", loginId);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortUrl = req.params.shortURL;
  if (!urlDatabase.hasOwnProperty(shortUrl)) {
    return res.send("wrong shortURL");
  }
  const user_id = req.session.user_id;
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
  const filteredUrls = urlsForUser(req.params.id, urlDatabase);
  if (!req.session.user_id || filteredUrls === {}) {
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
  const user_id = req.session.user_id;
  const user = users[user_id] || {};
  const filteredUrls = urlsForUser(user_id, urlDatabase);
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
  urlDatabase[shortUrl] = { longURL: longURL, userID: req.session.user_id }
  console.log(longURL);
  res.status(200);
  res.redirect(`/urls/${shortUrl}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL]) {
    if (urlDatabase[shortURL].userID !== req.session.user_id) {
      return res.send("Try yours");
    }
  }
  if (!req.session.user_id) {
    return res.send("Login first")
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  const newURL = { longURL: longURL, userID: req.session.user_id };
  if (urlDatabase[shortURL]) {
    if (urlDatabase[shortURL].userID !== req.session.user_id) {
      return res.send("Try yours");
    }
  }
  urlDatabase[shortURL] = newURL;
  if (!req.session.user_id) {
    return res.send("Login first")
  }
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {

  const { email, password } = req.body;
  if (email === "" || password === "") {
    return res.status(400).send({ message: "email or password is invalid" });
  };

  let emailAlreadyExist = emailLookup(email, users);
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
  req.session.user_id = randomId;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  let currentUser = emailLookup(email, users);
  if (!currentUser) {
    return res.status(403).send("e-mail cannot be found");
  }

  const passwordMatch = bcrypt.compareSync(password, currentUser.password);
  if (!passwordMatch) {
    return res.status(403).send("Invaild credential")
  }

  req.session.user_id = currentUser.id;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

