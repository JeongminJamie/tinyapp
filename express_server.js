const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

app.get("/urls/new", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id] || {};
  const loginId = { user: user };
  res.render("urls_new", loginId);
});

app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id] || {};
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: user };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortUrl = req.params.shortURL;
  const longUrl = urlDatabase[shortUrl];
  res.redirect(longUrl);
});

app.get("/urls/:id", (req, res) => {
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
  const templateVars = { urls: urlDatabase, user: user };
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
  urlDatabase[shortUrl] = longURL;
  res.status(200);
  res.redirect(`/urls/${shortUrl}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
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
  const randomId = generateRandomString(6);
  const { email, password } = req.body;
  if (email === "" || password === "") {
    return res.status(400).send({ message: "email or password is invalid" });
  };
  let emailLookupResult = emailLookup(email);
  if (!emailLookupResult) {
    users[randomId] = { id: randomId, email: email, password: password };
    res.cookie("user_id", randomId);
    res.redirect("/urls");
    return;
  }
  res.status(400).send({ message: "email in use" });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  let currentUser = emailLookup(email);
  if (!currentUser) {
    return res.status(403).send("e-mail cannot be found");
  }
  if (currentUser.password !== password) {
    return res.status(403).send("Your password is wrong:(")
  }
  if (currentUser.password === password) {
    res.cookie("user_id", currentUser.id)
    return res.redirect("/urls");
  }
  return res.send("your email or password is wrong!")
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

