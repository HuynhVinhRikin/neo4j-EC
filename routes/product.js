const route             = require('express').Router();
// const { uploadMulter } = require('../utils/config_multer');
const uuidv5            = require('uuid').v5;
const MY_NAMESPACE      = '1b671a64-40d5-491e-99b0-da01ff1f3341';
const fs                = require('fs');
const { uploadMulter }  = require('../utils/config_multer');
const { sign, verify }  = require('../utils/jwt');
const { renderToView }  = require('../utils/childRouting');


const CUSTOMER_MODEL    = require('../model/Customer');
const ORDER_MODEL       = require('../model/Orders')
const PRODUCT_MODEL     = require('../model/Products');
const CATEGORY_MODEL    = require('../model/Categorys');
const CAMPAIGNS_MODEL    = require('../model/Campaigns');
const COMMENT_MODEL    = require('../model/Comment');



const ROLE_ADMIN        = require('../utils/checkRole');

//=============================public=========================
route.get('/single-product', async(req, res) => {
    let  {id}         = req.query;
    let { token }   = req.session;
    let  idCustomer = '';
    let email   = '';
    console.log(id)
    console.log('====================++++++++++++++')
    let listProductOfCategory = await PRODUCT_MODEL.findWithCategoryByProductID(id)
    let  lisProductsPayedInAOrderByID = await PRODUCT_MODEL.getProductsPayedInAOrderByID(id);
    let  listComment = await COMMENT_MODEL.findAllByProductID(id)
    console.log({listComment})

    console.log({lisProductsPayedInAOrderByID})
    if(lisProductsPayedInAOrderByID.error) lisProductsPayedInAOrderByID.data = []
    if(token){
        let checkRole = await verify(token);
        idCustomer = checkRole.data.id;
        email      =  checkRole.data.name;
        let dataFind =  await PRODUCT_MODEL.findByID(id);
        let time = 1;
        if(dataFind.error) return res.render('404');
        let infoOder = await ORDER_MODEL.findByIdCustomer(idCustomer);
        console.log(infoOder);
        if(infoOder.error){
            return renderToView(req, res, 'pages/single-product', {  product: dataFind.data._fields[0].properties, category :  dataFind.data._fields[1].properties,
                id : idCustomer,
                email : email,
                listOrder    : [],
                listProductOfCategory : listProductOfCategory.data,
                lisProductsPayedInAOrderByID : lisProductsPayedInAOrderByID.data,
                listComment : listComment.data
                });
        }
            return renderToView(req, res, 'pages/single-product', { 
                product: dataFind.data._fields[0].properties,
                category :  dataFind.data._fields[1].properties,
                email : email, 
                id : idCustomer,
                listOrder : infoOder.data,
                listProductOfCategory : listProductOfCategory.data,
                lisProductsPayedInAOrderByID : lisProductsPayedInAOrderByID.data,
                listComment : listComment.data

            });
    }
    let dataFind =  await PRODUCT_MODEL.findByID(id);
    console.log(dataFind);
    if(dataFind.error) return res.render('404');
    return renderToView(req, res, 'pages/single-product', { product: dataFind.data._fields[0].properties, category :  dataFind.data._fields[1].properties,
    id : idCustomer,
    email : email,
    listOrder    : [],
    listProductOfCategory : listProductOfCategory.data,
    lisProductsPayedInAOrderByID : lisProductsPayedInAOrderByID.data,
    listComment : listComment.data
});
});

// route.get('/single-product2', async(req, res)=>{
//     let  id         = req.params;
//     let { token }   = req.session;
//     let  idCustomer = '';
//     let email   = '';
//     console.log(id)
//     if(token){
//         let checkRole = await verify(token);
//         idCustomer = checkRole.data.id;
//         email      =  checkRole.data.name;
//         let dataFind =  await PRODUCT_MODEL.findByID(id.idProduct);
//         if(dataFind.error) return res.render('404');
//         let infoOder = await ORDER_MODEL.findByIdCustomer(idCustomer);
//         if(infoOder.error){
//             renderToView(req, res, 'pages/single-product', {  product: dataFind.data._fields[0].properties, category :  dataFind.data._fields[1].properties,
//                 id : idCustomer,
//                 email : email,
//                 listOrder    : [] 
//                 });
//         }
//         renderToView(req, res, 'pages/single-product2', { 
//             product: dataFind.data._fields[0].properties,
//             category :  dataFind.data._fields[1].properties,
//             email : email, 
//             id : idCustomer,
//             listOrder : infoOder.data
//         });
//     }
//     let dataFind =  await PRODUCT_MODEL.findByID(id.idProduct);
//     console.log(dataFind);

//     if(dataFind.error) return res.render('404');

//     return renderToView(req, res, 'pages/single-product2', { 
//         product: dataFind.data._fields[0].properties, 
//         category :  dataFind.data._fields[1].properties,
//         id : idCustomer,
//         email : email,
//         listOrder    : [] 
//     });
// });

route.post('/search', async(req, res)=>{
    let { nameProduct } = req.body;
    let listProduct = await PRODUCT_MODEL.findWithCategory(nameProduct)
    if(!listProduct) return res.json({ error : true, message:'cant_create_product' });
    return res.json({ error: false, message : 'success', data: listProduct})
});

route.post('/find/:id_product', async(req, res)=>{
    let { id_product } = req.params;
    let listProduct = await PRODUCT_MODEL.findByID(id_product);
    if(!listProduct) return res.json({ error : true, message:'cant_create_product' });
    return res.json({ error: false, message : 'success', data: listProduct})
});



route.post('/search-with-orders', async(req, res)=>{
    let { nameCustomer }    = req.body;
    let listProduct      = await PRODUCT_MODEL.findWithOrder(nameCustomer);
    if(!listProduct) return res.json({ error : true, message:'cant_create_product' });
    return res.json({ error: false, message : 'success', data: listProduct})
});
//===============================ADMIN================================
route.get('/list',ROLE_ADMIN, async (req, res) => {
    let listProducts = await PRODUCT_MODEL.findAll();
    if(listProducts.error) return res.json({ error: true, message:'cant_get_list_products'});
    res.render('dashboard/pages/list-product-detail',{ data : listProducts.data });
});

route.post('/new-product',ROLE_ADMIN, uploadMulter.single('avatar'), async(req, res) =>{
    let { productName, category, amout, price }  = req.body;  
    let infoFile                                 = req.file;
    let idProduct                                = uuidv5(productName, MY_NAMESPACE);
    let image                                    = `/img/products/${infoFile.originalname}`;
    if(productName&&amout){
        let haDInsertProduct = await PRODUCT_MODEL.insert(idProduct, productName, category, image, Number(amout), Number(price));
        if(haDInsertProduct.error)  return res.json({ error : true, message:haDInsertProduct.message });
        return res.json({ error : false, message:'cant_create_product' });
    }
    return res.json({ error : true, message:'cant_create_product' });
});

route.get('/new-product',ROLE_ADMIN, async(req, res) =>{
    let listCategory = await CATEGORY_MODEL.findAll();
    if(listCategory.error) return res.json({ error: false});
    return res.render('dashboard/pages/add-product', { data : listCategory.data });
});


route.post('/all-products', async(req, res)=>{
    let listProducts = await PRODUCT_MODEL.findAll();
    if(listProducts.error) return res.json({ error: true, message:'cant_get_list_products'});
    res.json({error: false, data : listProducts.data});
});

route.post('/find-rela', async(req, res)=>{
    let dataFind =  await PRODUCT_MODEL.findRelationship();
    console.log(dataFind);
    return res.json(dataFind);
});

route.post('/watchs/:name', async(req, res)=>{
    let  nameProduct  = req.params.name;
    console.log(nameProduct);
    let listProducts = await PRODUCT_MODEL.findWithCategory(nameProduct);
   
    if(listProducts.error) return res.json({data:'', message :  listProducts.message });
    return res.json(listProducts);
});

route.post('/forcus', async(req, res)=>{
    let { idProduct, time } = req.body;
    let { token }   = req.session;
    console.log('----------------------------------------- da vao ')
   
    if(token){
        let checkRole = await verify(token);
        console.log('----------------------------------------- day ')

        let idCustomer = checkRole.data.id;
        console.log( { idProduct, idCustomer, time });
        let listProduct = await PRODUCT_MODEL.makeRealtionForcus(idProduct, idCustomer, time);
        console.log(listProduct);
        if(!listProduct) return res.json({ error : true, message:'cant_create_product' });
        return res.json({ error: false, message : 'success', data: listProduct})
    }else{
        return res.json({ error: true, message : 'success' })
    }
  
});


route.post('/age', async(req, res)=>{
    let listProduct = await PRODUCT_MODEL.findWithSexAndOld();
    console.log(listProduct.data.records[0]);
    if(!listProduct) return res.json({ error : true, message:'cant_create_product' });
    return res.json({ error: false, message : 'success', data: listProduct})
});


route.post('/delete/:id', async(req, res)=>{
    let idProduct = req.params;
    console.log({idProduct})
    let idDelete  = await PRODUCT_MODEL.deleteByID(idProduct.id);
    console.log(idDelete);
    if(idDelete.error)  return res.json({message :'cant_delete'});
    return res.json({ message : 'delete_success' });
});

route.get('/update/:id', async(req, res)=>{
    let idProduct = req.params;
    let inforProduct  = await PRODUCT_MODEL.findByID(idProduct.id);
    console.log(inforProduct)
    if(!inforProduct) return res.render('404');
    return res.render('dashboard/pages/update-product',{product : inforProduct.data._fields[0], category :inforProduct.data._fields[1] });
});
route.post('/update', uploadMulter.single('avatar'),async(req, res)=>{
    let { id, productName, category, amout, price,imagelink }  = req.body;  
    let infoFile                                 = req.file;
    if(infoFile){
        imagelink                                    = `/img/products/${infoFile.originalname}`;
    }
    let isUddate = await PRODUCT_MODEL.update(id, productName, amout, price, imagelink);
    if(isUddate.error){
        return res.json({message : 'cant_update'});
    }
    return res.json({ message : 'update_success'});
});

route.post('/find-with-categorys/', async(req, res)=>{
    let { categoryID, skip } = req.body;
    console.log({ categoryID, skip })
    let listProduct = await PRODUCT_MODEL.findAllProducuctOneCategory(categoryID, Number(skip));
    if(listProduct.error) return res.json();
    return res.json(listProduct.data);
});

route.post('/find-price', async(req, res)=>{
    let { startPrice, endPrice } = req.body;
    let listProduct = await PRODUCT_MODEL.findWithPrice(Number(startPrice), Number(endPrice));
    if(listProduct.error) return res.json();
    return res.json(listProduct.data);
});

route.post('/find-with-key', async(req, res)=>{
    let { startPrice, endPrice } = req.body;

    let listProduct = await PRODUCT_MODEL.findWithPrice(Number(startPrice), Number(endPrice));
    if(listProduct.error) return res.json();
    return res.json(listProduct.data);
});

route.get('/find-with-campaigns/:idCampains', async(req, res)=>{
    let { idCampains } = req.params;
    let listProduct = await CAMPAIGNS_MODEL.findByID(idCampains);
    console.log({listProduct});
    if(listProduct.error) return res.json();
    return renderToView(req, res, 'pages/listProductOfCampaigns', { 
       listCampains : listProduct.data
    });
});

route.post('/comment', async(req, res)=>{
    let { productID, content } = req.body;
    let { token }   = req.session;
    if(token){
        let checkRole = await verify(token);
        idCustomer = checkRole.data.id;
        email      =  checkRole.data.name;
        let listProduct = await COMMENT_MODEL.insert(id, authorID, content, productID);
    if(listProduct.error) return res.json();
        console.log(infoOder);
    }
   
    return res.json(listProduct.data);
});

module.exports = route;