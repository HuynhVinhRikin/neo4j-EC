const jwt               = require('./jwt.js');

const route = require('express').Router();
const uuidv5 = require('uuid').v5;
const MY_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
const ROLE_ADMIN = require('../utils/checkRole');
const { sign, verify } = require('../utils/jwt')

const CUSTOMER_MODEL    = require('../model/Customer');
const PRODUCT_MODEL     = require('../model/Products');
const CAMPAINS_MODEL     = require('../model/Campaigns');

const ORDER_MODEL       = require('../model/Orders');
const CATEGORY_MODEL    = require('../model/Categorys');
const fs                = require('fs');

let renderToView = async function(req, res, view, data) {
    let { token } = req.session;

    let listCategory = await CATEGORY_MODEL.findAll();
    let listProductBestSell = await  PRODUCT_MODEL.findBestSell();
    let listProducts = await PRODUCT_MODEL.findLimitSkip(10,0);
    let listNewProducts = await PRODUCT_MODEL.getListNewProduct();
    let topProducts = await PRODUCT_MODEL.getListProductTop();
    let lisCampaigns  =await CAMPAINS_MODEL.findALl();
    let saleProduct = await PRODUCT_MODEL.getSaleOff()

    if(token) {
        let user = await jwt.verify(token);
        console.log(user);
        
        data.infoUser = user.data;
        let infoOder                        = await ORDER_MODEL.findByIdCustomer(user.data.id);
        console.log({infoOder})
        console.log({L :infoOder.data})

        if(!infoOder.error){
            data.infoOder               = infoOder.data
        }else{
            data.infoOder = []
        }    
    
    } else {
        data.infoUser = undefined;
        data.infoOder = []
    }
  
    data.listCategory           = listCategory.data;
    data.listBestSeller         = listProductBestSell.data;
    data.listData               = listProducts.data;
    data.listNewProducts        = listNewProducts.data;
    data.topProduct             = topProducts.data;
    data.lisCampaigns           = lisCampaigns.data;
    data.saleProduct            = saleProduct.data

    

    return res.render(view, data);
}
exports.renderToView = renderToView;