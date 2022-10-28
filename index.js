const express = require('express');
const mongoose = require('mongoose');
const fetch = (...args) =>
	import('node-fetch').then(({default: fetch}) => fetch(...args));
const Isbn = require('./Isbn');
require('dotenv').config();
//const fsPromise = require('fs/promises');

const app = express();
const db = process.env.DB_URL;
mongoose.connect(db);

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));

let newIsbn;

app.get("/", (req, res) => {
    res.render('index', {isbn: ""});
})

app.post("/", async (req, res) => {
    await getAllIsbn();
    console.log("newIsbn: " + newIsbn);
    updateIsbn(newIsbn);
    res.render('index', {isbn: newIsbn});
})

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

app.listen(3000);
