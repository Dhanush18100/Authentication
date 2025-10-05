import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';
import { EMAIL_VERIFY_TEMPLATE,PASSWORD_RESET_TEMPLATE } from '../config/emailTemplates.js';




export const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.json({ sucess: false, message: 'Missing Details' })
    }
    try {

        const existingUser = await userModel.findOne({ email })
        if (existingUser) {
            return res.json({ sucess: false, message: "User already exists" })

        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new userModel({
            name, email, password: hashedPassword
        });
        await user.save()


        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        //sending welcome email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Welcome",
            text: `Welcome, your account with created email id ${email}`
        }

        await transporter.sendMail(mailOptions);
        return res.json({ sucess: true });


    } catch (error) {
        return res.json({ sucess: false, message: error.message })

    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;


    if (!email || !password) {
        return res.json({ sucess: false, message: "Email and passwords are required" })

    }
    try {
        const user = await userModel.findOne({ email })
        if (!user) {
            return res.json({ sucess: false, message: "Invalid email" })
        }
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.json({ sucess: false, message: "Invalid password" })
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        return res.json({ sucess: true });



    } catch (error) {
        return res.json({ sucess: false, message: error.message })

    }


}

export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',

        })

        return res.json({ sucess: true, message: "Logged out" })

    } catch (error) {
        return res.json({ sucess: false, message: error.message })

    }

}

//send verification otp to user email
export const sendVerifyOtp = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await userModel.findById(userId)

        if (user.isAccountVerified) {
            return res.json({ sucess: false, message: "Account allready verified" })
        }
        //generate otp and send to user email
        const otp = String(Math.floor(100000 + Math.random() * 900000)) //6 digit number and convert to string

        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000 //expires in 1 day
        await user.save();

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Account verification OTP",
            // text: `Your OTP is ${otp}. Verify account using this OTP`,
            html:EMAIL_VERIFY_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
        }

        await transporter.sendMail(mailOption)

        res.json({ sucess: true, message: "Verification otp sent on Email" })


    } catch (error) {
        res.json({ sucess: false, message: error.message });
    }

}

export const verifyEmail = async (req, res) => {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
        return res.json({ sucess: false, message: "Missing details" })
    }

    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ sucess: false, message: "User not found" })
        }

        if (user.verifyOtp === '' || user.verifyOtp !== otp) {
            return res.json({ sucess: false, message: "Invalid otp" })
        }
        if (user.verifyOtpExpireAt < Date.now()) {
            return res.json({ sucess: false, message: "OTP Expired" })
        }
        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;
        await user.save();
        return res.json({ sucess: true, message: "Email verified sucessfully" })
    } catch (error) {
        return res.json({ sucess: false, message: error.message })
    }

}

//check if user is authenticated
export const isAuthenticated = async (req, res) => {
    try {
        return res.json({ sucess: true })
    } catch (error) {
        return res.json({ sucess: false, message: error.message })
    }
}

//password reset otp
export const sendResetOtp=async (req,res) => {
    const {email}=req.body;
    if(!email){
        return res.json({sucess:false,message:"Email is required"})
    }

    try {
        const user=await userModel.findOne({email})

        if(!user){
            return res.json({sucess:false,message:"User not found"})
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000)) //6 digit number and convert to string

        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15* 60 * 1000 //expires in 15 min
        await user.save();

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Password rest OTP",
            // text: `Your OTP for reseting password is ${otp}. `,
            html:PASSWORD_RESET_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
        }
        await transporter.sendMail(mailOption)

        return res.json({sucess:true,message:"OTP sent to your email"})
    } catch (error) {
        return res.json({sucess:false,message:error.message})
        
    }
    
}

//Rest user password

export const resetPassword=async (req,res) => {
    const{email,otp,newPassword}= req.body;

    if(!email || !otp || !newPassword){
        return res.json({sucess:false,message:"Email,OTP and new password are required"})
    }
    
    try {
        const user=await userModel.findOne({email})

        if(!user){
            return res.json({sucess:false,message:"User not found"})
        }

        if(user.resetOtp==="" || user.resetOtp!==otp){
            return res.json({sucess:false,message:"Invalid OTP"})
        }
        if(user.resetOtpExpireAt< Date.now()){
            return res.json({sucess:false,message:"OTP Expired"})
        }
        const hashedPassword = await bcrypt.hash(newPassword,10)

        user.password=hashedPassword;
        user.resetOtp="";
        user.resetOtpExpireAt=0;

        await user.save();
        return res.json({sucess:true, message:"Password has been reset sucessfully"})
        
    } catch (error) {
        return res.json({sucess:false,message:error.message})    
    }
}