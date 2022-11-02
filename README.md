# ISBN generator

## Set up app
1. Create tables in database, see below
2. Set up environment variables, see below
3. In index.js, go to SETUP section and uncomment section
4. Go to /add to add ISBN list to database
5. On line 73 and 74, change username and password to what you want to use
6. Go to /newuser to add user to database
7. App is now set up


### Create isbn table in database
``` sql
CREATE TABLE `list` (
`id` int(11) NOT NULL AUTO_INCREMENT,
  `isbn` varchar(45) DEFAULT NULL,
  `used` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=82579 DEFAULT CHARSET=utf8mb4
```

### Create user table in database
``` sql 
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(45) DEFAULT NULL,
  `password` varchar(90) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4
```

### Environment variables
 - DB_HOST
 - DB_USER
 - DB_PASSWORD
 - DB_DATABASE
 - PORT
 - SALT
 - SECRET_TOKEN