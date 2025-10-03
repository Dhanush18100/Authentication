import express from 'express'
import { isAuthenticated, register, resetPassword, sendResetOtp, sendVerifyOtp, verifyEmail } from '../controllers/authController.js'
import { login, logout } from '../controllers/authController.js';
import userAuth from '../middleware/userAuth.js';

const authRouter=express.Router()

authRouter.post('/register',register);
authRouter.post('/login',login);
authRouter.post('/logout',logout);

//Acount verification using otp
authRouter.post('/send-verify-otp',userAuth, sendVerifyOtp);
authRouter.post('/verify-account',userAuth, verifyEmail);

//user authenication

authRouter.get('/is-auth',userAuth, isAuthenticated);

//reset password using otp
authRouter.post('/sent-reset-otp', sendResetOtp);
authRouter.post('/reset-password', resetPassword);










export default authRouter;