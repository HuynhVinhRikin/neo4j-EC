const neo4j = require('neo4j-driver');
const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('huynhvinh', '123456'));
// const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('Dat', '123456'));

module.exports = { driver }

