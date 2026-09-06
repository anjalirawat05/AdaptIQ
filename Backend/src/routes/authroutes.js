const express = require ("express")
const authcontrollers = require("../controllers/authcontrollers")
const authMiddleware = require("../middlewares/authmiddleware")

const authrouter = express.Router()

/**
 * @route POST /api/auth/register
 * @description this route is used to register user
 * @access public
 */
// since we are submitting the user details in the databasse, it is a post req
authrouter.post( "/register", authcontrollers.registerusercontroller)


/**
 *  @route POST /api/auth/login
 * @description this route is used to login user
 * @access public
 */
authrouter.post("/login", authcontrollers.loginusercontroller)

/**
 * @route POST /api/auth/logout
 * @description this route is used to logout user
 * @access public
 */
authrouter.post("/logout", authcontrollers.logoutusercontroller)

/**
 * @route GET /api/auth/get_me
 * @description this route is used to get current logged in  user details
 * @access private
 */
authrouter.get("/get-me", authMiddleware.authuser, authcontrollers.getmecontroller)

 




module.exports = authrouter