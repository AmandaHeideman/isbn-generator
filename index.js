const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const fetch = (...args) =>
	import('node-fetch').then(({default: fetch}) => fetch(...args));
const initializePassport = require('./passport-config');
require('dotenv').config();
const { con } = require('./database');
const fsPromise = require('fs/promises');

const app = express();
const salt = Number(process.env.SALT);
const secretToken = process.env.SECRET_TOKEN;

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(flash());
app.use(session({
    secret: process.env.SECRET_TOKEN,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

initializePassport(
    passport, 
    id => {
        getUserId(id);
    }
);


let newIsbn;

app.get("/", checkAuthenticated, (req, res) => {
    res.render('index', {isbn: ""});
})

app.post("/", checkAuthenticated, (req, res) => {
    getAllIsbn(res)
})

app.get("/login", checkNotAuthenticated, (req, res) => {
    res.render('login', {error: ""});
})

app.post("/login",checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

app.post("/logout", (req, res) => {
    req.logOut();
    res.redirect('/login')
}) 

app.get("/undo", checkAuthenticated, (req, res) => {
    res.render('undo', {isbn: "", message: ""});
})

app.post("/undo", checkAuthenticated, async (req, res) => {
    const isbn = req.body.isbn;
    try{
        let sql = "UPDATE list SET used = 0 WHERE isbn = '" + isbn + "'";
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Result: " + result);
          });
        console.log("isbn set to not used");
        res.render('undo', {isbn: isbn, message: ""})
    }catch(err){
        console.log(err.message);
        res.render('undo', {isbn:"", message: isbn + " finns ej i databasen."})
    }

})
//Add new user
/* app.get("/newuser", (req, res, next) => {
    let username = "Liber";
    let password = "mf%Q#p&q3Y2cio";

    bcrypt.genSalt(salt, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {

            let sql = "INSERT INTO users (username, password) VALUES ('" + username + "', '" + hash + "');"
            con.query(sql, function (err, result) {
                if (err) throw err;
                console.log("User added : " + username);
            });
        });
    });
}) */

//convert local isbn-list to arrray
/* let isbnArray = [];
const readFileSync = async () => {
    try {
        const list = await fsPromise.readFile('FreeISBNList.txt', 'utf-8');
        isbnArray = list.split(/\r?\n/);
    }catch(err){
        console.log(err);
    }
}
readFileSync(); */

//update isbn to used
async function updateIsbn(isbn){
    try{
        let sql = "UPDATE list SET used = 1 WHERE isbn = '" + isbn + "'";
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("isbn set to used");
          });
    }catch(err){
        console.log(err.message);
    }
}

//get the first 25 unused isbn from database
async function getAllIsbn(res){
        try{
            let sql = "SELECT * FROM list WHERE used = 0 ORDER BY isbn LIMIT 25";
            con.query(sql, async function (err, result) {
                if (err) throw err;
                for(let i = 0; i < result.length; i++){
                    await checkIsbn(result[i].isbn)
                    if(newIsbn){
                        break;
                    }
                }
                res.render('index', {isbn: newIsbn});
            });
            }catch(err){
            console.log(err.message);
        }
}

//check if isbn is avialable
async function checkIsbn(isbn){
    const api_url = "http://api.libris.kb.se/xsearch?query=isbn:(" + isbn + ")&format=json";
    await getapi(api_url)
      .then(records => {
        if(records === 0){
            console.log("isbn not in libris: " + isbn);
            newIsbn = isbn;
            updateIsbn(isbn);
            return isbn;
        }
        else if(records === 1){
            console.log("isbn in libris: " + isbn);
            updateIsbn(isbn);
        }
        else{
            console.log("something went wrong");
        }
      });
  }

  //check if the isbn is in libris
  async function getapi(url) {
    const response = await fetch(url);
    var data = await response.json();
    let records = data.xsearch.records;
    return (records);
}

//add isbn list to database
/* app.get("/add", (res, req) => {
    for(let i = 0; i<isbnArray.length; i++){
        addIsbn(isbnArray[i]);
    }
}) */

async function addIsbn(newIsbn){
    try{
        let sql = "INSERT INTO list (isbn, used) VALUES ('" + newIsbn + "', '0');"
            con.query(sql, function (err, result) {
                if (err) throw err;
                console.log("isbn added:" + newIsbn);
            });
    } catch(error){
        console.log(error.message);
    }
}

function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    else{
        return res.redirect('/login');
    }
}

function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect('/');
    }
    else{
        return next();
    }
}


async function getUserId(id){
    try{
        let sql = "SELECT * FROM users WHERE id = " + id;
        con.query(sql, function (err, userId) {
            if (err) throw err;
            return userId[0].id
          });
    }catch(err){
        console.log(err.message);
    }
}

app.listen(process.env.PORT);
