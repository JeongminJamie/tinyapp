const express = require("express");
const { generateRandomString, emailLookup, urlsForUser } = require("./helpers");
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

  if (!req.session.user_id) {
    return res.redirect("/login")
  }

  res.render("urls_new", loginId);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortUrl = req.params.shortURL;

  if (!urlDatabase.hasOwnProperty(shortUrl)) {
    return res.render("urls_doesntmatch");
  }

  const user_id = req.session.user_id;

  if (!user_id) {
    return res.render("urls_loginerror");
  }

  if (urlDatabase[shortUrl].userID !== user_id) {
    return res.render("urls_doesntmatch");
  }

  const user = users[user_id] || {};
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user: user };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortUrl = req.params.shortURL;

  if (!urlDatabase.hasOwnProperty(shortUrl)) {
    return res.render("urls_doesntmatch");
  }

  const longUrl = urlDatabase[shortUrl].longURL;
  res.redirect(longUrl);
});

app.get("/", (req, res) => {

  if (!req.session.user_id) {
    return res.redirect("/login")
  }

  res.redirect("/urls");
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
    return res.render("urls_loginerror");
  }

  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }

  res.render("urls_register", { user: null });
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    return res.redirect("/urls");
  }

  res.render("urls_login", { user: null })
});

app.post("/urls", (req, res) => {
  const { longURL } = req.body;
  const shortUrl = generateRandomString(6);
  urlDatabase[shortUrl] = { longURL: longURL, userID: req.session.user_id }

  if (!req.session.user_id) {
    return res.render("urls_loginerror")
  }

  res.status(200);
  res.redirect(`/urls/${shortUrl}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;

  if (urlDatabase[shortURL]) {
    if (urlDatabase[shortURL].userID !== req.session.user_id) {
      return res.render("urls_tryyours.ejs");
    }
  }

  if (!req.session.user_id) {
    return res.render("urls_loginerror")
  }

  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;

  const newURL = { longURL: longURL, userID: req.session.user_id };
  //if user is not logged in
  if (!req.session.user_id) {
    return res.render("urls_loginerror")
  }
  //if shortURL exists in urlDatabase
  if (urlDatabase[shortURL]) {
    if (urlDatabase[shortURL].userID !== req.session.user_id) {
      return res.render("urls_doesntmatch");
    }
  }
  urlDatabase[shortURL] = newURL;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  if (email === "" || password === "") {
    return res.render("urls_eitherinvalid");
  };

  let emailAlreadyExist = emailLookup(email, users);

  if (emailAlreadyExist) {
    return res.render("urls_emailinuse");
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
    return res.render("urls_emailnofound");
  }

  const passwordMatch = bcrypt.compareSync(password, currentUser.password);

  if (!passwordMatch) {
    return res.render("urls_invalid")
  }

  req.session.user_id = currentUser.id;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

