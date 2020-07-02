const neo4j = require('neo4j-driver');
const uri     = 'https://hobby-aaoahnggdnbngbkenbccnmdl.dbs.graphenedb.com:24780/db/data/';
const { driver } = require('../config/cf_db')

// const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('Dat', '123456'));
const session = driver.session();

module.exports = class Categorys {
    static insert(id, categoryName, categoryStatus, oldMajority, maleMajority) {
        return new Promise(async resolve => {
            try {
                const checkId = await session.run(                    
                    'match (Categorys{id: $id}) return Categorys'
                    ,{
                        id : id
                    }
                  );
                  
                  if(checkId.records.length == 0){
                    const resultPromise = await session.run(                    
                        'CREATE (a:Categorys { id: $id, name : $categoryName, status : $categoryStatus, oldMajority: $oldMajority, maleMajority: $maleMajority }) RETURN a'
                        ,{
                            id              : id,
                            categoryName    : categoryName,
                            categoryStatus  : categoryStatus,
                            oldMajority     : oldMajority,
                            maleMajority    : maleMajority
                        }
                      );
                      console.log(resultPromise);
                    if(!resultPromise) return resolve({ error: true, message: 'cant_insert_category' });
                    return resolve({ error: false, data: resultPromise });
                  }
                  return resolve({ error: true, message: 'cant_insert_category' });
            } catch (error) {
                return resolve({ error: true, message: error.message });
            }
        });
    }

    static findAll(){
        return new Promise(async resolve => {
            let query = `MATCH (n:Categorys) RETURN n `;
            const listCategory = await session.run(query);
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
            //console.log(nameCategory)
            let query                = `MATCH (Categorys { name: $nameCategory })
            SET
                 Categorys.oldMajority = $oldMajority ,
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

    static findByID(categoryId){
        return new Promise(async resolve => {
            if(categoryId){
                console.log('join')
                let query                = `MATCH(c:Categorys {id:$categoryId})
                RETURN  c`;
                const resultFind      = await session.run(query, 
                    { categoryId: categoryId.id });
                if(resultFind.records.length < 1 ) return resolve({ error: true, message: 'cant_get_category'})
                return resolve({ error: false, message:'get_success', data : resultFind.records[0] });
            }
            return resolve({ error: true, message: 'cant_get_category'});
        })
    }

    static findWithSexAndOld(old, sex){
        return new Promise(async resolve => {
            let query = `MATCH (:Categorys { old: $old })
            RETURN Categorys`;
            const listCategory = await session.run(query);
            return resolve({ error: false, data: listCategory });
            // if(!listCustomers.records) return resolve({ error: true, message: 'cant_get_product'})
            // return resolve({ error: false, data: listCustomers.records });
        })
    }

}