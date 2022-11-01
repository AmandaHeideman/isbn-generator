const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const fetch = (...args) =>
	import('node-fetch').then(({default: fetch}) => fetch(...args));
const Isbn = require('./Isbn');
const initializePassport = require('./passport-config');
const UserModel = require('./User');
require('dotenv').config();
//const fsPromise = require('fs/promises');

const app = express();
const db = process.env.DB_URL;
const salt = Number(process.env.SALT);
const secretToken = process.env.SECRET_TOKEN;
mongoose.connect(db);


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

app.post("/", checkAuthenticated, async (req, res) => {
    await getAllIsbn();
    console.log("newIsbn: " + newIsbn);
    updateIsbn(newIsbn);
    res.render('index', {isbn: newIsbn});
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

//Add new user
/* app.get("/newuser", (req, res, next) => {
    let username = "Liber";
  let password = "Wv*LHvmm3rfTaP";
  bcrypt.hash(password, salt, (error, hash) => {
    if (error) return res.status(500);
    const newUser = new UserModel({
      username,
      password: hash,
    });
    newUser
      .save()
      .catch((err) => {
        res.status(400).json({ msg: err.message });
      })
      .then(res.json({ Added: newUser.username }));
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
        const updatedIsbn = await Isbn.findOne({isbn: isbn});
        updatedIsbn.used = 1;
        updatedIsbn.save();
        console.log("isbn set to used");
    }catch(err){
        console.log(err.message);
    }
}

//get the first 50 unused isbn from database
async function getAllIsbn(){
    try{
        const isbnList = await Isbn.find({used: 0}).sort({isbn: 1}).limit(50);
        for(let i = 0; i < isbnList.length; i++){
             await checkIsbn(isbnList[i].isbn)
             if(newIsbn){
                break;
             }
        }
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
        }
        else if(records === 1){
            console.log("isbn in libris: " + isbn);
            updateIsbn(isbn);
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
})

async function addIsbn(newIsbn){
    try{
        const isbn = await Isbn.create({isbn: newIsbn, used: 0});
        console.log("isbn added:" + isbn.isbn);
    } catch(error){
        console.log(error.message);
    }
} */

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
    let userId = await UserModel.findOne({_id: id})
    return userId._id
}

app.listen(process.env.PORT);
