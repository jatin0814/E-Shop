const Products = require('../models/product');

exports.getAddProduct = (req,res,next)=>{
    //res.sendFile(path.join(__dirname,'../','views','add-product.html'));
    res.render('add-product',
    {pageTitle:'Add-Product',
    path:'/admin/add-product'
})};


exports.postAddProduct = (req,res,next)=>{
    //console.log(req.body);
    const product = new Products(req.body.title);
    product.save();
    //products.push({title:req.body.title});
    res.redirect('/');
};

exports.getShop = (req,res,next)=>{
    //res.sendFile(path.join(__dirname,'../','views','shop.html'));
    const products = Products.fetchAll();
    res.render('shop',
    {prods: products,
    pageTitle:'shop', path:'/',
    hasProducts: products.length > 0
})
};

