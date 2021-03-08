const Products = require('../models/product');
const fileHelper = require('../util/file')
const mongoose = require('mongoose');

exports.getAddProduct = (req,res,next)=>{
    //res.sendFile(path.join(__dirname,'../','views','add-product.html'));
    res.render('admin/edit-product',
    {pageTitle:'Add-Product',
    path:'/admin/add-product',
    editing:false,
    isAuthenticated: req.session.isLoggedIn
})};


exports.postAddProduct = (req,res,next)=>{
    console.log("in add product")
    //const _id = new mongoose.Types.ObjectId('5fe5b3ba2574f9289000c302')
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    if(!image){
        return res.render('admin/edit-product',
        {pageTitle:'Add-Product',
        path:'/admin/add-product',
        editing:false,
        isAuthenticated: req.session.isLoggedIn
    })
    } 
    const imageUrl = image.path;
    console.log(imageUrl)
    const product = new Products({
        title:title,
        price:price,
        description:description,
        imageUrl:imageUrl,
        userId:req.user
    });
    console.log(product)
    product.save()
        .then(result =>{
         res.redirect('/');
        }).catch(err=>{
        console.log("in catch")    
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);    
    })
};

exports.getEditProduct = (req,res,next)=>{
   const editMode = req.query.edit;
    if(!editMode){
        return res.redirect('/');
    }
    const productId = req.params.productId;
    Products.findById(productId)
    .then(product=>{
        if(!product){
            return res.redirect('/')
        }
        res.render('admin/edit-product.ejs',{
        pageTitle:"Edit Product",
        path:"/edit-product",
        editing:editMode,
        product:product,
        
    })
}).catch(err=>{
    console.log("in catch")    
    const error = new Error(err);
    error.httpStatusCode = 500;
    next(error);    
})
}

exports.postEditProduct = (req,res,next)=>{
    const productId = req.body.productId;
    const updateTitle = req.body.title;
    const image = req.file;
    console.log(image);
    const updatePrice = req.body.price;
    const updateDescription = req.body.description;
    Products.findById(productId).then(product=>{
        if(product.userId.toString()!==req.user._id.toString()){
            return res.redirect('/');
        }
        product.title=updateTitle
        product.price=updatePrice
        product.description = updateDescription
        if(image){
        fileHelper.deleteFile(product.imageUrl)
        product.imageUrl=image.path
        }
        return  product.save()
        .then(result => {
            console.log("Product UPDATE");
            res.redirect('/admin/products');
        })
    })
    .catch(err => {
        console.log("in catch")
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);
    })  
}

exports.getAdminProducts= (req,res,next)=>{
    Products.find({userId:req.user._id})
    .then(product=>{
        res.render('admin/products',{
            prods:product,
            pageTitle:'Admin Products',
            path:'/admin/products',
            
        });
    })
};

exports.postDeleteProduct = (req,res,next) =>{
    const productId = req.body.productId;
    Products.findById(productId).then(product=>{
        if(!product){
            return new Error("Product not found!!")
        }
        fileHelper.deleteFile(product.imageUrl);
        return Products.deleteOne({_id:productId,userId:req.user._id}) 
    }).then(result => {
        res.redirect('/admin/products');
    })
    .catch(err=>{
        console.log("in catch")    
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);    
    })
}