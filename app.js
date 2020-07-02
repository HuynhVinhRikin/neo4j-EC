let express = require('express');
let app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const uuidv5 = require('uuid').v5;

const MY_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f0000';

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(express.static('./public'));
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(cookieParser());

const PRODUCT_ROUTER  = require('./routes/product');
const CATEGORY_ROUTER = require('./routes/category');
const CUSTOMER_ROUTER = require('./routes/customer');
const ORDER_ROUTER    = require('./routes/order');
const ADMIN_ROUTER    = require('./routes/admin');
const COMMENT_ROUTER    = require('./routes/comment');

//model
const PRODUCT_MODEL = require('./model/Products');
const ADMIN_MODEL = require('./model/Admins')
const CATEGORY_MODEL = require('./model/Categorys');
// Setup server port
var port = process.env.PORT || 3000;
//connect to neo4j db
const neo4j = require('neo4j-driver');
var uri = 'https://hobby-aaoahnggdnbngbkenbccnmdl.dbs.graphenedb.com:24780/db/data/';
//const driver = neo4j.driver(uri, neo4j.auth.basic('neo4j', 'b.NEiI7q3qlyim.QGCH21YwvGOxbGQT'));
// const driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('huynhvinh', '123456'));
const expressSession       = require('express-session');
app.use(expressSession({
  secret: 'webRecommend',
  saveUninitialized: true,
  resave: true,
  cookie: {
      maxAge: 10 * 60 * 1000 * 5
  }
}))

//connect 
app.listen(port, function () {
  console.log('working in ' + port);
})

app.use('/products', PRODUCT_ROUTER);
app.use('/categorys', CATEGORY_ROUTER);
app.use('/customers', CUSTOMER_ROUTER);
app.use('/orders', ORDER_ROUTER);
app.use('/admins', ADMIN_ROUTER);
app.use('/comments', COMMENT_ROUTER);


//=========================API AMIN=======================================
app.get('/', function (req, res) {
 return res.redirect('/customers')
});

app.get('/login', async function (req, res) {
  let infoUser = req.session;
  let listCategory = await CATEGORY_MODEL.findAll();
  return res.render('pages/login', { infoUser, listCategory: listCategory.data })
});

app.get('/limit', async (req, res)=> {
  let listProduct = await PRODUCT_MODEL.findLimitSkip(10, 0);
  return res.json(listProduct)
});
 
app.get('/admin',  async(req, res) => {
  let { token } = req.session;
  let listProducts = await PRODUCT_MODEL.findAll();
  if(token){
  let checkrole = token.data.role;
    if(checkrole == 1){
      return res.render('dashboard/pages/home', { data : listProducts.data });
    }
  }
  
  res.render('dashboard/pages/login');
});

app.get('/createAdmin', async (req, res) =>{
  let id = uuidv5('12456789', MY_NAMESPACE);
  console.log(id);
  let hadInsertCategory = await PRODUCT_MODEL.getListProductTop();
});

app.get('/logout', async (req, res) => {
  req.session.token = undefined;
  return res.redirect('/');
})
 

