//shop.js
const fs = require('fs')
const path = require("path")
const PDFDocument = require('pdfkit');
const Products = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 1;

exports.getProducts = (req,res,next)=>{
    Products.find()
    .then(products=>{
        res.render('shop/product-list',{
            prods:products,
            path:'/products',
            pageTitle:'Products',
           
        })
    }).catch(err=>{
        console.log("in catch")    
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);    
    })
};

exports.getIndex = (req,res,next)=>{
    let totalProduct;
    const page = +req.query.page || 1;
    Products.countDocuments().then(num=>{
        console.log(num)
        totalProduct = num;
        return Products.find()
        .skip((page-1)*ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE)
    })
    .then(products=>{
        //console.log(products);
        res.render('shop/index',{
            prods:products,
            path:'/',
            pageTitle:'Main',
            currentPage:page,
            totalProducts:totalProduct,
            hasNextPage: ITEMS_PER_PAGE*page < totalProduct,
            hasPrevPage:page > 1,
            nextPage:page+1,
            prevPage:page-1,
            lastPage:Math.ceil(totalProduct/ITEMS_PER_PAGE)
        })
    }).catch(err=>{
        console.log("in catch")    
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);    
    })
};


exports.getProduct = (req,res,next)=>{
    const id = req.params.productId;
    Products.findById(id)
    .then(product=>{
        console.log(product);
        res.render('shop/product-detail.ejs',{
            product:product,
            pageTitle:'Product Details',
            path:'/products',
            
        });
    })
}

exports.getCart = ((req,res,next)=>{
   // console.log("product");
   console.log(req.user.cart)
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user=> {
        //console.log(user.cart.items);
        const product = user.cart.items;
            res.render('shop/cart',{
            path:'/cart',
            pageTitle:'Your Cart',
            products:product,   
        });
    }).catch(err=>{
        console.log("error");
    })
})

exports.postCart = ((req,res,next)=>{
    const productId = req.body.prodId;
    Products.findById(productId).then(product=>{
        req.user.addToCart(product).then(result=>{
            res.redirect('/');
        })
    })
    
})

exports.getCheckout = ((req,res,next)=>{
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user=> {
        //console.log(user.cart.items);
        const product = user.cart.items;
        console.log("product")
        console.log(product)
            total = 0;
            product.forEach(p=>{
                total+=p.quantity*p.productId.price;
            })
            res.render('shop/checkout',{
            path:'/checkout',
            pageTitle:'checkout',
            products:product,
            totalPrice:total   
        });
    }).catch(err=>{
        console.log("error");
    })
})


exports.postOrders = ((req,res,next)=>{
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user=> {
        console.log(user.cart.items);
        const product = user.cart.items.map(i=>{
            return {product:{...i.productId._doc},quantity:i.quantity};
        })
        const order = new Order({
            user:{
                email:req.user.email,
                userId:req.user
            },
            products:product
        })
        return order.save();
    })
    .then(result=>{
        return req.user.clearCart();
    })
    .then(()=>{
        res.redirect('/')
    }) 
    .catch(err=>{
        console.log("in catch")    
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);    
    })
})
  

exports.getOrders = ((req,res,next)=>{
   Order.find({'user.userId':req.user._id}).then(orders=>{
      // console.log(orders);
    res.render('shop/orders.ejs',{path:'/orders',pageTitle:'Orders',orders:orders});
   })
})


exports.postCartDeleteProduct = (req,res,next) =>{
        const productId = req.body.productId;
       req.user.removeFromCart(productId).then(result=>{
           res.redirect('/cart');
       }).catch(err=>{
        console.log("in catch")    
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);    
    })
}


exports.getInvoice = (req,res,next) => {
    const orderId = req.params.orderId;
    Order.findById(orderId).then(order=>{
        if(!order){
            console.log("in if")
            return next(new Error("no order found!"))
        }
        if(order.user.userId.toString()!==req.user._id.toString()){
            console.log("in if")
            return next(new Error("unauthorized"))
        }
        const invoiceName = "invoice-" + orderId + ".pdf";
        const invoicePath = path.join("Data","Invoices",invoiceName);
        const pdfDoc = new PDFDocument();
        res.setHeader('Content-Type','application/pdf')
        res.setHeader('Content-Disposition','inline; filename="' +invoiceName +'"')
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);
        pdfDoc.fontSize(30).text("Invoice",{
            underline:true
        });
        pdfDoc.text("---------------------");
        let totalPrice = 0;
        order.products.forEach(prod=>{
            totalPrice += prod.product.price;
            pdfDoc.text(
                prod.product.title + "-" + prod.quantity + "x" + prod.product.price
            )
        })
        pdfDoc.text("---------------------");
        pdfDoc.text("Sum:- $" + totalPrice)
        pdfDoc.end();
        // fs.readFile(invoicePath),(err,data)=>{
        //     if(err){
        //         return next(err);
        //     }
            // const file = fs.createReadStream(invoicePath);
            // file.pipe(res);
        })
    .catch(err=>{
        console.log("in catch")
        next(err);
    })
}