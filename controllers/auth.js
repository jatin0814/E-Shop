const crypto = require('crypto');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransporter = require('nodemailer-sendgrid-transport');
const User = require('../models/user');


const transporter = nodemailer.createTransport(sendgridTransporter({
    auth:{
        api_key:"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"
    }
}))

exports.getLogin = (req,res,next) =>{
    //console.log(req.session);
    //const isLoggedIn = req.get('Cookie').split("=")[1] === 'true';
    let message = req.flash('error');
    //let message2 = req.flash('succeed');
    if(message.length > 0){
        message = message[0];
    }
    else{
        message=null;
    }
    res.render('auth/login',
    {path:'/login',
    pageTitle:'Login',
    errorMessage: message,
    oldInput:{
        email:"",
        password:"",
    }
});
}

exports.postLogin = (req,res,next) =>{
    const email = req.body.email;
    const password = req.body.password;
    const error = validationResult(req);
    if(!error.isEmpty()){
        return res.status(422).render('auth/login',{path:'/login',
        pageTitle:'Login',
        isAuthenticated: req.session.isLoggedIn,
        errorMessage:error.array()[0].msg,
        oldInput:{
            email:email,
            password:password
        }
     })
    }
    User.findOne({email:email})
    .then(user=>{
        bcrypt.compare(password,user.password)
        .then(doMatch=>{
          if(doMatch){
              req.session.isLoggedIn = true;
              req.session.user = user;
              return req.session.save(err=>{
                  console.log(err);
                res.redirect('/');
              }) 
          }
          req.flash('error','Invalid email or password');
          return res.redirect('/login');
        })  
    }).catch(err=>{
        console.log(err);
    }) 
    //res.setHeader("set-cookie","loggedIn=true");
}

exports.postLogout = (req,res,next)=>{
    req.session.destroy(()=>{
        res.redirect('/');
    })
}

exports.getSignup = (req,res,next)=>{
    let message = req.flash('error');
    if(message.length > 0){
        message = message[0];
    }
    else{
        message=null;
    }
   res.render('auth/signup',{path:'/signup',
   pageTitle:'Signup',
   isAuthenticated: req.session.isLoggedIn,
   errorMessage:message,
   oldInput:{
       email:"",
       password:"",
       confirmPassword:""
   }
})
}

exports.postSignup = (req,res,next)=>{
   const email = req.body.email;
   const password = req.body.password;
   const error = validationResult(req);
   if(!error.isEmpty()){
       return res.status(422).render('auth/signup',{path:'/signup',
       pageTitle:'Signup',
       isAuthenticated: req.session.isLoggedIn,
       errorMessage:error.array()[0].msg,
       oldInput: {
           email:email,
           password:password,
           confirmPassword:req.body.confirmPassword
       }
    })
   }
       return bcrypt.hash(password,12)
       .then(hashPassword=>{
        const user = new User({
            email:email,
            password:hashPassword,
            cart:{items:[]}
        })
        req.flash('succeed',"Account created successfully, please login");
        return user.save();
   }).then(result=>{
    res.redirect('/login');
    return transporter.sendMail({
        to:email,
        from:"jatinnode009@gmail.com",
        subject:"hello",
        html:"<h1>Account created successfuly</h1>"
    })
    })
    .catch(err=>{
        console.log(err);
    })
 }


 exports.getReset = (req,res,next) =>{
    let message = req.flash('error');
    if(message.length > 0){
        message = message[0];
    }
    else{
        message=null;
    }
        res.render('auth/reset.ejs',{
            path:'/reset',
            pageTitle:'Reset Password',
            errorMessage:message
        })
 }

 exports.postReset = (req,res,next) =>{
    crypto.randomBytes(32,(err,buffer)=>{
        if(err){
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({email:req.body.email})
        .then(user=>{
            if(!user){
                console.log("user Not found")
               req.flash("error","User Not Found");
               return res.redirect('/reset');
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            return user.save()  
            .then(result=>{
                res.redirect('/');
                transporter.sendMail({
                    to:req.body.email,
                    from:"jatinnode009@gmail.com",
                    subject:"Reset Password",
                    html:`
                        <p>You requested for Password Reset</p>
                        <p><a href="http://localhost:3000/reset/${token}">click here</a> to reset password</p>
                    `
                })
            })
        })
        .catch(err=>{
            console.log(err);
        })
    })
}



exports.getNewPassword = (req,res,next) =>{

    const token = req.params.token;
    User.findOne({resetToken:token,resetTokenExpiration:{$gt:Date.now()}})
    .then(user=>{
    let message = req.flash('error');
    if(message.length > 0){
        message = message[0];
    }
    else{
        message=null;
    }
        res.render('auth/new-password.ejs',{
            path:'/new-password',
            pageTitle:'New Password',
            errorMessage:message,
            userId:user._id.toString(),
            userToken:token
        })
    })
    .catch(err=>{
        console.log(err);
    })
}

exports.postNewPassword = (req,res,next)=> {
    const newPassword = req.body.password;
    const userToken = req.body.userToken;
    const userId = req.body.userId;
    User.findOne({_id:userId,resetToken:userToken,resetTokenExpiration:{$gt:Date.now()}}).then(user=>{
        bcrypt.hash(newPassword,12)
        .then(hashPassword=>{
        user.password = hashPassword;
        user.resetToken = undefined;
        user.resetTokenExpiration = undefined;
        return user.save();
    }).then(result=>{
        res.redirect('/login');
    })
    .catch(err=>{
        console.log(err);
    })
    })
}