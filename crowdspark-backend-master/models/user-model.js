import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      // Safety net: ensure the password hash can never be serialized into a
      // response, even when the user document is reached via `.populate()`
      // (which bypasses any `.select("-password")` on the parent query).
      transform: (_doc, ret) => {
        delete ret.password;
        return ret;
      },
    },
  }
);

const UserModel = mongoose.model("users", userSchema);

export default UserModel;