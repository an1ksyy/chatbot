import dotenv from "dotenv"
dotenv.config()

export const util = {
    PORT: process.env.PORT || 3000
}