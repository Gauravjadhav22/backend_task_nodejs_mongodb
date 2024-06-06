import mongoose from "mongoose";

const connectDb=(url:string)=>{
    mongoose.set('strictQuery', true)
    return mongoose.connect(url, {
     
    })
}

export default connectDb