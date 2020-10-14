const express = require("express");
const userRouter = express.Router();
const passport = require("passport");
const passportConfig = require("../../passport");
const JWT = require("jsonwebtoken");
const User = require("../../models/user");
const Facility = require("../../models/facility");


// userRouter.get("/test", (req, res) => {
//     res.send("Test name!!");
// })

const signToken = userID => {
    return JWT.sign({
        iss : "Air Bob",
        sub : userID
    }, "Air Bob", {expiresIn : "1h"});
}

userRouter.post("/register", (req, res) => {
    const { username, email, password, role } = req.body;
    User.findOne({username}, (err, user) => {
        if (err)
            res.status(500).json({message : {msgBody : "Error has occured", msgError: true}});
        if (user)
            res.status(400).json({message : {msgBody : "User username already exists", msgError: true}});
        else {
            const newUser = new User({ username, email, password, role });
            newUser.save(err => {
                if (err)
                    res.status(500).json({message : {msgBody : "Error has occured 2", msgError: true}});
                else
                    res.status(201).json({message : {msgBody : "Account successfully created", msgError: false}});
            });
        }
    }); 
});

userRouter.post("/login", passport.authenticate("local", {session : false}), (req, res) => {
    if (req.isAuthenticated()) {
        const {_id, username, role} = req.user;
        const token = signToken(_id);
        res.cookie("access_token", token, {httpOnly: true, sameSite: true});
        res.status(200).json({isAuthenticated : true, user : {username, role}});
    } else {
        res.send("Didn't Work!");
    } 
});

userRouter.get("/logout", passport.authenticate("jwt", {session : false}), (req, res) => {
    res.clearCookie("access_token");
    res.json({user: {username : "", role : ""}, success : true});
});

userRouter.post("/facility", passport.authenticate("jwt", {session : false}), (req, res) => {
    const facility = new Facility(req.body);
    facility.save(err => {
        if (err)
            res.status(500).json({message : {msgBody : "Error has occured", msgError: true}});
        else {
            req.user.facilities.push(facility);
            req.user.save(err => {
                if (err) 
                    res.status(500).json({message : {msgBody : "Error has occured", msgError: true}});
                else
                    res.status(200).json({message : {msgBody : "Successfully created facility", msgError: false}});
            })
        }
    })
});

userRouter.get("/facilities", passport.authenticate("jwt", {session : false}), (req, res) => {
    User.findById({_id : req.user._id}).populate("facilities").exec((err, document) => {
        if (err)
            res.status(500).json({message : {msgBody : "Error has occured", msgError: true}});
        else
        res.status(200).json({facilities : document.facilities, authenticated : true});
    });
});

// userRouter.get("/admin", passport.authenticate("jwt", {session : false}), (req, res) => {
//     if (req.user.role === "admin"){
//         res.status(200).json({message : {msgBody : "You are an admin", msgError: false}});
//     } else (err) 
//     res.status(403).json({message : {msgBody : "You're not an admin. Go away.", msgError: true}});
// });

userRouter.get('/admin',passport.authenticate('jwt',{session : false}),(req,res)=>{
    if(req.user.role === 'admin'){
        res.status(200).json({message : {msgBody : 'You are an admin', msgError : false}});
    }
    else
        res.status(403).json({message : {msgBody : "You're not an admin,go away", msgError : true}});
});

userRouter.get('/authenticated',passport.authenticate('jwt',{session : false}),(req,res)=>{
    const {username,role} = req.user;
    res.status(200).json({isAuthenticated : true, user : {username,role}});
});

module.exports = userRouter;
