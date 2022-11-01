const LocalStragedy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const UserModel = require('./User');

function initialize(passport, getUserById){
    const authenticateUser = async (username, password, done) => {
        const user = await getUsername(username);
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
    }

    passport.use(new LocalStragedy(authenticateUser))
    passport.serializeUser((user, done) => done(null, user.id))
    passport.deserializeUser((id, done) => {
        return done(null, getUserById)
     })
}
async function getUsername(username){
    return await UserModel.findOne({username: username})
}

module.exports = initialize;