const route = require('express').Router();
const ROLE_ADMIN = require('../utils/checkRole');
// const { uploadMulter } = require('../utils/config_multer');
const fs = require('fs');
const CATEGORY_MODEL = require('../model/Categorys');
const uuidv5 = require('uuid').v5;
const MY_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f0009';

route.get('/list', ROLE_ADMIN, async (req, res) => {
    let listCategorys = await CATEGORY_MODEL.findAll();
    if(listCategorys.error) return res.json({ error: true, message:'cant_get_list_products'});
    res.render('dashboard/pages/list-category',{ data : listCategorys.data });
});

route.post('/new-category',ROLE_ADMIN, async(req, res) =>{
    let { categoryName, old, sex } = req.body; 
    let categoryStatus = 1;
    let categoryId =  uuidv5(categoryName, MY_NAMESPACE);
    console.log({categoryId, categoryName, categoryStatus, old, sex})
    if(categoryName){
        let hadInsertCategory = await CATEGORY_MODEL.insert( categoryId, categoryName, categoryStatus, old, sex);
        if(!hadInsertCategory) return res.json({ error : true, message:hadInsertCategory.message });
        return res.json({ error: false, message : hadInsertCategory.message })
    }
    return res.json({ error : true, message:'cant_create_category' });
});

route.get('/new-category', ROLE_ADMIN, async (req, res) => {
    return res.render('dashboard/pages/add-category');
});

route.get('/all-category', async(req, res)=>{
    let listCategorys = await CATEGORY_MODEL.findAll();
    if(listCategorys.error) return res.json({ error: true, message:listCategorys.message });
    res.json({ error: false, data : listCategorys.data });
});

route.post('/delete/:id', async(req, res)=>{
    let id = req.params;
    let isDelete  = await CATEGORY_MODEL.deleteById(id.id);
    if(isDelete.error) return res.render('404');
    return res.json(isDelete);
});




route.get('/update/:id', async(req, res)=>{
    let id = req.params;
    let inforCategory  = await CATEGORY_MODEL.findByID(id)
    console.log(inforCategory.data._fields[0])
    if(!inforCategory) return res.render('404');
    return res.render('dashboard/pages/update-category',{ category :inforCategory.data._fields[0] });
});
route.post('/update',async(req, res)=>{
  let { categoryName, maleManiority, oldMajority } = req.body;
  let isUpdate = await CATEGORY_MODEL.update(categoryName, maleManiority, oldMajority);
  if(isUpdate.error) return res.json({ error : true, message : 'cant_update'});
  return res.json({ error : false, message : 'update_success'});
});


module.exports = route;
