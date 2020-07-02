const neo4j = require('neo4j-driver');
const { hash, compare } = require('bcrypt');
const { sign, verify } = require('../utils/jwt');
const { driver } = require('../config/cf_db')

// const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('Dat', '123456'));
var session = driver.session();

module.exports = class Admins {
    static queryCypher(stringQuery, data) {

        const promisResult =  session.run(
            stringQuery,
            data
        );
        return promisResult;
    };

    // đăng nhập
    static signIn(username, password) {
        return new Promise(async resolve => {
            try {
                let queryCheckAdmin = `MATCH (Admins { username: $username })
                RETURN Admins`;

                const infoUSer = await session.run(

                    queryCheckAdmin, 
                    {
                        username     : username,
                    });

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

    static insert(adminId, adminName, password, email, phoneNumber, sex) {
        return new Promise(async resolve => {
            try {
                let role = 1;
                let queryCheckCustomer = `MATCH (Admins { phone: $phoneNumber })
                RETURN Admins`;

                const checkExist = await session.run(
                    queryCheckCustomer
                    ,{
                        phoneNumber     : phoneNumber,
                    }
                  );

                //if(!checkExist)
                if (checkExist.records.length != 0 )
                    return resolve({ error: true, message: 'phone_existed' });

                let hashPassword = await hash(password, 8);
                console.log(typeof(customerId));

                let queryNewCustomer = `CREATE (a:Admins { 
                    id : $adminId, username : $adminName,
                     email: $email, phone : $phoneNumber, 
                     password :$hashPassword, male : $sex,
                     role :$role }) RETURN a`;
                     
                const newAdmins = await session.run(
                    queryNewCustomer
                    ,{
                        adminId         : adminId,
                        adminName       : adminName,
                        email           : email,
                        phoneNumber     : phoneNumber,
                        sex             : sex,
                        hashPassword    : hashPassword,
                        role            : role
                    }
                  );
                if(!newAdmins.records.length) return resolve({ error: true, message: 'cant_insert_admin' });
                return resolve({ error: false, message: 'create_susscess' });   
            } catch (error) {
                console.log(error)
                return resolve({ error: true, message: error.message });
            }
        });
    }   


    static findAll(){
        return new Promise(async resolve => {
            let query              = `MATCH (n:Orders) RETURN n `;
            const listOrders       = await session.run(query);
            if(!listOrders.records) return resolve({ error: true, message: 'cant_get_product'})
            return resolve({ error: false, data: listOrders.records });
        })
    }

    static update(){
        return new Promise(async resolve => {
            let query              = `MATCH (n:Orders) RETURN n `;
            const listOrders       = await session.run(query);
            if(!listOrders.records) return resolve({ error: true, message: 'cant_get_product'})
            return resolve({ error: false, data: listOrders.records });
        })
    }
    
    static delete(idOrder){
        return new Promise(async resolve => {
            let query                = `MATCH (n:Orders{id:%idOrder}) DETACH DELETE n`;
            const resultDelete       = await session.run(query, { idOrder: idOrder });
            if(!resultDelete) return resolve({ error: true, message: 'cant_get_order'})
            return resolve({ error: false, message:'delete_order_success' });
        })
    }

}