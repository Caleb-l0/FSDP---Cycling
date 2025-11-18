const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserModel = require("../Models/User_Model");

const { get } = require("mongoose");


async function getRole(req,res){
     try {
         const role = req.user.role

        
            res.status(200).json(role);
        } catch (error) {
            res.status(500).json({ message: "Server Error", error: error.message });
        }  
   
}

module.exports={getRole}
