//find userId from cookie


import jwt from "jsonwebtoken";

const userAuth=async (req,res,next) => {
    const {token}=req.cookies;


    if(!token){
         return res.json({sucess:false,message:"Not Authorized,Login again"})

    }

    try {
        //decoding token
     const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

     if(tokenDecode.id){
        req.body = req.body || {};
        req.body.userId=tokenDecode.id
     }else{
         return res.json({sucess:false,message:"Not Authorized,Login again"})
     }
     next();
        
    } catch (error) {
         return res.json({sucess:false,message:error.message})
        
    }
    
}
export default userAuth;