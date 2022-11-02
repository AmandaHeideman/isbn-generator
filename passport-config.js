const LocalStragedy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
require('dotenv').config();
const { con } = require('./database');

function initialize(passport, getUserById){
    const authenticateUser = async (username, password, done) => {
        try{
            let sql = "SELECT * FROM users WHERE username = '" + username + "'";
            con.query(sql, async function (err, result) {
                if (err) throw err;
                const user = result[0];
                if(user == null){
                    return done(null, false, {message: "Fel användarnamn"})
                }
                try {
                    if(await bcrypt.compare(password, user.password)){
                        return done(null, user);
                    }else{
                        return done(null, false, {message: "Fel lösenord"});
                    }
                } catch(e) {
                    return done(e)
                }
            });
        }catch(err){
            console.log(err.message);
        }
    }

    passport.use(new LocalStragedy(authenticateUser))
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser((id, done) => {
        return done(null, getUserById)
     })
}

async function getUsername(username){
    try{
        let sql = "SELECT * FROM users WHERE username = '" + username + "'";
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log(result[0].username);
            return (result[0].username);
          });
    }catch(err){
        console.log(err.message);
    }
}

module.exports = initialize;