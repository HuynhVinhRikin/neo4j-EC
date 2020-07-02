const route = require('express').Router();
const uuidv5 = require('uuid').v5;
const MY_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
const ROLE_ADMIN = require('../utils/checkRole');
const { sign, verify } = require('../utils/jwt')
const { renderToView }  = require('../utils/childRouting');

// const { uploadMulter } = require('../utils/config_multer');
const fs = require('fs');
const CUSTOMER_MODEL = require('../model/Customer');
const PRODUCT_MODEL  = require('../model/Products');
const ORDER_MODEL = require('../model/Orders');
const CATEGORY_MODEL = require('../model/Categorys');
route.get('/', async (req, res) =>{
    let listProducts = await PRODUCT_MODEL.findLimitSkip(10,0);
    let { token } = req.session;
    //let infoUser = req.session;
    let  idCustomer = '';
    let email = '';
    let listProductsRecomendation = {data : []};
    let listCategory = await CATEGORY_MODEL.findAll();
    console.log('---------->>>>1')
    let listProductBestSell = await  PRODUCT_MODEL.findBestSell();
    let listNewProducts = await PRODUCT_MODEL.getListNewProduct();
    console.log({listNewProducts})
    if(token){
        console.log('---------->>>>2')
            let checkRole       = await verify(token);
            idCustomer          = checkRole.data.id;
            email               =  checkRole.data.name;
            let infoCustomer                    = await CUSTOMER_MODEL.findById(idCustomer);
            //console.log(infoCustomer)
            let listProductsRecomendation       = await PRODUCT_MODEL.findWithOrder(infoCustomer.data.phone);
         
            let infoOder                        = await ORDER_MODEL.findByIdCustomer(idCustomer);
            // Gợi ý những sản phẩm được bán nhiều nhất
            // 2 Những sản phẩm đã tương tác click . dừng lại xem
            let productRforcus = await PRODUCT_MODEL.findWithRForCus(infoCustomer.data.phone);
            console.log({le : listProductsRecomendation})
                // records prodyuct R - forcus
                if(!productRforcus.error && productRforcus.data){
                    productRforcus = productRforcus.data[0];
                    //console.log({productRforcus})
                    if(productRforcus){
                        console.log('------có ')

                        listProductsRecomendation.data.push(productRforcus);
                    }
                } 
                console.log({listProductsRecomendation})
                listProductsRecomendation.data.forEach(item=>{
                        console.log({item : item._fields[0].properties})
                })
            // tim user cung so thich
            let listProUserSameHobbies = await CUSTOMER_MODEL.findUserSameHobbies(infoCustomer.data.phone)
            //console.log({listProUserSameHobbies})

            if(listProductsRecomendation.error || listProductsRecomendation.data.length == 0){
                listProductsRecomendation = await PRODUCT_MODEL.findWithSexAndOld(infoCustomer.data.phone);
            }
            
            if(infoOder.error){
                //console.log('no order');
                renderToView(req, res, 'pages/home', { 
                    email : email, 
                    //infoUser,
                    id : idCustomer,
                    listProductsRecomendation : listProductsRecomendation.data,
                    listOrder : [],
                    listProUserSameHobbies : listProUserSameHobbies.data,
                    listCategory: listCategory.data,
                    listNewProducts : listNewProducts.data
                    });
            }
          
            if(listProducts.error)  res.render('404');
            renderToView(req, res, 'pages/home', { 
                email : email, 
                id : idCustomer,
                listBestSeller : listProductBestSell.data,
                //infoUser,
                listProductsRecomendation : listProductsRecomendation.data,
                listOrder : infoOder.data,
                listProUserSameHobbies : listProUserSameHobbies.data,
                listNewProducts : listNewProducts.data
            });
    } 

    if(listProductsRecomendation.error){
        listProductsRecomendation = []
    }

    listProUserSameHobbies = [];

    renderToView(req, res, 'pages/home', { 
        email : email, 
        //infoUser,
        id :idCustomer,
        listProductsRecomendation : [],
        listBestSeller : listProductBestSell.data,
        listOrder :[],
        listProUserSameHobbies,
        listNewProducts : listNewProducts.data

     });
})

route.get('/login', function (req, res) {
    return res.render('shop/login');
});

route.post('/login', async (req, res) => {
    let { phoneNumber, password } = req.body;

    let checkLogin = await CUSTOMER_MODEL.signIn(phoneNumber, password);
    //console.log({ checkLogin })
    
    if(checkLogin.error) res.json({ error : true, message : 'phone or password was been wrong!' });

    let infoCustomer = await CUSTOMER_MODEL.findByPhone({ phoneNumber })
    console.log(infoCustomer.data[0]._fields[0].properties.name)
    

    req.session.token = checkLogin.data.token;



    // req.session.phoneNumber = req.body.phoneNumber;
    req.session.user = infoCustomer.data;

    return res.json({token :  checkLogin.data.token});


    // // Lấy sản phẩm cửa hàng
    // let listProducts = await PRODUCT_MODEL.findLimitSkip(10,0);

    // let listCategory = await CATEGORY_MODEL.findAll();

    // // Lấy những sản phầm gợi ý cho khách hàng
    // // Khác hàng đã đăng nhập thành công
    // // Xét lại nhưng tương tác của khách hàng với hệ thông theo thú tự
    // // 1 Order
    // // 2 Tuong tác với sản phẩm : click vào xem ( comment ** đang hoàn thiện comment)
    // // 3 giới tinh và độ tuổi ( khi chưa có order thì gợi ý)
    // // Gợi ý theo các cập 1-2  hoặc 2-3
    // // (đang update)  gợi ý theo bình luận +  đánh sao

    // // 1 Lấy những sản phẩm đã order
    // let listProductsRecomendation  = await PRODUCT_MODEL.findWithOrder(phoneNumber);

    // // 2 Những sản phẩm đã tương tác click . dừng lại xem
    // let productRforcus = await PRODUCT_MODEL.findWithRForCus(phoneNumber);
    // // records prodyuct R - forcus
    // if(!productRforcus.error && productRforcus.data){
    //     productRforcus = productRforcus.data[0];
    //     //console.log({productRforcus})
    //     if(productRforcus){
    //         listProductsRecomendation.data.push(productRforcus);
    //     }
    // }
    // // tim user cung so thich
    // let listProUserSameHobbies = await CUSTOMER_MODEL.findUserSameHobbies(phoneNumber)
    // //console.log({listProUserSameHobbies})

    // let infoOder = await ORDER_MODEL.findByIdCustomer(checkLogin.data.infoUSer.records[0]._fields[0].properties.id);
    // //console.log('================================login');
    // //console.log(infoOder)

    // if(listProductsRecomendation.error || listProductsRecomendation.data.length == 0){
    //     //console.log('jion ==')
    //     //  kHi chưa order lần nào 
    //     // Lấy sản  phẩm  phù hơp theo độ tuổi và giới tinh
    //     listProductsRecomendation = await PRODUCT_MODEL.findWithSexAndOld(phoneNumber);
    //     listProductsRecomendation.data.push(productRforcus);
      
    // }
    // if(infoOder.error){
    //     return res.render('shop/home', { 
    //         listData : listProducts.data, 
    //         email : checkLogin.data.infoUSer.records[0]._fields[0].properties.name, 
    //         id : checkLogin.data.infoUSer.records[0]._fields[0].properties.id,
    //         listProductsRecomendation : listProductsRecomendation.data,
    //         listOrder : [],
    //         listProUserSameHobbies : listProUserSameHobbies.data
    //     });
    // }

    // //console.log('==order ?????');

    // let listProductBesthSell = await  PRODUCT_MODEL.findBestSell();
    // if(!listProductBesthSell.error && listProductBesthSell.data){
    //     listProductBesthSell = listProductBesthSell.data[0]
    //     listProductsRecomendation.data.push(listProductBesthSell);
    // }
    
    // //console.log(  {listEc : listProductsRecomendation.data})

    
    // if(listProducts.error)  res.render('404');

    // return res.render('shop/home', { 
    //     listData : listProducts.data, 
    //     email : checkLogin.data.infoUSer.records[0]._fields[0].properties.name, 
    //     id : checkLogin.data.infoUSer.records[0]._fields[0].properties.id,
    //     listProductsRecomendation : listProductsRecomendation.data,
    //     listOrder : infoOder.data,
    //     listProUserSameHobbies :  listProUserSameHobbies.data, 
    //     listCategory: listCategory.data
    // });
       
})

route.get('/checkout', async (req, res) =>{
    let listProducts = await PRODUCT_MODEL.findLimitSkip(10,0);
    let { token } = req.session;
    let  idCustomer = '';
    let email = '';
    let listProductsRecomendation = {data : []};
    // VỚi khách hàng đã đăng nhập
    if(token){
            let checkRole       = await verify(token);
            idCustomer          = checkRole.data.id;
            email               =  checkRole.data.name;
            let infoCustomer                    = await CUSTOMER_MODEL.findById(idCustomer);
            let listProductsRecomendation       = await PRODUCT_MODEL.findWithOrder(infoCustomer.data.phone);
            let infoOder                        = await ORDER_MODEL.findByIdCustomer(idCustomer);
            if(listProductsRecomendation.error || listProductsRecomendation.data.length == 0){
                // Tìm theo độ tuổi và giới tinh
                listProductsRecomendation = await PRODUCT_MODEL.findWithSexAndOld(infoCustomer.phone);
            }
            if(infoOder.error){
                return res.render('shop/checkout', { listData : listProducts.data, 
                    email : email, 
                    id : idCustomer,
                    listProductsRecomendation : listProductsRecomendation.data,
                    listOrder : []
                    });
            }
            
            if(listProducts.error)  res.render('404');
            return res.render('shop/checkout', { listData : listProducts.data, 
                email : email, 
                id : idCustomer,
                listProductsRecomendation : listProductsRecomendation.data,
                listOrder : infoOder.data
                });
    }

    // Khách hàng chưa đăng nhập
    // GỢi ý những sản phẩm nhiều người mua nhất
    listProductsRecomendation = await  PRODUCT_MODEL.findBestSell();
    return res.render('shop/checkout', { listData : listProducts.data, 
        email : email, 
        id :idCustomer, 
        listProductsRecomendation : listProductsRecomendation.data,
        listOrder :[] }); 
});

route.get('/list', ROLE_ADMIN, async(req, res) =>{
    let listProducts = await PRODUCT_MODEL.findLimitSkip(10,0);
    let listCustomer = await  CUSTOMER_MODEL.findAll();
    console.log('hehhajkdjhkashd')
    //console.log({listCustomer})
    if(listCustomer.error) return res.json({ error: true, message:'cant_get_list_products'});
    res.render('dashboard/pages/list-customers',{ data : listCustomer.data });
});

//Danh sách sản phẩm
route.get('/list-products', async(req, res) =>{
    let categoryID = req.query;

    let listProducts = await PRODUCT_MODEL.findLimitSkip(10,0);
    //console.log(listProducts)

    let listProductOfCategory = await PRODUCT_MODEL.findAllProducuctOfCategory({ categoryID })

    let { token } = req.session;
    let  idCustomer = '';
    let email = '';
    let listCategorys = await CATEGORY_MODEL.findAll();
    if(token){
        let checkRole = await verify(token);
        idCustomer = checkRole.data.id;
        email      =  checkRole.data.name;
        infoOder                        = await ORDER_MODEL.findByIdCustomer(idCustomer);
        return res.render('pages/home',{ data : listProducts.data,
            listCategorys : listCategorys.data,
            email : email, 
            id : idCustomer,
            listOrder :infoOder.data,
            listProductOfCategory: listProductOfCategory.data
        });
    }
    if(listProducts.error) return res.json({ error: true, message:'cant_get_list_products'});
    return res.render('shop/shop',{ data : listProducts.data,
        listCategorys : listCategorys.data,
        email : email, 
        id : idCustomer,
        listOrder :[]});
});

//Danh sách sản phẩm thuộc danh mục
route.get('/list-products-of', async(req, res) =>{
    let { categoryID } = req.query;
    let infoUser = req.session;
    let listProductBestSell = await  PRODUCT_MODEL.findBestSell();

    let listCategory = await CATEGORY_MODEL.findAll();
    let listProductOfCategory = await PRODUCT_MODEL.findAllProducuctOfCategory({ categoryID })
    let listNewProducts = await PRODUCT_MODEL.getListNewProduct();


    renderToView(req, res,'pages/listProductOfCategory', { 

        infoUser,
        listProductOfCategory : listProductOfCategory.data,
        listCategory: listCategory.data,
        listBestSeller : listProductBestSell.data,
        listData : listProductOfCategory.data,
        listNewProducts : listNewProducts.data
        
    });
});

//Thêm người dùng
route.post('/new-customer', async(req, res) =>{
    let { customerName, email,  phoneNumber, sex, password } = req.body; 
    if(customerName && phoneNumber ){
        let id = uuidv5(phoneNumber, MY_NAMESPACE)
        //console.log(id);
        let hadInsertCategory = await CUSTOMER_MODEL.insert(id.toString(), customerName, password, email, phoneNumber, sex);
        if(!hadInsertCategory) return res.json({ error : true, message:hadInsertCategory.message });
        return res.json({ error: false, message : hadInsertCategory.message })
    }
    return res.json({ error : true, message:'cant_create_category' });
});

//Tất cả danh mục
route.get('/all-category', async(req, res)=>{
    let listCategorys = await CUSTOMER_MODEL.findAll();
    if(listCategorys.error) return res.json({ error: true, message:listCategorys.message });
    res.json({ error: false, data : listCategorys.data });
})

//Giỏ hàng
route.get('/cart', async(req, res)=>{
    renderToView(req, res, 'pages/cart', { });
})

module.exports = route;