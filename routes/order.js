const route = require('express').Router();
// const { uploadMulter } = require('../utils/config_multer');
const fs = require('fs');
const { sign, verify }      = require('../utils/jwt');

const ORDER_MODEL = require('../model/Orders');
const CUSTOMER_MODEL = require('../model/Customer');
const uuidv5 = require('uuid').v5;
const MY_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
const ROLE_ADMIN = require('../utils/checkRole');

route.get('/list', ROLE_ADMIN, async (req, res) => {
    let listOrders = await ORDER_MODEL.findAll();
    if(listOrders.error) return res.json({ error: true, message:'cant_get_list_products'});
    res.render('dashboard/pages/list-orders',{ data : listOrders.data });
});

route.post('/new-orderline', async(req, res) =>{
    let { categoryName } = req.body; 

    if(categoryName){
        let haDInsertCategory = await CATEGORY_MODEL.insert(categoryName);
        if(!haDInsertCategory) return res.json({ error : true, message:'cant_create_category' });
        return res.json({ error: false, message : 'create_success'})
    }

    return res.json({ error : true, message:'cant_create_category' });
    
});


route.post('/update', async(req, res) =>{
    let { idCustomer, idProduct, amout } = req.body; 
});

// route.post('/new', async(req, res) =>{
//     let { idCustomer, listProduct, timeOrder, addressShip } = req.body; 
//     let { token } = req.session;
//     console.log('==========new order=========')
//     addressShip = '';
//     console.log({idCustomer, listProduct, timeOrder, addressShip});
//     let status = 0;
//     let totalPrice = 2000;
//     if(idCustomer && token){
//         let id = uuidv5(timeOrder, MY_NAMESPACE);
//         let haDInsertOrder = await ORDER_MODEL.insert(id, idCustomer, listProduct, timeOrder, addressShip, totalPrice, status);
//         if(!haDInsertOrder) return res.json({ error : true, message: haDInsertOrder.message });
//         return res.json({ error: false, message: haDInsertOrder.message })
//     }
//     return res.json({ error : true, message:'cant_create_order' });
    
// });

route.post('/new', async(req, res) =>{
    let { productID, amout } = req.body; 
    let { token } = req.session;
    console.log('==========new order=========')
    addressShip = '';
    let status = 0;
    if( token){
        let infoUser = await verify(token);

        console.log( {infoUser})
        console.log( infoUser.data)

        let infoOder    = await ORDER_MODEL.findByIdCustomer(infoUser.data.id);
        console.log( {infoOder})

        // nếu đã có order chưa thnah toán
        if(!infoOder.error){
            //
            let orderID = infoOder.data[0]._fields[2].properties.id;
            let infoUpdateOrder = await ORDER_MODEL.addNewProduct(orderID, productID, amout, infoUser.data.id);
            if(!infoUpdateOrder) return res.json({ error : true, message: infoUpdateOrder.message });
            return res.json({ error: false, message: infoUpdateOrder.message })
        }else{
        // nếu chưa có giỏ hàng nào chưa thanh toán thì tạo một giỏ hàng mới
            let timeOrder = Date.now();
            let id = uuidv5(timeOrder.toString(), MY_NAMESPACE);
            let haDInsertOrder = await ORDER_MODEL.insert(id, infoUser.data.id, productID, timeOrder, addressShip, amout, status);
            if(!haDInsertOrder) return res.json({ error : true, message: haDInsertOrder.message });
            return res.json({ error: false, message: haDInsertOrder.message })
        }
        
        // let id = uuidv5(timeOrder, MY_NAMESPACE);
        // let haDInsertOrder = await ORDER_MODEL.insert(id, idCustomer, listProduct, timeOrder, addressShip, totalPrice, status);
        // if(!haDInsertOrder) return res.json({ error : true, message: haDInsertOrder.message });
        // return res.json({ error: false, message: haDInsertOrder.message })
    }
    return res.json({ error : true, message:'cant_create_order' });
    
});


route.post('/update-amout-product', async(req, res) =>{
    let { productID, amout, orderID } = req.body; 
    let { token } = req.session;
    console.log('==========update amout product=========')
    console.log({ productID, amout, orderID } )
    addressShip = '';
    let status = 0;
    if( token){
        let infoOder    = await ORDER_MODEL.updateAmoutProduct(orderID, productID, amout);
        if(infoOder.error)     return res.json({ error : true, message:'cant_update_order' });
        return res.json({ error : false, message:'update_success' });
    }
    return res.json({ error : true, message:'cant_update_order' });
    
});

route.post('/remove-product', async(req, res) =>{
    let { productID, orderID } = req.body; 
    let { token } = req.session;
    console.log('==========remove  product=========')
    addressShip = '';
    let status = 0;
    if( token){
        let infoUser = await verify(token);
        let authorID = infoUser.data.id;
    console.log({ productID, orderID, authorID } )

        let infoOder    = await ORDER_MODEL.removeProduct(orderID, productID, authorID);
        if(infoOder.error)   return res.json({ error : true, message:'cant_remove' });
        return res.json({ error : false, message:'remove_success' });
    }
    return res.json({ error : true, message:'cant_remove' });
    
});


route.post('/pay', async(req, res) =>{
    let { orderID } = req.body; 
    let { token } = req.session;
    console.log('==========pay  order=========')
    addressShip = '';
    let status = 0;
    if( token){
        let infoUser = await verify(token);
        let authorID = infoUser.data.id;
        infoUser= await CUSTOMER_MODEL.findById(authorID);
        let money = infoUser.data.money.low
        console.log({infoUser});

        console.log({money});
        let infoOder          = await ORDER_MODEL.findByID(orderID, authorID);
        console.log({infoOder});



        // tính tổng tiền của hoá đơn
        let totalPrice = 0;

        infoOder.data.forEach(record =>{
            // lấy sản phẩm
            let price = record._fields[2].properties.newPrice
            if(!price)
                price = record._fields[2].properties.price
            // lấy số lượng sản phẩm
            let amout = record._fields[1].properties.HAVE;
            console.log({price, amout})
            let sumpriceProduct = Number(price) * Number(amout);
            totalPrice += sumpriceProduct
        })
        console.log({totalPrice});
        

        // so sánh tiền hiện tại và tổng tiền hoá đơn của user
        // tiến hành thanh toán và trừ tiền user cập nhật lại số trạng thái hoá đơn
        if(money>=totalPrice){
            let infoOderUpdate    = await ORDER_MODEL.updateStatusOrder(authorID, orderID, totalPrice);
            if(infoOderUpdate.error)   return res.json({ error : true, message:'cant_update' });
            return res.json({ error : false, message:'pay_success', infoOder });
        }else{
            return res.json({ error : true, message:'check_money' });
        }
       
    }
    return res.json({ error : true, message:'cant_remove' });
    
});

route.get('/pay-quick', async(req, res) =>{
    if( token){
        let infoUser = await verify(token);
        let authorID = infoUser.data.id;
        let money = infoUser.money;
        console.log({money});
        let infoOder          = await ORDER_MODEL.updateQuick(authorID);
        res.json({message:'check please'})
    }

});








module.exports = route;