const express = require('express');
const {check,body} = require('express-validator/check');
const authControllers = require('../controllers/auth');
const User = require('../models/user');
const router = express.Router();

router.get('/login',authControllers.getLogin);

router.post('/login',check('email','Invalid email or password').isEmail().custom((value,{req})=>{
    return User.findOne({email:value})
    .then(user=>{
        if(!user){
            return Promise.reject('Invalid email or password');
        }
    })
}),check("password","Password must be the length of minimum 8 char").isLength({min:8}),
authControllers.postLogin);

router.post('/logout',authControllers.postLogout);
router.get('/signup',authControllers.getSignup);


router.post('/signup',
[
    check('email').isEmail().custom((value,{req})=>{
        return User.findOne({email:value}).then(userDoc=>{
            if(userDoc){
                return Promise.reject("User already exist");
            }
    })
}),
    check('password',"Password must be the length of minimum 8 char").isLength({min:8}),
    body('confirmPassword').custom((value,{req})=>{
        if(value !== req.body.password){
            throw new Error("Password do not matching");
        }
        return true;
    })
]
,authControllers.postSignup);



router.get('/reset',authControllers.getReset);
router.post('/reset',authControllers.postReset);
router.get('/reset/:token',authControllers.getNewPassword);
router.post('/new-password',authControllers.postNewPassword);





module.exports = router;