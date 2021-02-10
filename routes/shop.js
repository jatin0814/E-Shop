const express = require('express');
const path = require('path');
const isAuth = require('../middleware/is-auth');

const shopController = require('../controllers/shop');
const router = express.Router();

router.get('/',shopController.getIndex);
router.get('/cart',isAuth,shopController.getCart);
router.post('/cart',isAuth,shopController.postCart);
router.get('/orders',isAuth,shopController.getOrders);
router.get('/products/:productId',shopController.getProduct);
router.get('/products',shopController.getProducts);
router.get('/checkout',shopController.getCheckout);
router.post('/check-order',isAuth,shopController.postOrders);
router.post('/cart-delete-item',isAuth,shopController.postCartDeleteProduct);
router.get('/order/:orderId',isAuth,shopController.getInvoice)

module.exports = router;