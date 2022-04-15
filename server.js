//require express
const express = require('express');
const PORT = process.env.PORT || 3001;
// access to the models/database, could be db
const models = require('./models');
const bcrypt = require('bcrypt');
const es6Rendered = require('express-es6-template-engine');
const cookieParser = require('cookie-parser');
const session = require('express-session');
//call express through the app
const app = express();

app.engine('html', es6Rendered);
app.set('views', 'views');
app.set('view engine', 'html')

app.use(express.json());
app.use(express.static(__dirname + "/public"))

app.use(cookieParser())
app.use(session({
  secret: 'tacocat',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 60000 * 60
  }
}))

app.get('/', (req, res) => {
  res.render('home');
})

app.get('/login', (req, res) => {
  res.render('login');
})

app.get('/signup', (req, res) => {
  res.render('signup');
})

app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    res.redirect('/login');
    return;
  }

  let user = req.session.user;

  models.Review.findAll({
    where: {
      user_id: user.id
    },
    include: models.Book
  }).then(reviews => {
    res.render('dashboard', { locals: { username: user.username, reviews: reviews } });
  })
})



app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
})

app.get('/books', (req, res) => {
  models.Book.findAll().then((books) => {
    res.json(books);
  })
})

app.post('/signup', (req, res) => {
  /**
   * ES6 object deconstruct assignment.
   * 
   * const username = req.body.username
   * const email = req.body.email
   * const password = req.body.password
   */
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.json({ error: 'Username, Email, and Password required.' })
    return;
  }

  bcrypt.hash(password, 5, (err, hash) => {
    models.User.create({
      username: username,
      email: email,
      password: hash
    }).then((user) => {
      req.session.user = user;
      res.json({
        success: true,
        user_id: user.id
      })
    }).catch(e => {
      let errors = [];

      e.errors.forEach((error) => {
        errors.push(error.message)
      })

      res.json({ error: errors })
    })
  })
})

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  models.User.findOne({
    where: { username: username }
  }).then((user) => {
    if (!user) {
      res.json({ error: 'no user with that username' })
      return;
    }

    bcrypt.compare(password, user.password, (err, match) => {
      if (match) {
        req.session.user = user;
        res.json({ user_id: user.id, success: true })
      } else {
        res.json({ error: 'incorrect password' })
      }
    })
  })
})


app.listen(PORT, () => {
  console.log(`App started in port ${PORT}`)
})

