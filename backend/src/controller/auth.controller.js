import cloudinary from "../lib/cloudinary.js";
import generateToken from "../lib/generatetoken.js";
import User from "../model/user.model.js";
import bcrypt from "bcryptjs";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Input: ",email , password);
    if (!email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User is not registerd",
      });
    }
    const isPsswdCorrect = bcrypt.compareSync(password, user.password);

    if (!isPsswdCorrect) {
      return res.status(400).json({
        message: "Password is incorrect! Please provide the correct password",
      });
    }
    generateToken(user._id, res);

    return res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error occured while logging in : ", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(401).json({
        message: "All fields are required.",
      });
    } else if (password.length < 6) {
      return res.status(401).json({
        message: "Password must be atleast 6 characters",
      });
    }
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({
        message: "User already registered with this email",
      });
    }
    const newUser = new User({ fullName, email, password: hashedPassword });

    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();

      return res.status(200).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      return res.status(400).json({
        message: "Invalid user data",
      });
    }
  } catch (error) {
    console.log("Error occured while signing up : ", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", {
      maxAge: 0,
      httpOnly: true,
      secure:true,
      sameSite: "None",   // match whatever generateToken uses
      path:"/"
    });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    return res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;
    // console.log("Input to upload profilepic: ",profilePic,userId);
    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );
    
    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const fetchUsers=async(req,res)=>{
  try {
    const users=await User.find({}).select("-password");
    // console.log("Users: ",users);
    return res.status(200).json(users);
  } catch (error) {
    console.log("Error occured in fetching the members ",error.message);
    return res.status(500).json({message:"Internal Server Error"});

  }

}