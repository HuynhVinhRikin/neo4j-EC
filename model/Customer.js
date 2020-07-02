const neo4j                 = require('neo4j-driver');
const uri                   = 'https://hobby-aaoahnggdnbngbkenbccnmdl.dbs.graphenedb.com:24780/db/data/';

const { hash, compare }     = require('bcrypt');
const { sign, verify }      = require('../utils/jwt');
const { driver } = require('../config/cf_db')

// const driver                = neo4j.driver('bolt://localhost', neo4j.auth.basic('Dat', '123456'));
const session               = driver.session();

module.exports = class Customers {
    // Tạo tài khoản mới
    static insert(customerId, customerName, password, email, phoneNumber, sex) {
        return new Promise(async resolve => {
            try {
                console.log({sex})
                let role = 0;
                if(sex =='nam'){
                    sex = '1';
                }else{
                    if(sex =='nữ'){
                        sex = '0';
                    }else{
                        sex = '2';
                    }
                }
                let queryCheckCustomer = `MATCH (Customers { phone: $phoneNumber })
                RETURN Customers`;
                const checkExist = await session.run(
                    queryCheckCustomer
                    ,{
                        phoneNumber     : phoneNumber,
                    }
                  );
                if (checkExist.records.length!=0 )
                    return resolve({ error: true, message: 'phone_existed' });
                let hashPassword = await hash(password, 8);
                console.log(typeof(customerId));
                let queryNewCustomer = 'CREATE (a:Customers { id : $customerId, name : $customerName, email: $email, phone : $phoneNumber, password :$hashPassword, male : $sex, role :$role }) RETURN a';
                const newCustomer = await session.run(
                    queryNewCustomer
                    ,{
                        customerId      : customerId,
                        customerName    : customerName,
                        email           : email,
                        phoneNumber     : phoneNumber,
                        sex             : sex,
                        hashPassword    : hashPassword,
                        role            : role
                    }
                  );
                  
                if(!newCustomer.records.length) return resolve({ error: true, message: 'cant_insert_customer' });
                return resolve({ error: false, message: 'create_susscess' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }
    // đăng nhập
    static signIn(phoneNumber, password) {
        return new Promise(async resolve => {
            try {
                let queryCheckCustomer = `MATCH (Customers { phone: $phoneNumber })
                RETURN Customers`;
                const infoUSer = await session.run(
                    queryCheckCustomer
                    ,{
                        phoneNumber     : phoneNumber,
                    }
                  );
                if (infoUSer.records.length == 0 )
                    return resolve({ error: true, message: 'phone_existed' });
                const checkPass = await compare(password, infoUSer.records[0]._fields[0].properties.password);
                if (!checkPass)
                    return resolve({ error: true, message: 'password_not_exist' });
                await delete infoUSer.password;
                let token = await sign({ data: infoUSer.records[0]._fields[0].properties });
                return resolve({ error: false, data: { infoUSer, token } });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }
    // tất cả khách hàng
    static findAll(){
        return new Promise(async resolve => {
            let query = `MATCH (n:Customers) RETURN n `;
            const listCustomers = await session.run(query);
            if(!listCustomers.records) return resolve({ error: true, message: 'cant_get_product'})
            

            return resolve({ error: false, data: listCustomers.records });
        })
    }
    // tìm theo số điện thoại
    static findByPhone({ phoneNumber }){
        return new Promise(async resolve => {
            let query = `MATCH (n:Customers{phone: $phoneNumber}) RETURN n `;
            const infoCustomer = await session.run(query, { phoneNumber });
            if(!infoCustomer.records) return resolve({ error: true, message: 'cant_get_product'})
            return resolve({ error: false, data: infoCustomer.records });
        })
    }
    // tìm theo ID khách hàng
    static findById(idCutomer){
        return new Promise(async resolve => {
            let query = `MATCH (n:Customers{id :$idCutomer}) RETURN n `;
            const listCustomers   = await session.run(query,
                {idCutomer:idCutomer});
                

            if(!listCustomers.records&&listCustomers.records.length ==0) return resolve({ error: true, message: 'cant_get_customer'});
            

            return resolve({ error: false, data: listCustomers.records[0]._fields[0].properties });
        })
    }
    // XÓa khách hàng
    static delete(idCustomer){
        return new Promise(async resolve => {
            let query                = `MATCH (n:Customers{id:%idCustomer}) DETACH DELETE n`;
            const resultDelete       = await session.run(query, { idCustomer: idCustomer });
            if(!resultDelete) return resolve({ error: true, message: 'cant_get_product'})
            

            return resolve({ error: false, message:'delete_order_success' });
        })
    }
    // Tạo mối quan hệ giữa 2 khach hàng là chung sơ thích
     static makeRsameHobbies(idCustomer){
        return new Promise(async resolve => {
            let query                = ` 
            MATCH (c1:Customers { name: 'nhV' }),(c2:Customers { name: 'nhVtest' })
            CREATE (c2)-[:SAMEHOBBIES ]->(c1)
            CREATE (c1)-[:SAMEHOBBIES ]->(c2)`;
            return true;
            // const resultDelete       = await session.run(query, { idCustomer: idCustomer });

            // if(!resultDelete) return resolve({ error: true, message: 'cant_get_product'})
            return resolve({ error: false, message:'delete_order_success' });
        })
    }
    // Tìm những ng chung sở thích
    static findUserSameHobbies(phone){
        return new Promise(async resolve => {
            let query =   `MATCH (C1:Customers { phone: $phoneN })-[r:SAMEHOBBIES]->(C2: Customers)
            MATCH (:Customers { name: C2.name })-[r2:FORCUS]->( Products) 
            return   Products
            Limit 20
            `
            let listProduct = await session.run(
                query,
                { phoneN : phone }
            );
            // const resultDelete       = await session.run(query, { idCustomer: idCustomer });
            if(!listProduct) return resolve({ error: true, message: 'cant_get_product'})
            return resolve({ error: false, data:listProduct.records });
        })
    }
    // Tìm ra những user có cungf sơ thích theo thuật toán
    static findUserSameHobbiesAlo(phone){
        return new Promise(async resolve => {
            let query =   `CALL algo.nodeSimilarity.stream('Customers | Products', 'FORCUS', {
                direction: 'OUTGOING'
              })
              YIELD node1, node2, similarity
              RETURN algo.asNode(node1).name AS Person1, algo.asNode(node2).name AS Person2, similarity
              ORDER BY similarity DESCENDING, Person1, Person2`
         
            let listProduct = await session.run(
                query,
                { phoneN : phone }
            );
            // const resultDelete       = await session.run(query, { idCustomer: idCustomer });
            if(!listProduct) return resolve({ error: true, message: 'cant_get_product'})
            return resolve({ error: false, data:listProduct.records });
        })
    }

}

/**
 * 
 * 
 *
CALL algo.nodeSimilarity.stream('Customers | Products', 'FORCUS', {
  direction: 'OUTGOING'
})
YIELD node1, node2, similarity
RETURN algo.asNode(node1).name AS Person1, algo.asNode(node2).name AS Person2, similarity
ORDER BY similarity DESCENDING, Person1, Person2
 */