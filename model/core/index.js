const { driver } = require('../../config/cf_db')
var session = driver.session();

module.exports = class coreQuery {
    constructor(){
        
    }
    static queryCypher(stringQuery, data) {
        session = driver.session();

        console.log('--------------core')
        console.log(data)
        if(!data){
            const promisResult =  session.run(
                stringQuery
            );
            session.close();
        console.log('--------------1')

        return promisResult;

        }else{
        console.log('--------------2')

            const promisResult =  session.run(
                stringQuery
                ,data
            );
            session.close()
        console.log({promisResult})

        return promisResult;

        }

    };
}