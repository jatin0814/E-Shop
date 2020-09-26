const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');


const adminRoute = require('./routes/admin');
const clientRouter = require('./routes/shop');
const productController = require('./controllers/error');

const app = express();

app.set('view engine', 'ejs');
app.set('views','views');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname,'public')));


app.use('/admin',adminRoute);
app.use(clientRouter);

//Error page
app.use(productController.getError);

app.listen(3000);