
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: 
    { type: String, 
    required: true, 
    unique: true
    },
    name:{
        type: String,
        required: true,
        trim: true
    },
    password: { type: String,
    trim: true
    },
    otp: 
    { 
        type: String 
    },
    isVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
