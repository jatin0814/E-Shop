const path = require('path');
const fs=require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoDbStore = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require("multer");
const adminRoute = require('./routes/admin');
const clientRouter = require('./routes/shop');
const authRouter = require('./routes/auth');
const productController = require('./controllers/error');
const dotenv=require("dotenv")
const helmet=require("helmet")
const compression=require("compression");
dotenv.config();

// console.log(process.env.MONGODB_USER)
// console.log(process.env.MONGODB_DATABASE)
// console.log(process.env.MONGODB_PASSWORD)
// console.log(process.env.NODE_ENV)
//console.log(`mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.wjzw0.mongodb.net/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`);

const User = require('./models/user');
const morgan = require('morgan');

const MONGODB_URI = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.wjzw0.mongodb.net/${process.env.MONGODB_DATABASE}?retryWrites=true&w=majority`;
const app = express();
const store = new MongoDbStore({
    uri:MONGODB_URI,
    collection:'sessions'
})

const fileStorage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"images");
    },
    filename:(req,file,cb)=>{
        cb(null,file.originalname);
    }
})

const fileFilter = (req,file,cb)=>{
    if(file.mimetype==='image/png' || file.mimetype==='image/jpeg' || file.mimetype==='image/jpg' )
    {
        cb(null,true)
    }else{
        cb(null,false)
    }
}
const csrfProtection = csrf();
app.use(helmet())
app.use(compression())
app.set('view engine', 'ejs');
app.set('views','views');

app.use(bodyParser.urlencoded({extended: true}));
app.use(multer({storage:fileStorage,fileFilter:fileFilter}).single('image'))

app.use(express.static(path.join(__dirname,'public')));
app.use("/images",express.static(path.join(__dirname,'images')));  
app.use(session({secret:"my secret",resave:false,saveUninitialized:false,store:store}));

const accessLog = fs.createWriteStream(path.join(__dirname,"access.log"),{flags:'a'})
app.use(csrfProtection);
app.use(flash());
app.use(morgan("combined",{stream:accessLog}))

app.use((req,res,next)=>{
    if(!req.session.user){
        return next();
    }
    User.findById(req.session.user._id)
    .then(user=>{
        if(!user){
            return next();
        }
        req.user = user;
        next(); 
    }).catch(err =>{
        throw new Error(err);
    })
})
app.use((req,res,next)=>{
    res.locals.isAuthenticated= req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
})


app.use('/admin',adminRoute);
app.use(clientRouter);
app.use(authRouter);


//Error page
app.use("/500",productController.get500);
app.use(productController.getError);

app.use((error,req,res,next)=>{
    console.log(error)
    res.redirect("/500");
})

mongoose.connect(MONGODB_URI).then(result=>{
    console.log("Connected!");
    app.listen(process.env.PORT || 3000);
    console.log("Listening on 3000");
})

