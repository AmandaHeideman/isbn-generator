const mongoose = require('mongoose');

const isbnSchema = new mongoose.Schema({
    isbn: {
        type: String,
        unique: true
    },
    used: Number
})

module.exports = mongoose.model("isbn", isbnSchema);
