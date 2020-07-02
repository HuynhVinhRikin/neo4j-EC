/*

CREATE (a:Campaigns {id: 'nhuhahasydab123', name: 'Gỉam 20%', image : 'https://salt.tikicdn.com/ts/banner/b6/ff/81/8e54afe90b576e321c14f2892e20f4f9.jpg' } ) RETURN a

MATCH (n:Campaigns)
 MATCH (product:Products { id: '4033504f-6bc4-5be2-970f-4f0036627c87' })
 set product.newPrice = ((product.price)*20)/100

CREATE (product)-[:INCAMPAIGNS ]->(n)

RETURN n LIMIT 25

*/
const neo4j = require('neo4j-driver');
var uri = 'https://hobby-aaoahnggdnbngbkenbccnmdl.dbs.graphenedb.com:24780/db/data/';
const { driver } = require('../config/cf_db')
const queryCypher = require('./core/index')
// const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('Dat', '123456'));
var session = driver.session();

module.exports = class Products {
      // tìm các mối quan hệ của sản phẩm
      static findALl(){
        return new Promise(async resolve=>{
            let query = `MATCH (n:Campaigns) RETURN n LIMIT 5`;
            let resultFind = await session.run(
                query
            );
            // console.log(resultFind.records);
            return resolve({ error : false, message : 'find success', data : resultFind.records });
        })
    }

    static findByID(CampainsID){
        return new Promise(async resolve=>{
            let query = ` MATCH (n:Campaigns{id : $CampainsID})-[:INCAMPAIGNS]-(p:Products)  RETURN p LIMIT 5`;
            let resultFind = await session.run(
                query, { CampainsID: CampainsID }
            );
            // console.log(resultFind.records);
            return resolve({ error : false, message : 'find success', data : resultFind.records });
        })
    }
    

   


}