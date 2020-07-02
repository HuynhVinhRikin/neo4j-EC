const neo4j                 = require('neo4j-driver');
const uri                   = 'https://hobby-aaoahnggdnbngbkenbccnmdl.dbs.graphenedb.com:24780/db/data/';

const { hash, compare }     = require('bcrypt');
const { sign, verify }      = require('../utils/jwt');
const { driver } = require('../config/cf_db')

// const driver                = neo4j.driver('bolt://localhost', neo4j.auth.basic('Dat', '123456'));
const session               = driver.session();

/**
 * 
 * thêm comment
 * CREATE (a:Comments { id: '2234324', authorID :'f49aa4ff-ac5c-534d-a334-b753966c0c0e' ,
 *  content : 'dung tot', productsID : '4033504f-6bc4-5be2-970f-4f0036627c87' }) RETURN a
 * thêm mối quan hệ cmt vào sản phẩm
 */
module.exports = class Categorys {
    static insert(id, authorID, content, productID) {
        return new Promise(async resolve => {
            try {
                    const resultPromise = await session.run(                    
                        `
                        MATCH (product:Products { id: $productID }),(customer:Customers { id:$authorID}); 
                        CREATE (comment:Comments { id: $id, author : $authorID, content : $content, productID: $productID  }) 
                        CREATE (comment)-[r:HAVECOMMENT]->(product)
                        CREATE (customer)-[r:WRITECOMMENT]->(comment)
                        RETURN comment`
                        ,{
                            id              : id,
                            authorID        : authorID,
                            content         : content,
                            productID : productID
                        }
                      );
                      console.log(resultPromise);
                    if(!resultPromise) return resolve({ error: true, message: 'cant_insert_comment' });
                    return resolve({ error: false, data: resultPromise });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

    static findAllByProductID(productID){
        return new Promise(async resolve => {
            let query = `MATCH (n:Products{id : $productID}) -[r :HAVECOMMENT]-(com:Comments) RETURN  com`;
            const listCategory = await session.run(query,{productID : productID});
            //console.log(listCategory.records);
            if(!listCategory.records) return resolve({ error: true, message: 'cant_get_category'})
            return resolve({ error: false, data: listCategory.records });
        })
    }
    static deleteById(idCategory){
        return new Promise(async resolve => {
            let query                = `MATCH (n:Categorys{id:$idCategory}) DETACH DELETE n`;
            const resultDelete       = await session.run(query, { idCategory: idCategory });
            if(!resultDelete) return resolve({ error: true, message: 'cant_get_category'})
            return resolve({ error: false, message:'delete_order_success' });
        })
    }
    static update( nameCategory, maleMajority, oldMajority, ){
        return new Promise(async resolve => {
            console.log(nameCategory)
            let query                   = `MATCH (Categorys { name: $nameCategory })
            SET
                 Categorys.oldMajority  = $oldMajority ,
                 Categorys.maleMajority = $maleMajority
            RETURN Categorys`;
            const resultUpdate      = await session.run(query, 
                {   nameCategory    : nameCategory,
                    maleMajority    : maleMajority,
                    oldMajority     : oldMajority });
            console.log(resultUpdate)
            if(!resultUpdate) return resolve({ error: true, message: 'cant_update_category'})
            return resolve({ error: false, message:'update_category_success' });
        })
    }
    
}