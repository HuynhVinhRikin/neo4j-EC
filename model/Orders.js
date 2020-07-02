const neo4j = require('neo4j-driver');
var uri = 'https://hobby-aaoahnggdnbngbkenbccnmdl.dbs.graphenedb.com:24780/db/data/';
const { driver } = require('../config/cf_db')

// const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('Dat', '123456'));
var session = driver.session();

module.exports = class Orders {
    static queryCypher(stringQuery, data) {
        const promisResult =  session.run(
            stringQuery
            ,data
        );
        return promisResult;
    };
    // Tạo Oder
    static insert(idOrder, idCustomer, productId, timeOrder, addressShip, amout, status) {
        return new Promise(async resolve => {
            try {
                console.log('----------------Thêm hoá đơn mới')
                
                let queryNewOrder               = 'CREATE (a:Orders { id:$id, idCustomer : $idCustomer, idProduct : $listProduct, timeOrder: $timeOrder, addressShip : $ addressShip, totalPrice : $totalPrice, status : $status }) RETURN a'
                let queryProductWithOrders      = 'MATCH (product:Products { id: $productId }),(order:Orders { id:$id}) CREATE (order)-[r:HAVE { HAVE : $amout }]->(product)';
                let queryCustomerWithProduct    = 'MATCH (product:Products { id: $productId }),(customer:Customers { id:$idCustomer }) CREATE (customer)-[r:RELTYPE {BUY : $amout} ]->(product)';
                let queryCustomerWithOrders     = 'MATCH (customer:Customers { id:$idCustomer  }),(order:Orders { id:$id}) CREATE (order)-[:OF ]->(customer)'
                let queryCheckReShipCustomerProducts = `MATCH (:Customers{id :$idCustomer })-[r]->(:Products { id: $productId })
                RETURN r`;

                // let newListProduct = [];
                // listProduct.forEach(product => {
                //         newListProduct.push(product.id);
                // });

                let queryInfoProduct                = `MATCH(p:Products {id:$idProduct})-->(c:Categorys)
                RETURN  p,c`;
                const infoProduct      = await session.run(queryInfoProduct, 
                    { idProduct: productId.trim() });

                let totalPrice = Number(amout) * infoProduct.records[0]._fields[0].properties.price
                
                const newOrder = await session.run(
                    queryNewOrder
                    ,{
                        id          : idOrder,
                        idCustomer  : idCustomer,
                        listProduct : productId,
                        timeOrder   : timeOrder,
                        addressShip : addressShip,
                        totalPrice  : totalPrice,
                        status : status
                    })

                if(!newOrder.records.length) return resolve({ error: true, message :'cant_create_order'});
                    //customer with order
                    const relationshipCustomerWithOrder = await session.run(
                        queryCustomerWithOrders,
                        {
                            idCustomer  : idCustomer,
                            id          : idOrder
                        });
                //  (async ()=> {
                //     for (const product of listProduct) {
                //         let productId = product.id;
                //         let amout = Number(product.amout);
                //             console.log({productId});
                        
                        if(!relationshipCustomerWithOrder) return resolve({ error:true, message :'cant_make_customer_product' });
                        //customer with product
                        const IsrelationshipCustomerWithProduct   = await session.run(
                            queryCheckReShipCustomerProducts,
                            {
                                idCustomer : idCustomer,
                                productId : productId
                            }
                        )
                        const makeRelationshipCustomerWithProduct = await session.run(
                            queryCustomerWithProduct,
                            {
                                productId : productId,
                                idCustomer  : idCustomer,
                                amout       : Number(amout)

                            });
                        if(!makeRelationshipCustomerWithProduct) return resolve({ error:true, message :'cant_make_customer_product' });
                        //Product with order  => orderLine
                        const relationshipOrderWithProduct = await session.run(
                            queryProductWithOrders
                            ,{
                                productId : productId,
                                id          : idOrder,
                                amout     : Number(amout)
                            });
                  

                        if(!relationshipOrderWithProduct) return resolve({ error: true, message:'cant_make_relationship' });
                      
                    // }
                //   })()
                  return resolve({ error: false, message:'true' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }   

    // tất cả order
    static findAll(){
        return new Promise(async resolve => {
            let query              = `MATCH (n:Orders) RETURN n `;
            const listOrders       = await session.run(query);
            

            if(!listOrders.records) return resolve({ error: true, message: 'cant_get_product'})
            return resolve({ error: false, data: listOrders.records });
        })
    }
    // thay đổi thông tin order
    static update(idCustomer, idProduct, amout){
        return new Promise(async resolve => {
            let query              = `MATCH (n:Orders{ Orders.idCutomer = $idCustomer}) RETURN n `;
            const infoOrders       = await session.run(query,
                {idCustomer : idCustomer});
                

            if(!infoOrders.records.length > 0){
                console.log('have order')
            }
            let queryNewOrder = `MATCH ()`
        })
    }
    // cập nhật số lượng sản phẩm
    static updateAmoutProduct(orderID, productID, amout){
        return new Promise(async resolve => {
            let query              = 
            `MATCH (:Orders { id:$orderID , status : 0})-[r]->(product : Products{id :$productID })	
            set r.HAVE = $amout
            RETURN  r`;
            const infoOrders       = await session.run(query,
                {
                    orderID  : orderID,
                    productID   : productID,
                    amout       : Number(amout)
                });
                
                console.log({infoOrders})
            if(!infoOrders.records.length > 0){
                return resolve({ error: true, message: 'cant_get_product'})
            }
            return resolve({ error: false, message: 'success'})
        })
    }
    // Xoá  mối quan hệ trong order
    static removeProduct(orderID, productID, authorID){
        return new Promise(async resolve => {
            let query              = 
            `MATCH (:Orders { id:$orderID , status : 0, idCustomer : $authorID})-[r:HAVE]->(product : Products{id :$productID })	
            DELETE  r`;
            const infoOrders       = await session.run(query,
                {
                    orderID  : orderID,
                    productID   : productID,
                    authorID : authorID
                });
                
                console.log({infoOrders})
            if(!infoOrders){
                return resolve({ error: true, message: 'cant_get_product'})
            }
            return resolve({ error: false, message: 'success'})
        })
    }
    // xóa order
    static delete(idOrder){
        return new Promise(async resolve => {
            let query                = `MATCH (n:Orders{id:$idOrder}) DETACH DELETE n`;
            const resultDelete       = await session.run(query, { idOrder: idOrder });
            

            if(!resultDelete) return resolve({ error: true, message: 'cant_get_order'})
            return resolve({ error: false, message:'delete_order_success' });
        })
    }
    // tìm order của khách hàng theo id khách hàng
    static findByIdCustomer(idCustomer){
        return new Promise(async resolve => {
            console.log({idCustomer})
            let query              = `MATCH (order:Orders{ idCustomer : $idCustomer, status : 0 })	
                 					MATCH (:Orders { id: order.id})-[r]->(product : Products)	
                                    RETURN product, r, order `;
            const listOrders       = await session.run(query, { idCustomer: idCustomer });
            console.log({listOrders2 :listOrders })
            if(listOrders.records.length == 0   ) return resolve({ error: true, message: 'cant_get_product', data : []})
            return resolve({ error: false, data: listOrders.records });
        })
    }
    // thêm sản phẩm vào giỏ hàng chưa thnah toán 
    static addNewProduct(orderID, productID, amout, idCustomer){
        return new Promise(async resolve => {
            console.log({idCustomer})
            let query              = `MATCH (order:Orders{ id : $orderID, status : 0 })	
                                    MATCH (product:Products { id: $productId })
                                    CREATE (order)-[r:HAVE { HAVE : $amout }]->(product)
                                    RETURN product, r, order `;

            let queryCheckRelationshipProductOrder =  `MATCH (:Orders{id :$orderID })-[r]->(:Products { id: $productId })
                                    RETURN r`;
            const isInOrder       = await session.run(queryCheckRelationshipProductOrder, { orderID: orderID, productId:productID });
            if(isInOrder.records.length>0) 
                return  resolve({ error: true, message: 'product_had_beend_added', data : []});

            const listOrders       = await session.run(query, { orderID: orderID, productId:productID, amout:Number(amout) });
            if(listOrders.records.length == 0   ) return resolve({ error: true, message: 'cant_get_product', data : []})
            return resolve({ error: false, data: listOrders.records });
        })
    }


    // thanh toán
    static updateStatusOrder(customerID, orderID, toltalPrice){
        return new Promise(async resolve => {
            console.log({customerID});
            let query              = `MATCH (order:Orders{id : $orderID,  idCustomer : $customerID, status : 0 })
                                    MATCH (cus : Customers{id : $customerID})	
                                    set order.status = $status, order.toltalPrice = $toltalPrice, cus.money = $toltalPrice - cus.money
                                    RETURN  order `;

            // let queryUpdateInfUser =  ` MATCH (cus : Customers{id : $customerID})	
            // set cus.money = $toltalPrice - cus.money return cus`
            // let resulupdate = await session.run(queryUpdateInfUser, {  customerID : customerID, toltalPrice:Number(toltalPrice)});
            const listOrders       = await session.run(query, {  status: 1, orderID : orderID , customerID : customerID, toltalPrice:Number(toltalPrice)});
            if(listOrders.records.length == 0   ) return resolve({ error: true, message: 'cant_update_product', data : []})
            return resolve({ error: false, data: listOrders.records });
        })
    }

    // tìm order

    static findByID(orderID, customerID){
        return new Promise(async resolve => {
            console.log({customerID});
            let query                = `MATCH(o:Orders { id:$orderID, idCustomer:$customerID})-[r:HAVE]-(p:Products)
            RETURN  o,r,p`;
            const listOrders       = await session.run(query, {   orderID : orderID , customerID : customerID });
            if(listOrders.records.length == 0   ) return resolve({ error: true, message: 'cant_update_product', data : []})
            return resolve({ error: false, data: listOrders.records });
        })
    }
    
    static updateQuick(customerID){
        return new Promise(async resolve => {
            console.log({idCustomer});
            let query                = `MATCH(o:Orders { status :  0 , idCustomer:$customerID})
            set o.status = 1
            RETURN  o`;
            const listOrders       = await session.run(query, {  customerID : customerID });
            console.log({listOrderssdsadas  : listOrders});

            if(listOrders.records.length == 0   ) return resolve({ error: true, message: 'cant_update_product', data : []})
            return resolve({ error: false, data: listOrders.records });
        })
    }
}