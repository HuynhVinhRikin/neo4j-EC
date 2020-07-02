const { sign, verify } = require('../utils/jwt')
module.exports = async function (req, res, next) {
    let { token } = req.session;

    if (!token)
     return res.json({ error: true, message :'' });
    let checkRole = await verify(token);
    if (checkRole.data.role == 2)
        return res.json({ error: false, message :'admin'});
    if (checkRole.data.role == 0)
        return res.json({ error: true, message :'' });
    next();
}