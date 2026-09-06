const jwt = require('jsonwebtoken');
const blacklistModel = require('../models/blacklisttoken-model');


const authuser = async (req,res,next)=>{
    const token = req.cookies.token;

    if(!token){
        return res.status(401).json({message:"token not found"})
    }
        // Check if the token is blacklisted
    const isBlacklisted = await blacklistModel.findOne({ token });

        if(isBlacklisted) {
            return res.status(401).json({ message: "Token is blacklisted" });
        }

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch(err){
        return res.status(401).json({message:"invalid token"})
    }
}
module.exports = {authuser};