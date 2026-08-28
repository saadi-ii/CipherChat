import mongoose,{Document, Schema} from "mongoose";

interface user_interface extends Document{
    username : string,
    email : string,
    password : string
}

const user_schema = new Schema<user_interface>({
    username:{
        type: String,
        require: true,
        unique:true
    },
    email:{
        type: String,
        require: true,
        unique:true
    },
    password:{
        type: String,
        require: true
    },
})

const user_model = mongoose.model<user_interface>("user",user_schema)

export default user_model