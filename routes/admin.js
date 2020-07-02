const route = require('express').Router();
const uuidv5 = require('uuid').v5;
const MY_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f0000';
// const ROLE_ADMIN = require('../utils/checkRole');
// const { uploadMulter } = require('../utils/config_multer');
const fs = require('fs');
const ADMIN_MODEL = require('../model/Admins');
const PRODUCT_MODEL  = require('../model/Products');

route.post('/login', async (req, res) => {
    let { username, password } = req.body;
     let checkLogin = await ADMIN_MODEL.signIn(username, password);
     console.log(checkLogin);   
     if(checkLogin.error) res.json({ error : true, message : ' phone or password  was been wrong! ' });
     let listProducts = await PRODUCT_MODEL.findAll();
     console.log(listProducts)
     req.session.token = checkLogin.data.token;
     
     return res.render('dashboard/pages/home', { data : listProducts.data });
      
})

route.post('/new-admin', async(req, res) =>{
    let { adminName, email,  phoneNumber, sex, password } = req.body; 
    if(adminName && phoneNumber ){
        let id = uuidv5(phoneNumber, MY_NAMESPACE);
        console.log(id);
        let hadInsertCategory = await ADMIN_MODEL.insert(id.toString(), adminName, password, email, phoneNumber, sex);
        if(hadInsertCategory.error) return res.json({ message:hadInsertCategory.message });
        return res.json(hadInsertCategory)
    }
    return res.json({ error : true, message:'cant_create_admin' });
});
module.exports = route;