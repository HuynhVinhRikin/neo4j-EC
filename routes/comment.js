const route = require('express').Router();
const uuidv5 = require('uuid').v5;
const MY_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f0000';
// const ROLE_ADMIN = require('../utils/checkRole');
// const { uploadMulter } = require('../utils/config_multer');
const fs = require('fs');
const COMMENT_MODEL = require('../model/Comment');
const PRODUCT_MODEL  = require('../model/Products');



route.post('/new', async(req, res) =>{
    let { content, productID } = req.body; 
    let { token } = req.session;
    if(token){
        let infoUser = await verify(token);
        let authorID = infoUser.data.id;

        let date = date.now();
        let keyuuid =  date.toString() + token
        let id = uuidv5(keyuuid, MY_NAMESPACE);
        console.log(id);
        let hadInsertCategory = await COMMENT_MODEL.insert(id.toString(), authorID, content, productID);
        if(hadInsertCategory.error) return res.json({ message:hadInsertCategory.message });
        return res.json(hadInsertCategory)
    }
    return res.json({ error : true, message:'cant_create_comment' });
});
module.exports = route;