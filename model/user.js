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
        unique: true,
        required: [true, "Please enter a matric number"],
        validate: {
            validator: function (v) {
                return v && v.trim().length > 0; // Ensures matric is not empty or null
            },
            message: "Matric number cannot be empty"
        }
    },
    level: {
        type: String,
        enum: ['100', '200', '300', '400', '500'],
        required: [true, "Academic Level is required"],
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'super-admin'],
        default: 'user'
    },
    email: {
        type: String,
        unique: true,
        required: [true, "Please enter an email"],
        validate: {
            validator: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); // Validates email format
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
    },
    resetPasswordOTP: { type: String },
    resetPasswordExpires: { type: Date }
});

// Ensure unique index on matric and email
UserSchema.index({ matric: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model("User", UserSchema);

// Utility functions

const getUsers = () => User.find();

const getUserByEmail = (email) => User.findOne({ email });

const getUserByMatric = (matric) => User.findOne({ matric });

const getUserById = (id) => User.findById(id);

const getUserBySessionToken = (sessionToken) => User.findOne({ 'authentication.sessionToken': sessionToken });

const createUser = async (values) => {
    // Validate required fields before creating a user
    if (!values.matric || values.matric.trim() === "") {
        throw new Error("Matric number cannot be null or empty");
    }
    if (!values.email || values.email.trim() === "") {
        throw new Error("Email cannot be null or empty");
    }

    // Check for existing users with the same matric or email
    const existingUserByMatric = await User.findOne({ matric: values.matric });
    if (existingUserByMatric) {
        throw new Error("Matric number already exists");
    }

    const existingUserByEmail = await User.findOne({ email: values.email });
    if (existingUserByEmail) {
        throw new Error("Email already exists in database!");
    }

    // Create and save the new user
    return new User(values).save().then((user) => user.toObject());
};

const updateUserById = async (id, values) => {
    // Ensure that matric and email are not empty if they are being updated
    if (values.matric && values.matric.trim() === "") {
        throw new Error("Matric number cannot be empty");
    }
    if (values.email && values.email.trim() === "") {
        throw new Error("Email cannot be empty");
    }

    // Check for unique constraint violations
    if (values.matric) {
        const existingUserByMatric = await User.findOne({ matric: values.matric, _id: { $ne: id } });
        if (existingUserByMatric) {
            throw new Error("Matric number already exists");
        }
    }

    if (values.email) {
        const existingUserByEmail = await User.findOne({ email: values.email, _id: { $ne: id } });
        if (existingUserByEmail) {
            throw new Error("Email already exists in database!");
        }
    }

    // Update the user
    return User.findByIdAndUpdate(id, values, { new: true, runValidators: true }).then((user) => user.toObject());
};

const deleteUserById = (id) => User.findByIdAndDelete(id);

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
