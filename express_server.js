const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");

const alphanumeric = '123456ABCDEFGabcdefg';
function generateRandomString(times) {
  let result = '';
  const alphanumericLength = alphanumeric.length;
  for (let i = 0; i < times; i++) {
    result += alphanumeric.charAt(Math.floor(Math.random() * alphanumericLength));
  }
  return result;
};

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
}

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls", (req, res) => {
  const { longURL } = req.body;
  const shortUrl = generateRandomString(6);
  urlDatabase[shortUrl] = longURL;
  res.status(200);
  res.redirect(`/urls/${shortUrl}`);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortUrl = req.params.shortURL;
  const longUrl = urlDatabase[shortUrl];
  res.redirect(longUrl);
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
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

