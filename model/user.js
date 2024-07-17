const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: [true, "Please enter a first name"]
    },
    lastname: {
        type: String,
        required: [true, "Please enter a last name"]
    },
    matric: {
        type: String,
        required: [true, "Please enter a matric"]
    },
    level: {
        type: String,
        enum: ['100', '200', '300', '400', '500'],
        required: [true, "Academic Level is required"],
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    email: {
        type: String,
        required: [true, "Please enter an email"],
        unique: [true, "Email already exists in database!"],
        validate: {
            validator: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: '{VALUE} is not a valid email!'
        }
    },
    isMatricApproved: {
        type: Boolean,
        default: false
    },
    authentication: {
        password: {
            type: String,
            required: [true, "Please enter a password"],
            minlength: [6, "Minimum password length is 6 characters"],
            select: true
        },
        sessionToken: {
            type: String,
            select: true
        }
    }
});

const User = mongoose.model("User", UserSchema);

const getUsers = () => User.find();
const getUserByEmail = (email) => User.findOne({ email });
const getUserByMatric = (matric) => User.findOne({ matric });
const getUserById = (id) => User.findById({ _id: id });
const getUserBySessionToken = (sessionToken) => User.findOne({ 'authentication.sessionToken': sessionToken });
const createUser = (values) => new User(values).save().then((user) => user.toObject());
const updateUserById = (id, values) => User.findByIdAndUpdate(id, values);
const deleteUserById = (id) => User.findOneAndDelete({ _id: id });

module.exports = {
    User,
    getUsers,
    getUserByEmail,
    getUserByMatric,
    getUserById,
    getUserBySessionToken,
    createUser,
    updateUserById,
    deleteUserById
};
