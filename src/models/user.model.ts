import { Schema, model, InferSchemaType, pluralize, Mongoose } from 'mongoose';
import bcrypt from 'bcryptjs';


pluralize(null);

const userSchema = new Schema({
    fullname: {type: String, required: true},
    email: { type: String, unique: true, required: true },
    password: {type: String, required: true},
    isActive: {type: Boolean, default: true}
  
}, { timestamps: true });


interface UserDocument extends InferSchemaType<typeof userSchema>, Document {
    isModified(path: string): boolean;
}


userSchema.pre<UserDocument>('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err as Error);
    }
});


export type User = InferSchemaType<typeof userSchema>;
export const UserModel = model<User>('user', userSchema);

export const createUser = async (user: User): Promise<User> => {
    const userModel = new UserModel({ ...user });
    return await userModel.save();
}

export const updateUser = async (_id: string, user: User): Promise<User | null> => {
    return await UserModel.findByIdAndUpdate(_id, { $set: user }, { new: true, select: '-password -_id -__v' });
}

export const findUserByEmail = async (email: string): Promise<User & { _id: string } | null> => {
    return await UserModel.findOne({ email });
};

