const UserModel = require("../models/usermodel")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")
const BlacklistTokenModel = require("../models/blacklisttoken-model")

dotenv.config()

/**
 * @name registerusercontroller
 * @description this controller is used to register user
 * @route POST /api/auth/register
 * @access public
 */
async function registerusercontroller(req, res){
   
    //gets  info typed by user
  try { const {username, email, password} = req.body

   if(!username || !email ||!password ){
     return res.status(400).json({
      message: "please provide username, email & password"
     })
    }

     const isuserexists = await UserModel.findOne({
        $or: [
          { username },
          { email }
        ]
    }
      )
        if(isuserexists ){
            return res.status(400).json({
                message: "user already exists with this username or email"
            })
        }
          

      const hashedpassword = await bcrypt.hash(password, 10)

      const newuser = await UserModel.create({
        username,
        email,
        password: hashedpassword
      })

const token = jwt.sign({id: newuser._id, username: newuser.username}, process.env.JWT_SECRET, {expiresIn: "1d"})

   const cookieOptions = {
    httpOnly: true, // Prevents client-side JS from reading the cookie
    secure: true,   // Required for cross-origin cookies (forces HTTPS)
    sameSite: 'none', // Allows the cookie to be sent cross-domain
    maxAge: 24 * 60 * 60 * 1000 // 1 day
};

res.cookie("token", token, cookieOptions);

   return res.status(201).json({
    message: "user registered successfully",
    user: {
        id: newuser._id,
        username: newuser.username,
        email: newuser.email
    }
   })}

   catch (error) {
    console.log(error)
    return res.status(500).json({
        message: "something went wrong while registering user"
    })
   }

}

/**
 * @name loginusercontroller
 * @description this controller is used to login user
 * @route POST /api/auth/login
 * @access public
 */

 async function loginusercontroller(req, res){

   try { const {email, password} = req.body

   const isuserexists = await UserModel.findOne({ email });

console.log("USER FOUND:", !!isuserexists);

if (!isuserexists) {
    return res.status(400).json({
        message: "invalid email or password"
    });
}

const ispasswordcorrect = await bcrypt.compare(
    password,
    isuserexists.password
);

console.log("PASSWORD CORRECT:", ispasswordcorrect);
     const token = jwt.sign({id : isuserexists._id, username: isuserexists.username}, process.env.JWT_SECRET, {expiresIn: "1d"})

        const cookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 24 * 60 * 60 * 1000
        };

        res.cookie("token", token, cookieOptions);
        return res.status(200).json({
            message: "user logged in successfully",
            user: {
                id: isuserexists._id,
                username: isuserexists.username,
                email:isuserexists.email
            }
        })}
        catch (error) {
            console.log(error)
            return res.status(500).json({
                message: "something went wrong while logging in user"
            })
        }



 }

/** * @name logoutusercontroller
 * @description this controller is used to logout user
 * @route POST /api/auth/logout
 * @access public
 */
async function logoutusercontroller(req, res){
    try {
            const token = req.cookies.token
        if(!token){
            return res.status(400).json({
                message: "user is not logged in"
            })
        }
        const blacklistedtoken = await BlacklistTokenModel.create({token})
        
        const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
};

res.clearCookie("token", cookieOptions);
        return res.status(200).json({
            message: "user logged out successfully"
        })
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "something went wrong while logging out user"
        })
    }
}

/**
 * @name getmecontroller
 * @description this controller is used to get current logged in user details
 * @route GET /api/auth/get_me
 * @access private
 */

const getmecontroller = async (req, res) => {
    try {
        const user = await UserModel.findById(req.user.id)

        res.status(200).json({
            message: "user details fetched successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
    }
        })
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({   
            message: "something went wrong while fetching user details"
        })
    }
}


module.exports = {
    registerusercontroller,
    loginusercontroller,
    logoutusercontroller,
    getmecontroller
}

